---
title: "读源码，找一份没人写下来的契约：Codex OAuth 缓存亲和性"
date: 2026-06-19
author: Zesen Huang
tags: [tech, devlog]
lang: zh
description: "一次成本异常，把我们引进了 Codex 的源代码,挖出一份没有写进文档的缓存亲和性契约——session-id、thread-id、prompt_cache_key 全都绑定到同一个线程身份。本文讲这趟发现之旅:为什么它从不出现在公开文档里、附上源码引用,以及它对长跑 LingTai 器灵意味着什么。"
---

<div class="callout callout-tldr">

**太长不看**

一个长跑 Codex OAuth 器灵上的成本异常,让我们去追问*为什么*。线索从缓存命中数,一路引到官方 Codex 源代码、一个第三方网关的请求头集合、再到另一个运行时的公开回归。结论是:Codex 的提示缓存以一个稳定身份为键,而在官方客户端里,`session-id`、`thread-id`、`prompt_cache_key` 全都派生自**同一个**线程身份。令人意外的是:我们在所查过的任何 Codex 公开文档里,都找不到这份契约——它只存在于源码与可观测的行为中。本文就是这趟发现之旅,并附上源码引用。

</div>

## 症状:缓存就是粘不住

对一个连续运行数小时乃至数天的器灵来说,它发出的几乎每一次请求都共享一段又长又几乎相同的前缀——系统提示、工具定义、不断累积的对话历史。提示缓存本该让这段前缀在首轮之后近乎免费:供应商保留一份「热」的前缀副本,后续命中时以极低折扣计费缓存 token。

引起我们注意的是:折扣总在蒸发。对于一个前缀逐轮几乎不变的工作流,缓存 token 的读数比应有的更低、也更跳。账单是被一段「概念上没动过」的前缀的反复重摄入推高的。我们的请求里有某种东西,让缓存把一段连续的对话当成了一群陌生人。

提示缓存要有用,你的下一次请求必须落到**同一份**热副本上,而这个路由由请求携带的身份决定。如果身份在两轮之间变了,缓存每次都看到一段全新的对话。于是问题被磨尖成:**Codex 到底用什么身份把请求路由到它的热缓存?而我们有没有把它保持稳定?**

## 第一步——对照官方客户端

