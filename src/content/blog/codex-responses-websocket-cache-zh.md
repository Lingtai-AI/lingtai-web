---
title: "LingTai 如何终于让 Codex Responses 缓存粘住：ws_full、ws_incremental 与 WebSocket 状态链"
date: 2026-06-23
author: Zesen Huang
tags: [tech, devlog]
lang: zh
description: "一篇源代码与实测驱动的深度复盘：为什么 store=true 走不通，ws_full 与 ws_incremental 分别是什么意思，previous_response_id 为什么必须留在同一条 WebSocket 连接上，以及 LingTai 如何让 Codex 缓存链稳定下来。"
---

<div class="callout callout-tldr">

**太长不看**

Codex cache 不是靠某个神奇的 `store=true` 开关修好的。对 ChatGPT-backed Codex endpoint 来说，这条路是关着的：它要求 `store=false`。真正可行的路径更接近官方 Codex CLI：保持 `store=false`，保持稳定的 cache-affinity identity，通过 Responses-over-WebSocket 走同一条持久连接，记住上一次被服务端接受的 request / response，然后下一轮只发送严格后缀加 `previous_response_id`。在 LingTai 的 ledger 里，完整请求叫 `ws_full`，真正的增量续接叫 `ws_incremental`。

最意外的部分并不只是“改用 WebSocket”。我们还确认了：`previous_response_id` 必须在同一条 live WebSocket connection 上才认；delta baseline 必须用 LingTai converter 生成的稳定 input schema，而不能拿服务端 raw output schema 直接拼；旧工具输出必须按 `call_id` 冻结成模型当时见过的字节串，因为会移动的 runtime metadata 会让 prefix match 失败。最后形成的是一条安全状态链：能证明 prefix 时才走 `ws_incremental`，证明不了就退回 `ws_full`；定期或 summarize 后开启 fresh epoch；并明确告诉操作者，连续 summarize 会连续打断 Codex 的 response-id cache chain。

</div>

这篇文章是 kernel v0.14.1 release note 的长版技术解释。release note 讲的是“发了什么”；这篇讲的是“为什么之前 cache 不住、现在怎么 cache 住、`ws_full` / `ws_incremental` 到底在说什么”。

相关实现主要在：

- `src/lingtai/llm/openai/adapter.py`
- `src/lingtai/llm/openai/codex_ws.py`
- `tests/test_codex_ws_session.py`
- `tests/test_codex_ws_delta.py`
- `tests/test_codex_ws_tool_result_freeze.py`
- `tests/test_codex_prompt_cache_key.py`

下文只讲协议形状、状态机和排障结论，不展示任何 token、header secret 或私有请求体。

## 症状：前缀明明几乎一样，cache 却总是冷掉

LingTai 的 agent 不是一次性 chat completion。它会长时间运行、收邮件、调用工具、派 daemon、写记忆、凝蜕，并且带着很大的 system prompt、工具定义、技能/知识目录和对话历史。对 provider 来说，大多数请求都有一个巨大的稳定前缀：

1. 系统提示和 runtime guidance；
2. 工具定义；
3. character / pad / skills / knowledge catalog；
4. 之前的对话和工具结果；
5. 当前轮真正新增的内容通常只是一个很小的 suffix。

理论上，prompt caching 应该让这段前缀在第一轮之后变便宜：backend 保留一份热前缀，后续命中时不再把整段前缀当作全新输入计费。

但在这一轮工作之前，Codex 的 cache 表现并不稳定。token ledger 里有时能看到 cached tokens，有时又掉得很厉害；长跑 agent 仍然像是在反复摄入大段完整上下文。

这个症状其实包含两个问题：

- **Cache affinity：** 请求有没有被路由到同一个热 cache identity？
- **State continuity：** 客户端能不能根本不重发已经被服务端接受过的 transcript？

第一个问题对应 `prompt_cache_key`、`session_id`、`thread_id` 的稳定性。第二个问题对应 WebSocket 上的 `previous_response_id` 状态链。两者相关，但不是同一层。

## 第一层：prompt cache affinity 是身份，不是状态

之前的排查已经确认：Codex 请求需要一个稳定的身份 envelope。LingTai 现在默认用诚实身份，而不是伪装成官方 CLI：

```text
originator: lingtai
User-Agent: LingTai/<installed-version>
```

另外，在 anchored Codex 路径里，cache-affinity identity 会稳定地用于：

```text
prompt_cache_key == session_id == thread_id
```

