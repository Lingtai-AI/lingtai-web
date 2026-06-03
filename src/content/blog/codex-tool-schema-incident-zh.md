---
title: "一次 Codex / gpt-5.5 事故：不是模型坏了，是工具协议漂移了"
date: 2026-06-02
tags: [tech, devlog]
lang: zh
description: "复盘 LingTai codex-provider agent 从 0 API calls 卡死，到定位 Codex backend tool schema 收紧、修复 email schedule no-op，并通过 PR #221 恢复 gpt-5.5 agent 的全过程。"
---

今天这次事故，很值得单独写下来。

它一开始看起来像：Codex OAuth 是不是坏了？gpt-5.5 是不是不可用？LingTai agent 是不是启动失败？

最后发现都不是。

真正的问题是两层：

1. Codex / ChatGPT backend 对 tool schema 的接受范围比我们预期更窄，真实 agent 的工具定义里有 3 类嵌套 schema 会被 backend 拒绝；
2. gpt-5.5 会把 optional object 参数填满默认值，刚好触发了 email tool 里一个“可选字段优先于显式 action”的 latent dispatcher bug，导致 email send/reply 被静默路由成 schedule list no-op。

一个是 backend contract drift。

一个是新模型行为暴露出的工具分发缺陷。

这两件事叠在一起，构成了今天最有价值的一次 agent infra 救火。

---

## 1. 事故入口：一个 0 API calls 的 Codex agent

最初的问题很简单：检查 LingTai 的 Codex OAuth 能不能用。

我们起了一个 `codex` provider 的 LingTai agent，模型是 `gpt-5.5`，端点是：

```json
{
  "provider": "codex",
  "model": "gpt-5.5",
  "base_url": "https://chatgpt.com/backend-api/codex",
  "context_limit": 200000
}
```

结果这个 agent 从 boot 开始就一直卡在 `stuck`。

最诡异的是：

- 0 API calls；
- 0 tokens；
- 没有一次真正成功进入模型；
- 每次都是同一个非常泛的错误：

> An error occurred while processing your request. You can retry your request, or contact us through our help center at help.openai.com if the error persists. Please include the request ID ...

LingTai 的 AED 自动恢复逻辑把它当成上游瞬时故障处理：3 次 retry，3 次 recovery attempt，最后 `aed_exhausted`，进入 sleep。

这套恢复本身没有错。

错的是：这个错误不是瞬时故障。

它是一个稳定可复现、但被 backend 统一包装成 generic server_error 的协议问题。

---

## 2. 最容易误判的地方：所有错误都长一样

这类事故最麻烦的地方是：它会诱导你去猜。

我们一开始排查了很多看起来合理的假设：

- Codex CLI plugin OAuth 是否坏了；
- OAuth token 是否过期；
- `gpt-5.5` model slug 是否不支持；
- 是否缺少 `chatgpt-account-id` 或某些 headers；
- 是否是 backend transient outage；
- 是否是 SDK 版本差异；
- 是否是 daemon 里的 token refresh 逻辑有问题。

这些都被逐一排除了。

`gpt-5.5` 本身能跑。

token 是新的。

backend 也不是全局挂了。

甚至手工构造的一些 reproduction 都能成功。

这时最关键的判断是：

如果我构造的 repro 都成功，而 live daemon 失败，那一定是我的 repro 少了某个真实输入。

不要继续猜。

要抓 live daemon 发出去的真实 request。

---

## 3. 真正的突破：捕获那一个真实请求

这一步也绕了一个很典型的坑。

为了 dump outgoing request，我们加了 debug hook。

但 hook 一直不触发。

最后发现原因非常小，也非常真实：daemon 加载了一个 `.pyc`，它的编译时间比刚改的源码晚 1.8 秒。因为在同一个 2 秒窗口内，Python 认为这个 `.pyc` 仍然“比 source 新”，于是直接用了 stale bytecode。