要弄清真正的契约,最快的办法是去读那个「别人行为都以它为基准」的实现。Codex CLI 是公开的([`openai/codex`](https://github.com/openai/codex)),所以我们直接读了它的 Responses/Codex 传输路径。三处发现彼此印证。

**缓存键就是 thread id。** 在模型客户端里,`prompt_cache_key()` 在没有 override 时回退到 thread id:

```rust
// codex-rs/core/src/client.rs
fn prompt_cache_key(&self) -> String {
    self.prompt_cache_key_override
        .clone()
        .unwrap_or_else(|| self.state.thread_id.to_string())
}
```
[`codex-rs/core/src/client.rs`(`prompt_cache_key`)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/core/src/client.rs#L420-L423)

**session id 是*从* thread id 派生的。** 当一个 root 器灵开启会话时,session id 并不是一个独立的值——它由 thread id 构造而来:

```rust
// codex-rs/core/src/session/session.rs
let session_id = if session_configuration.session_source.is_non_root_agent() {
    agent_control.session_id()
} else {
    SessionId::from(thread_id)
};
```
[`codex-rs/core/src/session/session.rs`(会话启动)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/core/src/session/session.rs#L955-L960)

**两者都作为 HTTP 请求头随行,而 thread id 还被复用为请求关联头。** 客户端构建握手请求头时,把两个 id 作为 `session-id` / `thread-id` 转发,并且把 `x-client-request-id` 也设成 thread id:

```rust
// codex-rs/core/src/client.rs (build_websocket_headers)
if let Ok(header_value) = HeaderValue::from_str(&responses_metadata.thread_id) {
    headers.insert("x-client-request-id", header_value);
}
headers.extend(build_session_headers(
    Some(responses_metadata.session_id.to_string()),
    Some(responses_metadata.thread_id.to_string()),
));
```
[`codex-rs/core/src/client.rs`(`build_websocket_headers`)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/core/src/client.rs#L955-L970)

字面的请求头名字来自一个小辅助函数:

```rust
// codex-rs/codex-api/src/requests/headers.rs
pub fn build_session_headers(session_id: Option<String>, thread_id: Option<String>) -> HeaderMap {
    let mut headers = HeaderMap::new();
    if let Some(id) = session_id { insert_header(&mut headers, "session-id", &id); }
    if let Some(id) = thread_id  { insert_header(&mut headers, "thread-id",  &id); }
    headers
}
```
[`codex-rs/codex-api/src/requests/headers.rs`(`build_session_headers`)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/codex-api/src/requests/headers.rs#L5-L12)

拼起来看,官方客户端用**同一个**底层句柄回答了「我作为会话是谁」「这是哪一条对话线程」「我属于哪个缓存桶」。蒸馏一下:

```text
session-id  ==  thread-id  ==  prompt_cache_key  ==  同一个持久的线程身份
```

这就是那份契约——而它从来不需要我们去*猜*;它就明明白白地写在 `client.rs`、`session.rs`、`headers.rs` 里。

## 第二步——令我们意外的文档缺口

在源码里找到契约后,我们去文档里找它,本以为只是确认一下。结果找不到。在公开的 `openai/codex` 仓库里检索,`prompt_cache_key` 出现在源码文件和测试里——而在 Markdown 或文档文件里出现**零**次。没有任何一页文档说「提示缓存以 thread id 为键」或「请发送稳定的 `session-id`/`thread-id`」。这份契约是真实的、承重的、与成本攸关的——可它只通过代码和可观测行为传达,而不在我们查过的任何公开文档里。

这一点值得明说,因为它改变了你的工作方式。如果一份塑形成本的契约有文档,你照文档实现就完事了。如果它只活在源码里,你就必须*去读源码*、钉住一个 commit、自己写回归测试——因为唯一的规范就是那份实现,而实现是会变的。

## 第三步——用更广的生态做三角验证

读源码告诉了我们官方的形状。为了交叉验证、并搞清还有什么*别的*重要,我们扫了一批公开的 Codex OAuth harness、网关与运行时。它们分成两类:

1. **套壳官方二进制或复用其鉴权状态**——拉起真正的 `codex app-server`,或复用存好的凭据,底层缓存与会话细节由官方运行时掌管。
2. **自管 OAuth token,直连后端**——自己构造请求,也就必须自己把缓存身份做对。

成熟与脆弱实现之间的分界线,不在于「用没用 OAuth」,而在于「有没有维护一个**稳定的会话/对话级缓存身份**」。成熟的网关一致地发送稳定缓存键加上会话/对话提示;脆弱的要么不发,要么每次生成一个不稳定的。

我们找到的最丰富的公开参考,`router-for-me/CLIProxyAPI` 网关,发送了比核心三件套更完整的指纹——若干路由风格的额外请求头(`X-Client-Request-Id`、`Thread-Id`、`X-Codex-Window-Id`,以及各种大小写变体)。这是有用的*证据*,说明额外提示可能有意义。但这**绝不**等于可以把整套抄过来:其中一些请求头可能携带官方客户端或窗口相关的语义,另一些可能绑定在该网关特定的请求塑形上。正确姿态是:把第三方请求头集合当成「待验证的假设」,放在能力开关后面逐一实验,而不是当成规范写死。

## 第四步——一次证明了风险的回归

这层告诫并非纸上谈兵。`Hermes` 运行时经历过一段很有教益的循环,全程可在它的公开历史里看到:

- 从 Codex 传输诞生之初就带着一个 body 层的缓存键。
- 后来加入了 HTTP 请求头形式的路由提示(`session_id` / `x-client-request-id`),以更精确地划定缓存范围。
- 在修复一个无关的后端 `HTTP 400 Unsupported parameter` 报错时,某次改动剥掉了 `extra_headers`——结果连同那个惹事的字段一起,把真正的缓存亲和性 HTTP 请求头也误删了。
- 据报告,缓存命中率从约 **~95%** 崩到了 **~20–30%**,成本影响严重;之后的修复才把这些请求头作为正经 HTTP 头恢复回来,同时把缓存键留在 body 里。

这条教训可以干净地推广:**body 字段**与 **HTTP 请求头**之间存在真实边界,二者不可互换。悄悄删掉缓存亲和性*请求头*,即便行为看上去毫无变化,也可能让成本爆炸。而追溯这些运行时的血缘(`OpenClaw` 的缓存/会话逻辑大半继承自一条被内化的 `Pi/pi-ai` 运行时谱系)可以看到,稳定的缓存亲和性处理作为一个工程主题,在整个家族里反复出现——被继承、被重新推导,而非一次性发明。它是个长期课题,不是脚注。

## LingTai 拿这份契约做了什么

我们采用了官方基线,然后决定这个身份**何时**才允许改变。身份锚定在持久的东西上——器灵 / 工作流本身——绝不锚定在任何会频繁变动的东西上。具体来说,我们**不**用它派生自:最近一次的 API 调用 id、最近一次的工具调用 id、每次请求新生成的随机 UUID,或凝蜕/刷新的时间戳。我们从解析出的器灵身份派生一个简短而稳定的哈希,在多次调用之间、并且**跨凝蜕**复用:凝蜕会清除器灵的对话,但它的身份长存,因此它的缓存亲和性也应当长存。

```text
session-id == thread-id == prompt_cache_key == 稳定哈希(解析出的器灵身份)
```

这条基线落在了 [`Lingtai-AI/lingtai-kernel` PR #394](https://github.com/Lingtai-AI/lingtai-kernel/pull/394)(Codex 适配器在 `src/lingtai/llm/openai/adapter.py`,稳定性测试在 `tests/test_codex_prompt_cache_key.py`,书面理由在 `src/lingtai/llm/openai/ANATOMY.md`)。又因为这份契约在上游没有文档,我们把整趟调查也沉淀成了一份持久设计笔记——[`lingtai-kernel#395`](https://github.com/Lingtai-AI/lingtai-kernel/issues/395)——好让下一个实现者既不会再次把缓存亲和性写得过简,也不会因照抄第三方请求头集合而矫枉过正。

基线之后的开放问题是*轮换*。永远固定很脆;逐次调用就换,又正是我们极力避免的原罪。策略刻意收窄:

- **在启动与刷新时**,适配器盖一个新的纪元戳,派生出一个新的当前亲和 id——一次真正的新运行获得一条干净的缓存血缘。
- **在缓存停滞时**,id 就地轮换,但仅当缓存信号表明它卡住了——触发条件保守(一连串完全相同的为正缓存 token 读数,暗示热副本已不再有用地增长)。
- **没有「一次性临时 id」。** 早期的「某次请求用一个用后即弃的 id」路径被砍掉了。轮换之后,后续请求沿用新的当前 id。任何时刻,只有一个身份。

全程,三字段不变式成立:请求 body 的缓存键与两个 REST 请求头携带同一个当前 id,用量元数据记录的也是实际用到的那个 id——这样缓存行为始终可观测,又不暴露任何敏感信息。

## 为什么这对 LingTai 器灵重要

LingTai 器灵天生长寿。对它们来说,提示缓存不是锦上添花的优化——它就是成本契约的大头。一个在每次工具调用时都悄悄重新设键的器灵,等于每分钟几十次地告诉缓存「我是个新人」,账单也会如实反映。把缓存亲和性做对,因此直接关乎一个长跑器灵到底跑不跑得起。

## 小结

- **当契约不在文档里时,去读源码——并把它钉住。** Codex 缓存亲和性契约活在 `client.rs` / `session.rs` / `headers.rs`,不在我们找到的任何公开文档里。引用一个 commit;行为是会变的。
- **一个持久身份,跨调用、跨凝蜕复用。** 把它绑到器灵/工作流上,绝不绑到逐次调用 id、工具 id、随机 UUID 或会变的时间戳。
- **请求头与 body 字段是不同的面。** 丢掉缓存亲和性*请求头*会悄无声息地毁掉命中率——用测试守住它。
- **向生态学习,但别照搬。** 第三方请求头集合是「待验证的线索」,不是「待克隆的规范」。
- **罕见地、且只在有信号时轮换身份**——真正的启动/刷新,或一份已被证明停滞的缓存——而非每次调用都换。