关键不是这个字符串长什么样，而是它**稳定**：不带时间戳，不带 epoch salt，不随 refresh 随机变化。如果这个 identity 每轮都变，backend 就会把同一段长前缀看成一群陌生请求，热 cache 自然粘不住。

但是，这层只解决“backend 去哪里找热前缀”。它不能让普通 REST 请求变成 stateful 请求。也就是说，即使 `prompt_cache_key` 稳定，客户端仍然可能每轮都构造并发送完整 `input` 数组。Prompt cache 可以给重复 token 打折，但它不等于“只上传 delta”。

要做到不重发完整 transcript，还需要第二层。

## 走不通的门：公开 Responses 的 `store=true`

最自然的想法是：既然叫 Responses API，那能不能像公开 Responses state 那样用？

直觉方案是：

```text
第一轮：
  store=true
  没有 previous_response_id
  input = 完整 bootstrap transcript

第二轮：
  store=true
  previous_response_id = 第一轮 response id
  input = 只有新增 delta
```

很多人会以为 stateful Responses 就该这么用。但 ChatGPT-backed Codex endpoint 不接受这条路。

实测 `/backend-api/codex/responses` 时，`store=true` 被明确拒绝；backend 要求 `store=false`。官方 Codex CLI 的源码也指向同一个结论：对 ChatGPT Codex provider，它构造的是 `store=false` 请求，而不是公开 Responses 的 server-side storage。

所以第一个重要结论是负面的：

> 这条 Codex endpoint 不能靠打开 `store=true + previous_response_id` 来修 cache。

这点很重要，因为它避免了错误解释。LingTai 没有“启用 store”。最终可行的机制始终保持 `store=false`。

## REST + `store=false`：稳定，但仍然是 full replay

排除 `store=true` 之后，REST path 的契约变得很清楚：

```text
POST /backend-api/codex/responses
store = false
input = 当前完整 transcript
previous_response_id = 不发送
```

LingTai 仍然会在相关 Codex Responses 请求上发送稳定的 `prompt_cache_key`，所以之前的 cache-affinity 工作仍然有价值。但在 REST + `store=false` 下，`previous_response_id` 不参与。每一轮逻辑上仍然是 full replay。

这就是为什么只修 `prompt_cache_key` 还不够。它让 backend 更容易认出重复前缀，但它没有创造一个增量 transcript 协议。

缺的那块，是 Codex-specific 的 WebSocket state chain。

## 官方 CLI 给出的线索：客户端自己维护 delta state

读官方 Codex CLI 源码时，我们看到 WebSocket path 不是靠 `store=true`。它在客户端本地维护状态：

- 上一次被服务端接受的 request；
- 上一次服务端返回的 response id；
- 服务端新增的 output items；
- 一套 request shape / prefix 检查，判断当前 full request 是否严格延长了上一个 baseline。

下一轮时，客户端比较：

```text
baseline = previous_request.input + previous_response.items_added
current  = current_full_request.input
```

如果 `current` 以 `baseline` 开头，那么 suffix 就可以安全作为 delta 发送：

```text
delta = current[len(baseline):]
```

然后 WebSocket frame 可以写成：

```text
store = false
previous_response_id = <last response id>
input = delta
```

这就是 LingTai `ws_incremental` 的核心。它不是在用 `store=true` 请求公开 Responses 存储；它是在同一条 Codex WebSocket 状态链上，请 backend 从它已经知道的 response id 继续。

## 两个 ledger mode：`ws_full` 和 `ws_incremental`

LingTai 把请求模式写进 usage metadata，方便操作者判断这一轮到底走了什么路径。

### `ws_full`

`ws_full` 的意思是：

```text
使用了 WebSocket path，
但发送的是当前完整 Responses input，
没有附带 previous_response_id。
```

它通常出现在：

- WebSocket session 还没有 baseline（`no_baseline`）；
- 没有可用的 previous response id；
- 当前请求无法严格匹配上一个 baseline（`prefix_mismatch`）；
- 非 input 字段变化，无法安全续接；
- 到了定期 fresh epoch；
- 本地 history 被 summarize，必须开启新的远端 epoch。

`ws_full` 不一定是 bug。它是安全模式。它的含义是：“我不能证明远端 response chain 正好等于本地 transcript，所以我从本地真相重建一次。”

### `ws_incremental`

`ws_incremental` 的意思是：

```text
使用了 WebSocket path，
知道 previous response id，
当前 input 严格延长了保存的 baseline，
所以只发送 suffix。
```