结果就是：你以为你改了代码，daemon 其实没加载你的改动。

删除 `.pyc`，确认 live-imported source 里真的有 hook，才终于抓到了真实请求。

这个教训很硬：

> editable install 不等于 live edit 一定生效。长生命周期 daemon 调试时，如果你改了 import 路径上的代码，要小心 `.pyc` newer-than-source race。必要时删 `.pyc`，或者用 `PYTHONDONTWRITEBYTECODE` 强制排除缓存干扰。

抓到真实请求后，事情一下清楚了。

这个 `codex-1` 的真实 request 是 188 KB。

里面有：

- `instructions`: 62,435 chars，也就是真实 system prompt；
- 21 个真实 tools；
- 一个 `reasoning` 字段；
- 真实 agent runtime 下构造出来的完整 payload。

而我们之前用来近似复现的 `.prompt` stub 只有 3,486 chars。

也就是说，之前的 reproduction 根本不是同一个世界。

把这份 188 KB 真实 payload 拿去 replay，立刻复现失败。

然后开始二分：instructions / tools / reasoning / input，再按 tool，再按 property。

最后定位到：不是 prompt，不是 reasoning，不是 input。

是 tool schema。

---

## 4. Root Cause #1：Codex backend 拒绝 3 类嵌套 tool schema

Codex ChatGPT backend `/backend-api/codex/responses` 会拒绝 3 类嵌套在 tool property 里的 JSON Schema construct。

更麻烦的是，它们都会返回同一个 generic server_error，没有字段名，没有具体原因。

实测结果：

| 嵌套 construct | backend 行为 | 真实出现位置 |
|---|---|---|
| `oneOf` / `not` | 拒绝 | `email.address`，即 `oneOf[string, array]` |
| 只有 `description`、没有 `type` 的 typeless property | 拒绝 | `secondary.args.*`，影响约 15 个 tools |
| `type: object` 但没有 `properties` | 拒绝 | `daemon.tasks[].backend_options` |
| `enum` / `anyOf` / `allOf` | 接受 | 保持不动 |

这里最阴险的一点是：这 3 个问题分布在 3 个不同工具里。

所以如果只拿单个 tool 做测试，你每次只会看到其中一个问题。

更阴险的是：它们是独立必要条件。

验证矩阵证明：修任意两个，仍然失败；三个都修，才成功。

LingTai 原来的 `_build_responses_tools` 只在 schema root 层 scrub 一些不被接受的 combinator。

但这次问题在 nested property 里。

所以 root-level scrub 不够。

### 修复方式

我们在 `lingtai/llm/openai/adapter.py` 里加了递归 normalizer：`_scrub_responses_schema`。

它做四件事：

- `oneOf` 改写成 backend 接受的 `anyOf`；
- `not` 直接 drop，因为没有可接受的等价表达；
- typeless property node 补 `type: "string"`；
- bare `type: object` 补空的 `properties: {}`。

同时刻意保留 `enum` / `anyOf` / `allOf`，因为 live backend 实测接受它们。

修完后，用同一个真实 21-tool、62 KB instructions 的 payload replay：成功。

这一步很关键。

不是“我觉得应该好了”。

而是拿事故现场的真实 payload 回放验证。

### 4.2 OpenAI backend 到底“突然改了什么”？

这里需要说得严谨一点：我们看不到 OpenAI 内部 commit，也看不到他们哪一个 validator、schema sanitizer 或 gateway rule 在什么时候被改了。因此不能把这件事写成“OpenAI 某某文件某某行改了”。

我们能确定的是黑盒 contract。

也就是说：从同一个 Codex Responses endpoint、同一个真实 agent payload 的 replay / bisect / A-B matrix 看，外部可观测到的行为变成了——`tools[].parameters` 不再接受一部分过去在 OpenAI / JSON Schema 生态里看起来合理、但嵌套在 tool property 里的 schema 形状。

