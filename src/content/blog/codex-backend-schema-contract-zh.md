---
title: "Codex OAuth 不是答案：一次 LingTai gpt-5.5 工具 Schema 事故的分层复盘"
date: 2026-06-03
tags: [tech, devlog]
lang: zh
description: "复盘 LingTai gpt-5.5 / Codex backend 工具 schema 事故：为什么 Codex OAuth 不是充分解释，ChatGPT/Codex Responses backend 的 schema 接受子集如何触发故障，以及为什么应该针对 Codex backend 做专门适配，而不是全局降级所有 OpenAI-compatible backend。"
---

> 发布状态：2026-06-03 发布于 lingtai.ai。本文基于当天 Codex/gpt-5.5 工具 schema 事故排查记录整理。
> 这篇文章的目标不是给事故找一个戏剧化解释，而是把今天排查过程中所有容易混淆的层拆开：Codex OAuth、ChatGPT/Codex backend、Responses API surface、工具 JSON Schema、LingTai adapter、以及其他 OpenAI-compatible backend 到底各自承担了什么。

## TL;DR

今天最容易误判的一句话是：**“很多 agent 都用了 Codex OAuth，为什么只有我们炸？”**

后来我们把问题拆开后，答案变得更清楚：

1. **Codex OAuth 是身份层，不等于请求协议层。** 用同一个 ChatGPT/Codex OAuth token，不代表发送的是同样的 payload、同样的 tool schema、同样的 tool 数量、同样的 adapter scrub 规则。
2. **这次炸点不是模型推理失败，而是请求进入模型前的 backend tool-schema validation 失败。** 失败特征是 0 API calls / 0 tokens / AED exhausted；模型还没开始思考，backend 已经拒绝了工具 schema。
3. **Codex backend 不是普通 OpenAI-compatible `/chat/completions`。** LingTai 的 Codex preset 指向 `https://chatgpt.com/backend-api/codex`，并走 Responses 风格路径；DeepSeek、Zhipu、MiMo 默认走 OpenAI-compatible Chat Completions surface。
4. **最小黑盒 probe 显示，DeepSeek / Zhipu / MiMo 接受 Codex 拒绝的三类 schema 形状。** 所以这不是“所有 OpenAI-compatible backend 一起收紧”。
5. **我们救火时差点病急乱投医：把 Codex backend 的限制误认为所有 backend 的限制。** 正确方向是：针对 Codex backend / Responses surface 做专门 adapter 和 schema scrub，而不是把所有 provider 的工具 schema 全局降级。
6. **当前真正失去的能力主要发生在 Codex/Responses surface：** 部分 JSON Schema 表达力被牺牲，以换取 Codex backend 接收请求。默认 DeepSeek/Zhipu/MiMo Chat Completions 路径不应被一起降级。

---

## 1. 事故为什么显得“很奇怪”

普通 LLM API 事故通常有几种常见形态：

- API key 或 quota 错误；
- 网络超时；
- 模型返回格式不符合预期；
- tool call 参数不合法；
- agent 执行工具时报错。

但这次 Codex/gpt-5.5 的形态不一样：

- 请求看起来已经构造完成；
- 但 backend 在模型执行前拒绝；
- 错误表面上是 opaque `server_error`；
- token 计数是 0，说明模型没有真正开始生成；
- agent 的工具系统没有获得正常模型回复；
- 因而表现为“agent 还没动手，手脚就被 backend 绑住”。

这类错误尤其危险，因为它不像普通 runtime exception 那样告诉你“哪个工具参数错了”。它是在 **模型调用 contract** 这一层断掉：我们以为发送的是一个 OpenAI-compatible tool schema，但 Codex backend 实际接受的是更窄的子集。

---

## 2. 五层模型：不要把 Codex OAuth 当成全部解释

这次排查里，最重要的认知修正是：**OAuth、backend、API surface、payload、schema 是五层不同的东西。**