这个 frame 会带：

```text
store = false
previous_response_id = <last response id>
input = <delta only>
```

这才是长跑 agent 真正想要的形态：不再每轮重发整个 transcript，而是只把上一轮之后新增的东西发过去。

## 隐藏条件：必须是同一条 WebSocket 连接

第一版 WebSocket state chain 仍然失败过，而且失败信息非常关键。

LingTai 第二轮确实带了 `previous_response_id`，但它重新开了一条 WebSocket 连接。服务端拒绝了，含义大致是：

```text
Previous response with id ... not found.
```

然后我们做了手动 probe，把两次请求放在同一条 WebSocket 连接上：

1. 第一轮：完整 input，没有 previous response id；
2. 服务端返回 response id；
3. 同一条连接上的第二轮：delta input 加这个 response id；
4. 服务端接受。

这证明了一条很具体的规则：

> 在 ChatGPT Codex WebSocket path 上，`previous_response_id` 的连续性绑定在同一条 live WebSocket connection / session 上。只在本地记住 id 还不够，续接必须留在建立该 id 的那条连接上。

所以 LingTai 改成让 `CodexResponsesSession` 在同一个 ChatSession 内复用 WebSocket transport；遇到 transport failure 或 epoch reset 时才关闭/重置。

也就是说，“现在发送 `previous_response_id`”不是完整解释。真正的机制是：**persistent transport + local baseline + response id** 一起工作。

## `x-codex-turn-state`：粘性路由，不是长期 cache key

Codex path 还有一个 opaque 的 `x-codex-turn-state`。LingTai 对它的处理比较保守：

- 从 WebSocket handshake / response path 捕获；
- 在同一个 provider turn / tool loop 内需要时 replay；
- 新的用户文本轮开始时 reset；
- 不把它和 `prompt_cache_key` / `session_id` / `thread_id` 混为一谈。

可以把它理解成 provider 内部的 sticky routing 或 turn-state metadata。它帮助 backend 继续同一个活跃 turn，但它不是长期 cache identity。长期稳定身份还是 cache-affinity triple；真正的远端 response 续接还是 WebSocket 上的 response-id chain。

## 为什么 baseline 必须由 converter 生成

解决连接复用之后，还有一些 turn 仍然退回 `ws_full`。看起来语义上明明是连续的，为什么 prefix match 失败？

根因是 schema shape。

LingTai 本地有自己的 chat interface。发送给 Codex Responses 之前，会被转换成 Responses input items。服务端流回来的 output items 又是服务端 output schema。这两者相关，但不一定字节相同。

最直觉的 baseline 是：

```text
baseline = previous request input + raw server output items
```

问题是，下一轮的 `current_full_request.input` 是 LingTai converter 重新从本地 interface 生成的。如果 baseline 里混入 raw server output shape，而 current input 是 converter-produced input shape，严格 prefix compare 就可能每轮都失败。

修复方式是：assistant turn 被记录回 LingTai interface 之后，再用同一个 converter 生成 baseline。也就是说：

```text
baseline = converter_stable_input_after_last_turn
```

下一轮 current input 也是同一个 converter 生成的，prefix match 才有意义。

这里不能用“差不多相等”。增量续接必须在实际发送给 backend 的 request representation 上严格成立。证明不了，就不能冒险。

## 为什么旧工具输出必须 freeze

工具调用让 baseline 更麻烦。

LingTai 的工具结果里会带 runtime metadata：notification snapshot、guidance、当前状态等。这些信息对 agent 很有用，但有些 metadata 是 **latest-only** 的。随着时间推移，老的 tool-result block 再次序列化时，可能不再和模型第一次看到的字符串完全一致。

这对上下文卫生是好事，但对严格 delta baseline 是坏事。

想象这个序列：

```text
第 N 轮：
  tool output call_1 = {payload, _meta: {...latest...}}
  模型看到了这个精确字符串

第 N+1 轮：
  本地 replay call_1 时变成 {payload}
  或者变成 {payload, _meta: different_latest_state}
```

语义上还是同一个工具结果，但 `function_call_output.output` 的字节串变了。上一轮 baseline 是一个字符串，下一轮 current input 是另一个字符串，prefix match 就断了。LingTai 只能退回 `ws_full`。

修复方式是在一个 live Codex WebSocket epoch 内，按 `call_id` freeze 第一次发给模型看的 `function_call_output.output`。以后 replay 这个旧 `call_id` 时，继续使用模型当时见过的那一份精确字符串。