可以把它理解成 backend 的 tool-schema 接受子集突然变窄了。

更具体地说，它不是“所有 JSON Schema 都不行”，也不是“tools 不能用了”，而是嵌套 schema 里有三个形状会触发同一种 opaque `server_error`：

```text
工具参数 schema
└── properties
    ├── address: oneOf[...] / not ...              # 现在拒绝
    ├── secondary.args.xxx: description only       # 现在拒绝
    └── backend_options: { type: object }          # 没有 properties，现在拒绝
```

而这些形状在普通、简化的 repro 里很容易消失：你手写一个 3 KB prompt、只放一两个干净 tool，backend 就能正常返回；只有把真实 agent 的 62 KB instructions + 21 个真实 tools 全部带上，才会踩到这三个 nested construct。

这也是为什么事故一开始看起来像“Codex / gpt-5.5 整体坏了”：backend 没有返回 “`tools[3].parameters.properties.address.oneOf` is unsupported” 这种可行动错误，而是把不同 schema rejection 都包成同一类 server_error。

所以最准确的表述是：

> OpenAI / Codex backend 的 `/responses` 工具参数校验，在真实 agent payload 下，对嵌套 JSON Schema 的容忍度比之前预期更低；它拒绝 nested `oneOf/not`、typeless property、以及无 `properties` 的 object schema，并且没有给出结构化错误。LingTai 的修复不是绕过模型，而是在发送给 Codex 前把工具 schema 规整成这个 backend 当前实际接受的子集。

这和后面的 email schedule no-op 是两件独立的事。

第一件事发生在请求进入模型之前：backend 直接拒绝整个 Responses request，所以是 0 API calls / 0 tokens / agent stuck。

第二件事发生在 agent 已经能调用模型之后：gpt-5.5 更倾向填满 optional object，触发 LingTai email dispatcher 的优先级 bug，让 send 静默变成 schedule list no-op。

一个是上游 backend contract drift。

一个是本地 tool dispatcher latent bug。

把两者分开，才能避免误判成“模型坏了”或“email 修复能解决 Codex server_error”。

### 4.3 “可是它 10 分钟前还能用啊？”

这个问题也很重要。

答案是：对这个 agent 来说，它其实没有“10 分钟前能用”。

`codex-gpt5.5` / `codex-1` 从创建开始就是 0 successful calls。

真正变化的是：gpt-5.5 这个新配置让这类失败第一次变得可达。

之前的 agent、模型或路径没有踩到这组 nested schema 缺口。

这也是 agent infra 里很常见的现象：

一个 bug 可以潜伏很久。

直到一个新模型、新 endpoint、新工具组合、新 schema 形状，把它照出来。

---

## 5. Root Cause #2：email send 不是失败，而是被 schedule no-op 劫持

修完 tool schema 后，agent 终于能说话了。

但马上出现第二个问题：email send 好像“不发送”。

这次不是 backend。

这次是 LingTai email tool 自己的 dispatcher。

追踪结果：

1. agent 确实调用了 `email`，参数里有 `action: "send", address: "human"`；
2. 但 tool 返回的是 `{"status": "ok", "schedules": [], ...}`；
3. 正常 `_send` 应该返回 `{"status": "sent"}`；
4. sent box 没有记录；
5. 没有 `email_sent` log event；
6. `human` 没收到。

也就是说，`EmailManager._send()` 根本没跑。

为什么？

因为 gpt-5.5 在每次 email call 里都把 optional `schedule` object 填了默认值：

```json
"schedule": {
  "action": "list",
  "interval": 0,
  "count": 0,
  "schedule_id": ""
}
```

而 `EmailManager.handle()` 的逻辑是先看 `schedule`：

```python
schedule = args.get("schedule")
if schedule is not None:
    return self._handle_schedule(args, schedule)

action = args.get("action")
if action == "send": ...
```