| 层 | 问题 | 例子 | 是否足以解释本事故 |
|---|---|---|---|
| 身份层 | 用什么凭据登录？ | Codex OAuth / ChatGPT account token | 不足。很多工具都可能用 Codex OAuth。 |
| backend 入口层 | 请求打到哪里？ | `https://chatgpt.com/backend-api/codex` vs `https://api.deepseek.com` | 重要。Codex backend 不是普通 OpenAI-compatible gateway。 |
| API surface 层 | 使用什么协议形态？ | Responses style vs Chat Completions style | 重要。tool schema 的位置和 validator 可能不同。 |
| payload 组织层 | 发送多少上下文和工具？ | LingTai 完整 21 real tools、约 188 KB 请求、62,435-char instructions | 很重要。触发 backend validator 的是具体 payload。 |
| schema 形状层 | 工具 JSON Schema 长什么样？ | nested `oneOf/not`、typeless property、bare object | 直接触发点。 |

所以，“openclaw / Hermes / 其他 agent 也用 Codex OAuth 却没炸”并不矛盾。它们可能在任意一层不同：

- 同样 OAuth，但 tool schema 更简单；
- 同样 OAuth，但没有把 LingTai 的 21 个能力工具全部转成 JSON Schema；
- 同样 backend，但 adapter 先做了 schema scrub；
- 同样 backend，但使用 Codex CLI 自己的工具协议，而不是 LingTai 的 MCP/能力工具 schema；
- 同样 provider 名称，但实际通过 OpenRouter / MiMo / custom OpenAI-compatible route 调用。

**结论：Codex OAuth 是必要背景，不是充分解释。真正要看的是请求形态和 schema 形状。**

---

## 3. 真实触发点：Codex Responses backend 拒绝了三类 schema

排查中我们捕获并最小化了请求，结论是 Codex backend 至少拒绝以下三类 schema shape：

### 3.1 nested `oneOf` / `not`

`oneOf` 和 `not` 是 JSON Schema 里很自然的表达方式：

- `oneOf`：要求恰好满足一个分支；
- `not`：表达否定约束；
- 配合 `if/then` 可以表达条件必填、互斥参数等。

但 Codex Responses backend 对这类 nested combinator 很敏感。LingTai 的修复策略是：

- `oneOf` 改写为 backend 接受的 `anyOf`；
- `not` 没有等价替代，只能 drop。

这不是无损转换。`oneOf -> anyOf` 会把“恰好一个”变成“至少一个”。如果两个分支天然互斥，比如 string vs array，实际损失很小；如果分支可能重叠，语义就变弱。

### 3.2 typeless property：只有 `description`，没有 `type`

一些 nested schema 节点本来只是“宽松参数槽”，可能只有 description，没有明确 type。普通 OpenAI-compatible backend 往往能接受这种宽松 schema，或者至少不在 preflight 阶段拒绝。

Codex backend 会拒绝这类 typeless property。LingTai 的应急修复是：如果节点有 `description` 但没有 type-establishing key，就补 `type: "string"`。

这能救请求，但也带来语义窄化：一个原本 loose/any 的字段，模型现在会被暗示为 string。

真实影响点之一是 nested `secondary.args.*`：这些参数用于主工具执行前顺手做通信 read/reply/send。它们本来可能是 int、list、object 或其他 provider-specific shape；被补成 string 后，模型可能更容易把 `chat_id`、`email_id` 等填成字符串形态。

### 3.3 `type: object` 但没有 `properties`

自由对象在 JSON Schema 里很常见：

```json
{"type": "object"}
```

这通常表示一个 free-form object。LingTai 里真实例子是 `daemon.tasks[].backend_options`：它用于给 Claude Code / Codex CLI / OpenCode 这类外部 agent backend 传自由 CLI flags。

Codex backend 拒绝 bare object，于是修复策略是补：

```json
{"type": "object", "properties": {}}
```

严格按 JSON Schema，`additionalProperties` 默认是 true，所以这未必真的禁止任意键。但模型看到空 `properties` 时，会更不容易主动填高级 flag；因此损失主要是“可发现性”和“模型自信度”，不一定是 runtime 能力消失。

---

## 4. 为什么 Codex backend 会有这样的要求？

这里必须诚实：我们没有 OpenAI/Codex backend 的内部实现，只能基于黑盒行为推断。比较合理的解释有几个。