这不是隐瞒信息。相反，它是在保持 fidelity：模型当时看到的就是这份输出，远端 response chain 也应当从这份输出继续。新的工具结果仍然携带新的内容。临时 orphan placeholder 不会被 freeze，因为它只是等真实工具结果到来之前的脚手架。

定期 epoch reset 和 summarize-triggered reset 会清空 frozen-output map，避免旧 metadata 无限期存在。

## 状态机长什么样

简化后的 LingTai 状态机如下：

```text
一个 Codex WS epoch 开始时：
  previous_response_id = None
  baseline = None
  frozen_outputs = {}
  websocket = 已打开或即将打开

第一轮：
  full_input = convert(local_chat_history, frozen_outputs)
  send response.create:
    store = false
    input = full_input
    previous_response_id absent
  mode = ws_full
  receive response_id = resp_1
  record converter-stable baseline

第二轮：
  full_input = convert(local_chat_history, frozen_outputs)
  if full_input startswith baseline and request shape is safe:
    delta = full_input[len(baseline):]
    send response.create:
      store = false
      previous_response_id = resp_1
      input = delta
    mode = ws_incremental
  else:
    send full_input without previous_response_id
    mode = ws_full
  receive response_id = resp_2
  record new baseline
```

最重要的安全原则是：只有能证明 prefix 时才走 `ws_incremental`。错误地走 `ws_incremental` 比贵一点的 `ws_full` 更糟糕，因为那等于要求模型从一个可能不等于本地 transcript 的远端状态继续。

## 失败时怎么处理

实现里把 failure 当作状态边界。

如果 LingTai 已经准备了新 baseline，但 stream 在服务端完成 response 前失败，就恢复到上一个已确认 baseline，并关闭 transport。下一轮不能拿一个“服务端可能根本没接受”的请求当 baseline。

如果 WebSocket path 不可用，就 fallback 到 HTTP full replay，仍然保持 `store=false`。这更贵，但正确。

如果检测到 prefix mismatch，就记录安全诊断，例如 `prefix_mismatch`，然后走 `ws_full`。这样操作者能看到原因，而不需要泄露请求体。

## 为什么 summarize 会强制 fresh epoch

LingTai 的 `system(action="summarize")` 会把本地 chat history 中选定的旧工具结果替换成 agent 写的摘要。这对上下文很有用。但对 Codex remote response chain 来说，它是一个边界。

远端 `previous_response_id` 背后的 chain 已经接受过原始的长工具结果。本地 transcript 现在变成了较短摘要。我们不能安全地对远端说：“请把你已经接受的那条 response chain 原地改成基于这个摘要的版本。”

所以 LingTai 采取诚实做法：

```text
summarize 成功后：
  清掉 previous_response_id
  清掉 local baseline
  清掉 pending baseline
  清掉 frozen tool-output cache
  关闭/重置 WebSocket transport
  标记下一次 Codex request 为 fresh epoch
```

于是下一次请求会是 `ws_full`，并带类似诊断：

```text
codex_ws_delta_reason = epoch_reset
codex_ws_epoch_reset_reason = summarize
```

这次 full request 建立新 baseline 后，后续普通 turn 又可以回到 `ws_incremental`。

这就是为什么现在的操作建议是：不要在 Codex 上把一堆旧 tool result 一个一个连续 summarize。每次成功 summarize 都会有意打断下一次 response-id chain。如果有五个旧结果要压缩，应尽量一次性 batch summarize，而不是付五次 fresh epoch。

## 定期 fresh epoch 也是故意的

即使没有 summarize，LingTai 也会偶尔开启 fresh Codex epoch。原因是卫生。

如果一条远端 `previous_response_id` chain 永远不重置，它可能一直携带很老的 runtime metadata 和 frozen tool outputs。本地 `chat_history` 才是真相；远端 response chain 是优化。定期 reset 只丢掉 Codex request-side state，然后从本地 history 重建完整请求。

reset 会清掉：

- `previous_response_id`；
- 本地 delta baseline；
- pending baseline；
- frozen tool-output cache；
- WebSocket transport。

它不会删除 LingTai 本地对话。它只是花一次 `ws_full` 的成本，启动一条干净的新远端 chain。

## 怎么读 ledger

排查 cache 时，下面这些 usage metadata 最有用：