于是每一次 `send` / `reply` / `dismiss`，都会因为存在 optional `schedule` 字段，被提前劫持到 `_handle_schedule`。

然后 `_handle_schedule` 看见 `schedule.action = "list"`，就返回 schedule list。

表面上 tool 返回 `status: ok`。

实际上 email 从来没有发出去。

这就是最危险的一类 bug：silent no-op。

不是失败。

不是 exception。

而是“看起来成功，但没有做你以为它做的事”。

---

## 6. 为什么这个 bug 以前没爆？

因为以前的模型不会把 optional `schedule` object 填进去。

这个 dispatcher bug 已经潜伏超过一个月。

它的问题不是 schedule 功能本身。

它的问题是：一个可选辅助字段的优先级高于显式 top-level action。

只要模型不填这个字段，就没事。

gpt-5.5 的行为更“完整”：它会倾向于把 optional object 也填上默认值。

于是 latent bug 立刻暴露。

这件事的启发非常大：

> 新模型第一次跑通，不只是测模型能力。它也在测你的 tool dispatcher 是否能承受模型参数填充习惯的变化。

---

## 7. 为什么最后直接移除 email scheduler？

这个问题有两种修法。

一种是 guard：只有当 top-level action 真的是 schedule 时，才处理 schedule object。

另一种是移除 recurring email scheduler。

最后我们选择了后者。

原因很简单：LingTai 的长期定时任务已经更适合走 host cron / launchd / systemd。这个路径更稳定，也更符合真实系统的运维方式。

所以 PR #221 里直接移除了 email 内置 recurring-send scheduler：

- `manager.py`：移除 scheduler thread、`start/stop/_loop/_tick`、所有 `_schedule_*` 方法、startup reconcile、`_handle_schedule` 分支、`_send` 里的 schedule hooks；
- `schema.py`：移除 email tool 的 `schedule` property；
- `__init__.py`：`boot()` 不再启动或 reconcile scheduler；
- `i18n/{en,zh,wen}.json`：清理 orphaned `email.schedule_*` strings。

从这之后，email tool 回到 request/response 模式。

定时任务交给 cron / launchd / systemd。

这也减少了 agent tool schema 的复杂度。

---

## 8. 最终 shipped changes

这次修复进入 kernel PR：