### 4.1 Responses tool validator 可能不是完整 JSON Schema validator

很多 LLM provider 声称支持 “JSON Schema tools”，但实际支持的通常是一个工程化子集。原因很简单：完整 JSON Schema 太复杂，包含大量模型不一定能稳定遵守的构造：

- `oneOf` 的精确互斥；
- `not` 的负约束；
- 条件 schema；
- `$ref` 递归；
- pattern-based properties；
- 任意 free-form object。

对工具调用来说，backend 可能只想要一个更接近“表单字段定义”的 schema：字段名、类型、枚举、数组元素、对象 properties。这种子集更容易喂给模型，也更容易做 preflight validation。

### 4.2 Codex backend 可能更强调可执行性和沙箱安全

Codex 不是普通聊天模型入口。它面向 coding agent，工具调用往往会引发真实文件操作、shell 命令、patch、测试、网络请求等。对这类场景，backend 可能比普通 chat-completions 更偏好：

- 所有工具参数都有明确类型；
- object 都有明确 properties；
- 不允许 ambiguous union；
- 不允许负约束这类模型难以直观遵守的 schema；
- 在请求进入模型前尽早拒绝不可解释 schema。

这能解释它为什么“更严格”，但不能解释为什么错误会以 opaque `server_error` 的形式暴露。后者是 backend 可观测性问题：如果 validator 拒绝 schema，应该返回结构化 schema validation error，而不是像内部错误一样的 server error。

### 4.3 Responses surface 和 Chat Completions surface 的 contract 不一样

Chat Completions 里的 tool schema 通常位于：

```json
{"tools": [{"type": "function", "function": {"parameters": ...}}]}
```

Responses 风格工具则更扁平：

```json
{"tools": [{"type": "function", "name": "...", "parameters": ...}]}
```

这不只是字段位置变化。不同 surface 背后可能是不同 validator、不同 planner、不同 tool routing 逻辑。一个 backend 在 Chat Completions 里接受的 schema，不代表它在 Codex/Responses surface 也接受。

### 4.4 “突然变严格”可能是接受子集变窄，而不是模型能力下降

事故中模型没有消耗 token，说明不是 gpt-5.5 变笨、不会调用工具；是 backend 在模型前面挡住了请求。

更准确的描述是：**Codex backend 的 tool-schema 接受子集发生了变化，或者原本未严格校验的路径开始严格校验。**

---

## 5. 为什么 DeepSeek / Zhipu / MiMo 没有一起炸

我们做了最小黑盒 probes，把 Codex 拒绝的三类 shape 分别发给 DeepSeek、Zhipu、MiMo。结果：

| Provider | clean | nested `oneOf` | typeless property | bare object no properties |
|---|---:|---:|---:|---:|
| DeepSeek | HTTP 200 | HTTP 200 | HTTP 200 | HTTP 200 |
| Zhipu / GLM | HTTP 200 | HTTP 200 | HTTP 200 | HTTP 200 |
| MiMo | HTTP 200 | HTTP 200 | HTTP 200 | HTTP 200 |

这说明至少在测试时点，这三个 OpenAI-compatible backend 没有应用 Codex 那套严格 preflight 规则。

更重要的是，LingTai 的默认路径也不同：

- Codex provider：ChatGPT/Codex backend + Responses path；
- DeepSeek/Zhipu/MiMo：OpenAI-compatible Chat Completions path。

因此这不是“所有 OpenAI-compatible backend 一起收紧”。它更像是 Codex/Responses backend 的单独 contract 漂移。

---

## 6. openclaw / Hermes 没炸，不能简单归因为“不用 Codex OAuth”

我早先报告里说“openclaw / Hermes 很可能没走 Codex Responses path”，这个说法需要降级：它可能对，也可能不完整。

Jason 提醒得对：**Codex OAuth 应该是很多 agent/CLI 都在用。** 因此正确问题不是“它们有没有 Codex OAuth”，而是：