```text
codex_request_mode          ws_full | ws_incremental | http_full
codex_store                 false
codex_previous_response_id  只在 incremental continuation 上出现
codex_prompt_cache_key      启用时的稳定 identity
codex_ws_delta_reason       ok, no_baseline, prefix_mismatch, epoch_reset, ...
codex_ws_epoch_reset_reason summarize, turn_count, ...
```

解释方式：

- `ws_incremental`：远端 response chain 用 delta 续上了。
- `ws_full no_baseline`：session 开头或 reset 后的正常情况。
- `ws_full epoch_reset summarize`：刚执行过 `system(action="summarize")` 后的预期行为。
- `ws_full prefix_mismatch`：LingTai 认为当前 request 没有严格延长上一个 baseline，所以拒绝冒险续接。
- `http_full` 或 fallback metadata：WebSocket path 没用上，走了安全 full replay。

Cached token percentage 和 request mode 有关，但不是一回事。`ws_full` 仍然可能因为稳定 cache identity 和重复前缀而拿到 prompt-cache 折扣；`ws_incremental` 更进一步，它本身只发送 suffix，并用 `previous_response_id` 续接远端状态。

## 为什么现在能 cache 住

把所有层合起来看，LingTai 现在满足的是一组契约：

1. **稳定 cache affinity。** `prompt_cache_key`、`session_id`、`thread_id` 在适用路径上稳定且对齐。
2. **诚实请求身份。** 默认 Codex 请求以 LingTai 身份发送，而不是伪装官方 CLI 实验。
3. **正确 store contract。** ChatGPT Codex 使用 `store=false`；LingTai 不再尝试不被支持的 `store=true`。
4. **持久 WebSocket transport。** `previous_response_id` 留在生成它的同一条 live WebSocket connection 上复用。
5. **客户端 delta baseline。** LingTai 记录上一个已接受 request/response 状态，只有当前 input 严格延长它时才发送 suffix。
6. **Converter-stable comparison。** Baseline 用下一轮也会由同一 converter 生成的 input schema 表达。
7. **旧工具输出 freeze。** 模型已经见过的 tool output string 在同一 epoch 内按 `call_id` 字节稳定 replay。
8. **安全 fallback。** 任何 mismatch 或 failure 都退回 `ws_full` 或 HTTP full replay，而不是赌远端状态。
9. **Fresh-epoch hygiene。** 定期 reset 和 summarize-triggered reset 防止 stale remote chain 永久存在。

任何单点都不够。只有稳定 `prompt_cache_key`，仍然是 full replay。只有 WebSocket，但每轮新开连接，`previous_response_id` 不被认。连接复用有了，但 baseline schema 不稳定，仍然会掉回 `ws_full`。baseline 稳了，但旧工具输出里 metadata 会移动，也会 prefix mismatch。

最后能工作的，是一串小不变量一起成立。

## 操作建议

如果你在 Codex 上跑 LingTai，并且关心 cache：

- startup、refresh、fallback、epoch reset 后第一轮出现 `ws_full` 是正常的。
- `ws_full no_baseline` 或 `ws_full epoch_reset` 不必惊慌，它们是安全边界。
- 如果几乎每一轮都是 `prefix_mismatch`，才需要深入排查 baseline / tool output / request shape。
- 批量使用 `system(action="summarize")`。五个旧工具结果一个个 summarize 会触发五次 fresh epoch；一次 batch summarize 只触发一次。
- 不是不要 summarize。总结旧噪声仍然是好习惯；重点是对 Codex 要“有意地 summarize”。
- 本地 chat history 永远是真相；远端 response chain 只是优化，必要时可以丢掉重建。

## 更大的教训

Codex Responses cache 不是一个开关问题，而是协议对齐问题。

表面上的几个概念——`prompt_cache_key`、`store`、`previous_response_id`、WebSocket streaming——只有放到这条具体 endpoint 的真实约束里才有意义。对 ChatGPT-backed Codex 来说：

- `store=true` 是错的抽象；
- 稳定 cache identity 必要但不充分；
- `previous_response_id` 属于一条 live WebSocket chain；
- 客户端必须证明 byte-stable delta；
- runtime 必须暴露诚实 telemetry，让操作者看得出优化什么时候生效。

所以 LingTai 现在直接命名这两种模式。`ws_full` 表示：“我从本地真相重建远端状态。” `ws_incremental` 表示：“我证明了 prefix，可以继续已有远端 chain。”两者都是正确行为。真正的改进是：普通连续 turn 终于可以大部分时间停留在第二种模式；而当 transcript 形状变化或安全边界出现时，又能可靠地退回第一种模式。