[Lingtai-AI/lingtai-kernel#221](https://github.com/Lingtai-AI/lingtai-kernel/pull/221)

两个逻辑 commits：

```text
3086312 fix(codex): scrub tool schemas the Codex Responses backend rejects
adea979 refactor(email): remove recurring-send scheduler in favor of cron
```

Diffstat：

```text
src/lingtai/llm/openai/adapter.py               |  70 +++-
src/lingtai_kernel/i18n/en.json                 |   4 -
src/lingtai_kernel/i18n/wen.json                |   4 -
src/lingtai_kernel/i18n/zh.json                 |   4 -
src/lingtai_kernel/intrinsics/email/__init__.py |  35 +-
src/lingtai_kernel/intrinsics/email/manager.py  | 404 +-----------------------
src/lingtai_kernel/intrinsics/email/schema.py   |  22 --
7 files changed, 83 insertions(+), 460 deletions(-)
```

这看起来像一个小 PR。

但它解决的是 agent 网络的基础可用性问题。

---

## 9. 验证不是“跑一下就行”

这次最重要的不是写了修复，而是验证路径足够贴近真实事故。

做过的验证包括：

- replay 捕获到的 live 21-tool request：fix 前失败，fix 后成功；
- A/B matrix：证明 3 个 schema 修复都是独立必要项；
- per-construct backend probes：确认 `enum` / `anyOf` / `allOf` 接受，`oneOf` / `not` / typeless / object-no-props 拒绝；
- email package 在 daemon venv 里 import clean；
- email schema 在 en / zh / wen 下都不再暴露 `schedule`；
- `EmailManager.handle()` 不再引用 schedule；
- 没有 dangling callers；
- i18n JSON valid；
- live agent 在 patched code 下重启后离开 `stuck`，能完成 LLM calls；
- email send / reply 能真正送达，并写入 sent box。

这里有一个很重要的原则：

不要只验证“单元测试过了”。

要验证事故最初的真实形状是否消失。

---

## 10. 这次事故真正教会我们的事

我觉得有四条特别重要。

### 第一，opaque error hiding N distinct causes 是最难 debug 的形态

backend 把不同错误都压成同一个 generic server_error + request ID 时，继续猜是浪费时间。

正确路线是抓真实 request，然后二分。

### 第二，“works in isolation, fails in production” 通常意味着 repro 少了真实输入

这次缺的就是：62 KB instructions + 21 个真实工具 + 真实 runtime 构造出来的 schema。

不是一个 3 KB stub prompt 能复现的。

### 第三，`.pyc` 可以让你以为自己在调试，其实没有

长生命周期 daemon + editable install + timestamp race，是非常现实的组合。

源码改了，hook 没生效，不一定是你 hook 写错了。

可能是 Python 还在用旧 bytecode。

### 第四，模型填 optional object 的习惯，会暴露 latent dispatcher bug

以前模型省略 optional object，系统就没事。

新模型把 optional object 填上，系统就出事。

这不是模型“错”。

这是工具设计没把“模型可能填满 schema”当成正常输入。

---

## 11. 还有哪些 follow-up？

这次 PR 解决了 blocking incident，但还有几个后续点值得继续做。

### Codex token refresh 还有 latent flaw

`_register.py` 里的 `_codex` factory 现在把 refresh 逻辑挂在 `create_chat` / `generate` 上。

但真实 API calls 发生在 `CodexResponsesSession.send()` / `send_stream()`。

也就是说，token 现在是在 session creation 时刷新，之后长 session 可能继续用旧 token。

这次不是它导致的，因为 token 很新。

但这是独立的长会话风险，应该后续修到 send path 里。

### 需要审计其他 tool dispatcher

Codex schema scrub 解决的是 backend rejection。

但 email 这次暴露的是另一个类别：模型过度填充 optional object，而 dispatcher 又在 primary action 前分支。

这种模式可能不只 email 有。

后续应该审计所有“先看 optional field，再看 action”的工具。

### Secret hygiene 要制度化

调试复杂事故时，很容易把本地配置、请求 payload、环境变量打到日志里。

如果完整 transcript 或 terminal log 会被长期保存或分享，就必须检查有没有敏感配置被打印，并按需轮换。

这个不是这次 PR 的代码问题，但它是 infra 调试必须养成的习惯。

---

## 12. 最后的结论

这次事故表面上是 Codex / gpt-5.5 agent 卡死。

实际上是一次 agent infra 压力测试。

它告诉我们：agent 的可靠性不是“模型聪明”四个字能覆盖的。

真正的 agent 系统里，有模型，有 backend，有 tool schema，有 runtime adapter，有 dispatcher，有 bytecode，有日志，有邮箱，有发布流程。

任何一层契约漂移，都可能让整个 agent 网络停在门口。

今天我们做的事，是把一个 0 API calls 的 stuck agent 拆开，抓到真实 188 KB request，定位到 3 个 backend schema rejection 点，补上 recursive scrub；然后又发现 gpt-5.5 optional object 填充触发 email schedule no-op，最后移除 email 内置 scheduler，把 recurring work 交还给 host cron。

这不是“AI 写代码”的故事。

这是“AI agent 作为工程系统”开始变硬的故事。

未来的软件工程里，真正重要的不只是让模型会回答。

而是让模型、工具、runtime、backend 和人类判断组成的执行网络，在底层契约变化时还能继续运转。

这次事故提醒我们：

agent 不是一个 prompt。

agent 是一套会被现实世界打磨的基础设施。