| 层 | 需要确认的问题 |
|---|---|
| OAuth 身份层 | 是否用 ChatGPT/Codex OAuth token？ |
| backend API 层 | 是否打到 `backend-api/codex`？是否是 Responses style？ |
| tool schema 层 | 是否发送和 LingTai 类似的完整 JSON Schema？有多少 tools？有没有 nested `oneOf/not`、typeless property、bare object？ |
| adapter scrub 层 | 是否在发送前做了 schema normalize/scrub？ |
| 调用时机层 | 是否刚好触发了 tool schema path？还是纯文本/少工具调用？ |

只有这些条件同时踩中，才会复现 LingTai 这次事故。

所以更稳妥的结论是：**openclaw / Hermes 没炸，不证明 Codex OAuth 没问题；只说明它们没有在同一时刻发送同样会被 Codex backend 拒绝的 tool schema payload。**

---

## 7. 我们今天“病急乱投医”的点

事故现场最容易做的事是：为了让 Codex 恢复，快速把 schema 改到最保守、最容易被接受的形态。

这在救火阶段可以理解。因为当 agent 完全无法启动工具调用时，第一优先级是恢复可用性。但危险在于：

- 如果把 Codex 的严格规则误认为所有 backend 的规则；
- 如果把应急 scrub 放到全局 schema 生成层；
- 如果让 DeepSeek/Zhipu/MiMo 这些本来能接受 richer schema 的 backend 也看到降级版 schema；
- 那我们就会为了兼容一个 backend，牺牲所有 backend 的表达力。

后续代码检查给了一个重要修正：**至少按 v0.11.2 发布逻辑，scrub 应该属于 `_build_responses_tools(...)` / Responses path，而不是普通 `_build_tools(...)` / Chat Completions path。**

这就是正确方向：**局部适配，不全局爆破。**

---

## 8. 我们实际失去了什么能力？

这里分两种情况。

### 8.1 当前应该只在 Codex/Responses surface 失去的能力

#### A. 根层组合/条件约束

Codex/Responses scrub 会删除根层 `allOf/oneOf/anyOf/not/enum`。

真实影响：`avatar` tool 的 schema 用 `allOf + if/then/not` 表达条件必填：

- `spawn` 需要 `name`；
- `rules` 需要 `rules_content`；
- 不同 action 对必填字段有不同要求。

删除后，模型仍能从 description 里读懂一部分，但 backend 不再给它强 schema 约束。损失是：模型第一次 tool call 更容易漏填参数。

运行时 handler 仍会校验，所以这不是安全灾难；它是调用质量下降。

#### B. `oneOf` 互斥语义变弱

nested `oneOf` 被改成 `anyOf`。

真实影响：`email.address` 是 string 或 string array。对这个例子，因为 string 和 array 类型天然互斥，实际差别很小。但原则上，`oneOf` 的“恰好一个分支”语义会丢失。

#### C. `not` 负约束丢失

`not` 没有安全等价替代，只能 drop。

损失是模型看不到“禁止某种组合”的结构化约束，只能靠文字说明和 runtime validation。

#### D. typeless property 被窄化为 string

这影响 nested `secondary.args.*` 这类 loose 参数。它们本来可能是 int/list/object，现在模型会被 schema 暗示为 string。

损失是 nested communication 的可靠性下降：例如某些 read/reply/send 的嵌套参数，本该保留原始类型，但模型可能更倾向于字符串化。

#### E. free-form object 的可发现性下降

`daemon.tasks[].backend_options` 这类自由 object 会从：

```json
{"type": "object"}
```

变成：

```json
{"type": "object", "properties": {}}
```

严格 JSON Schema 下 additionalProperties 默认仍允许任意键，但模型看到空 properties 会更少主动探索高级参数。损失是可发现性，而非一定的 runtime 禁用。

### 8.2 如果未来错误地全局 apply，会额外失去什么

如果把 Codex scrub 全局应用到 DeepSeek/Zhipu/MiMo/OpenRouter/custom provider，那么会多失去：

- 其他 backend 对 richer JSON Schema 的原生支持；
- provider 之间的差异观测能力；
- 更强的模型端参数约束；
- 更准确的 tool-selection signal；
- 针对强 schema backend 的未来优化空间。

这就是为什么建议必须是 per-provider/per-surface，而不是全局。

---

## 9. 正确工程方向

### 9.1 建立 provider capability matrix

不要用一个全局 bool 决定 schema 形态。应该显式描述 provider/surface 支持什么：

```text
supports_responses_tools
supports_nested_oneOf
supports_nested_not
supports_typeless_property
supports_freeform_object
supports_root_combinators
requires_object_properties
```

Codex/Responses 可以是最保守 profile；DeepSeek/Zhipu/MiMo 默认 Chat Completions 可以保留更完整 schema。

### 9.2 保留 raw schema 和 scrubbed schema 双版本

每个工具 schema 应该有两个视角：

- canonical raw schema：LingTai 真正想表达的工具 contract；
- provider-specific transmitted schema：某 provider 实际能接受的降级版本。

这样后续 debug 时可以回答：

- 我们原本想表达什么？
- 为了某 provider 改掉了什么？
- 哪些语义损失是可接受的？
- 哪些应该通过 runtime validation 或 prompt 补回来？

### 9.3 加 schema acceptance regression tests

这次最小 probes 很有价值，应该产品化：

- 对每个 provider 跑 clean / nested oneOf / typeless / bare object / root allOf 等最小 schema；
- 记录 HTTP status 和错误 body；
- 把结果写进 provider capability matrix；
- 避免下次 backend contract 漂移时靠事故现场肉眼判断。

### 9.4 backend 拒绝错误要更可观测

如果 backend 只返回 opaque `server_error`，adapter 应该尽量在本地 preflight：

- 检查将要发送的 tool schema 是否包含 provider 已知不支持的 shape；
- 输出“哪个 tool / 哪个 path / 哪个 schema construct”被 scrub；
- 在 debug 日志里记录 scrub diff（注意不泄漏 secrets）。

### 9.5 runtime validation 仍然必须保留

schema 给模型看，不等于安全边界。所有关键工具仍需要 runtime validation：

- action 是否允许；
- 必填参数是否存在；
- 类型是否正确；
- 路径/网络/删除/发布等副作用是否经过授权；
- provider-specific loose object 是否安全。

Codex scrub 牺牲的是模型侧引导，不应该牺牲 runtime 安全。

---

## 10. 对这次事故的最终解释

如果要用一句话总结：

> 这不是 gpt-5.5 不会用工具，也不是所有 OpenAI-compatible backend 都变严格，而是 ChatGPT/Codex Responses backend 对 tool JSON Schema 的接受子集变窄或开始严格执行；LingTai 的完整 21-tool schema 刚好包含它拒绝的 nested combinator、typeless property 和 bare object，于是请求在模型执行前被挡下。

如果再加一句工程教训：

> 修 Codex 应该修 Codex adapter，不应该把所有 backend 的 schema 能力一起炸掉。

---

## 附：本文依据的证据

- LingTai Codex preset / adapter 指向 ChatGPT/Codex backend，而不是普通 OpenAI-compatible `/chat/completions`。
- 事故请求捕获显示约 188 KB payload、62,435-char instructions、21 real tools。
- 错误发生于模型执行前：0 API calls / 0 tokens / opaque server_error。
- 最小 schema probe 显示 DeepSeek、Zhipu、MiMo 对 clean / nested_oneOf / typeless_property / bare_object_no_properties 均返回 HTTP 200。
- 代码检查显示普通 Chat Completions tools 由 `_build_tools(...)` 构造，Responses tools 由 `_build_responses_tools(...)` 构造，scrub 应属于 Responses path。
- capability-loss addendum 总结了 Codex/Responses scrub 对 `avatar`、`email.address`、`secondary.args.*`、`daemon.backend_options` 的实际语义影响。

## 附：不确定性声明

- 我们没有 OpenAI/Codex backend 内部实现，所以“为什么 Codex 这样要求”只能基于黑盒行为推断。
- openclaw/Hermes 等 agent 的内部请求 payload 未全部捕获；不能只根据是否使用 Codex OAuth 判断是否会复现。
- provider 行为可能随时间变化；今天 DeepSeek/Zhipu/MiMo probe HTTP 200，不代表未来永远如此。因此 provider capability matrix 应该可重复运行，而不是写死在文档里。
