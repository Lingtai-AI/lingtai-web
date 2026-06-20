---
title: "Reading the Source to Find a Contract Nobody Wrote Down: Codex OAuth Cache Affinity"
date: 2026-06-19
author: Zesen Huang
tags: [tech, devlog]
lang: en
description: "How a cost anomaly led us into the Codex source code to uncover an undocumented cache-affinity contract — session-id, thread-id, and prompt_cache_key all bound to one thread identity — why it never appears in the public docs, and what it means for long-running LingTai agents."
---

<div class="callout callout-tldr">

**TL;DR**

A cost anomaly on a long-running Codex OAuth agent sent us looking for *why*. The trail led from cache-hit numbers, to the official Codex source code, to a third-party gateway's header set, to a public regression in another runtime. The conclusion: Codex's prompt cache is keyed by a stable identity, and on the official client `session-id`, `thread-id`, and `prompt_cache_key` are all derived from **one** thread identity. The surprising part: we could not find this contract written down in any public Codex documentation we checked — it lives only in the source and in observed behavior. This post is the discovery story, with source-code citations.

</div>

## The symptom: caching that wouldn't stick

For an agent that runs for hours or days, almost every request shares a long, near-identical prefix — system prompt, tool definitions, accumulated conversation. Prompt caching is supposed to make that prefix nearly free on every turn after the first: the provider keeps a warm copy of the prefix and bills cached tokens at a steep discount.

What got our attention was that the discount kept evaporating. Cached-token counts were lower and noisier than they should have been for a workstream whose prefix barely changed turn to turn. The bill was being driven by re-ingestion of a prefix that, conceptually, had not moved. Something about our requests was making the cache treat a continuing conversation as a stream of strangers.

A prompt cache only helps if your next request lands on the *same* warm copy, and that routing is decided by an identity the request carries. If the identity changes between turns, the cache sees a brand-new conversation each time. So the question sharpened into: **what identity does Codex actually use to route a request to its warm cache, and were we keeping it stable?**

## Step 1 — compare against the official client

The fastest way to learn the real contract is to read the implementation everyone else's behavior is measured against. The Codex CLI is public ([`openai/codex`](https://github.com/openai/codex)), so we read its Responses/Codex transport path directly. Three findings lined up.

**The cache key is the thread id.** In the model client, `prompt_cache_key()` falls back to the thread id when no override is set:

```rust
// codex-rs/core/src/client.rs
fn prompt_cache_key(&self) -> String {
    self.prompt_cache_key_override
        .clone()
        .unwrap_or_else(|| self.state.thread_id.to_string())
}
```
[`codex-rs/core/src/client.rs` (`prompt_cache_key`)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/core/src/client.rs#L420-L423)

**The session id is *derived from* the thread id.** When a root agent starts a session, the session id is not an independent value — it is constructed from the thread id:

```rust
// codex-rs/core/src/session/session.rs
let session_id = if session_configuration.session_source.is_non_root_agent() {
    agent_control.session_id()
} else {
    SessionId::from(thread_id)
};
```
[`codex-rs/core/src/session/session.rs` (session start)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/core/src/session/session.rs#L955-L960)

**Both ride along as HTTP headers, with the thread id also reused as the request-correlation header.** When the client builds its handshake headers, it forwards both ids as `session-id` / `thread-id`, and sets `x-client-request-id` from the thread id too:

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
[`codex-rs/core/src/client.rs` (`build_websocket_headers`)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/core/src/client.rs#L955-L970)

The literal header names come from a small helper:

```rust
// codex-rs/codex-api/src/requests/headers.rs
pub fn build_session_headers(session_id: Option<String>, thread_id: Option<String>) -> HeaderMap {
    let mut headers = HeaderMap::new();
    if let Some(id) = session_id { insert_header(&mut headers, "session-id", &id); }
    if let Some(id) = thread_id  { insert_header(&mut headers, "thread-id",  &id); }
    headers
}
```
[`codex-rs/codex-api/src/requests/headers.rs` (`build_session_headers`)](https://github.com/openai/codex/blob/d66708232299bdbf373ec55b0d6b938c246cfa60/codex-rs/codex-api/src/requests/headers.rs#L5-L12)

Put together, the official client answers "who is this session," "which conversation thread is this," and "which cache bucket do I belong to" with the **same** underlying handle. Distilled:

```text
session-id  ==  thread-id  ==  prompt_cache_key  ==  one durable thread identity
```

That is the contract — and it was never something we had to *guess*; it is sitting in `client.rs`, `session.rs`, and `headers.rs`.

## Step 2 — the documentation gap that surprised us

Having found the contract in source, we went looking for it in the docs, expecting to confirm it. We could not find it. Searching the public `openai/codex` repository, `prompt_cache_key` appears in source files and tests — and in **zero** Markdown or documentation files. There is no doc page that says "the prompt cache is keyed by the thread id" or "send a stable `session-id`/`thread-id`." The contract is real, load-bearing, and cost-critical — and it is communicated only through code and observable behavior, not through any public documentation we checked.

That is worth stating plainly because it changes how you have to work. If a cost-shaping contract is documented, you implement to the doc and move on. If it lives only in the source, you have to *read the source*, pin a commit, and write your own regression tests — because the only spec is the implementation, and the implementation can change.

## Step 3 — triangulate with the wider ecosystem

Source reading told us the official shape. To sanity-check it and learn what *else* mattered, we scanned public Codex OAuth harnesses, gateways, and runtimes. They split into two families:

1. **Shell the official binary or reuse its auth state** — these spawn the real `codex app-server` or reuse stored credentials, so the official runtime owns the low-level cache and session details.
2. **Self-manage the OAuth token and call the backend directly** — these build the request themselves, so they also have to get the cache identity right themselves.

The line between mature and fragile implementations wasn't "does it use OAuth." It was "does it maintain a **stable conversation/session-level cache identity.**" Mature gateways consistently send a stable cache key plus session/conversation hints; weak ones omit it or regenerate an unstable one.

The richest public reference we found, the `router-for-me/CLIProxyAPI` gateway, sends a fuller fingerprint than the core trio — extra routing-style headers (`X-Client-Request-Id`, `Thread-Id`, `X-Codex-Window-Id`, and casing variants). That is useful *evidence* that extra hints can matter. It is **not** a license to clone the set: some of those headers may carry official-client or window-specific semantics, others may be tied to that gateway's particular request-shaping. The right posture is to treat third-party header sets as hypotheses to test behind a capability gate, not as a spec to hardcode.

## Step 4 — the regression that proved the stakes

The caution isn't theoretical. The `Hermes` runtime lived through an instructive cycle, all visible in its public history:

- A body-level cache key existed from the birth of its Codex transport.
- HTTP-header routing hints (`session_id` / `x-client-request-id`) were added later to scope the cache more precisely.
- While fixing an unrelated backend `HTTP 400 Unsupported parameter` error, a change stripped `extra_headers` — and accidentally removed the real cache-affinity HTTP headers along with the offending field.
- Cache-hit rates reportedly collapsed from roughly **~95%** to **~20–30%**, with severe cost impact, before a follow-up restored the headers as true HTTP headers while keeping the cache key in the body.

The lesson generalizes cleanly: there is a real boundary between **body fields** and **HTTP headers**, and they are not interchangeable. Quietly deleting cache-affinity *headers* can blow up cost even when behavior looks unchanged. And tracing the lineage of these runtimes (`OpenClaw` inherits much of its cache/session logic from an internalized `Pi/pi-ai` runtime line) shows stable cache-affinity handling recurring as a theme across the family — inherited and re-derived rather than invented once. It is a standing concern, not a footnote.

## What LingTai does with the contract

We adopted the official baseline and then decided *when* the identity is allowed to change. The identity is anchored to the durable thing — the agent / workstream — and never to anything that churns. Concretely, we do **not** derive it from the latest API-call id, the latest tool-call id, a fresh random UUID per request, or a molt/refresh timestamp. We derive a short, stable hash from the resolved agent identity and reuse it across calls and across molts: molting wipes an agent's conversation, but its identity persists, so its cache affinity should persist too.

```text
session-id == thread-id == prompt_cache_key == stable hash(resolved agent identity)
```

This baseline shipped in [`Lingtai-AI/lingtai-kernel` PR #394](https://github.com/Lingtai-AI/lingtai-kernel/pull/394) (Codex adapter in `src/lingtai/llm/openai/adapter.py`, with stability tests in `tests/test_codex_prompt_cache_key.py` and a written rationale in `src/lingtai/llm/openai/ANATOMY.md`). Because the contract is undocumented upstream, we also turned the whole investigation into a durable design note — [`lingtai-kernel#395`](https://github.com/Lingtai-AI/lingtai-kernel/issues/395) — so the next implementer neither under-specifies cache affinity again nor over-corrects by cloning a third-party header set.

The open question after the baseline was *rotation*. Always-fixed is brittle; per-call churn is the original sin we were avoiding. The policy is deliberately narrow:

- **On start and on refresh**, the adapter stamps a fresh epoch and derives a new current affinity id — a genuinely new run gets a clean cache lineage.
- **On a stalled cache**, the id rotates in place, but only when the cache signal says it is stuck — the trigger is conservative (a run of identical positive cached-token readings suggesting the warm copy is no longer growing usefully).
- **There is no one-shot temporary id.** An early "throwaway id for a single request" path was dropped. After a rotation, subsequent requests continue on the new current id. One identity at a time, always.

Throughout, the three-field invariant holds: the body's cache key and both REST headers carry the same current id, and usage metadata records the id actually used — so cache behavior stays observable without exposing anything sensitive.

## Why this matters for LingTai agents

LingTai agents are long-lived by design. For them, prompt caching is not a nice-to-have optimization — it is most of the cost contract. An agent that quietly re-keys on every tool call is telling the cache "I'm someone new" dozens of times a minute, and the bill reflects it. Getting cache affinity right is therefore directly a question of whether a long-running agent is affordable to run at all.

## Takeaways

- **When the contract isn't in the docs, read the source — and pin it.** The Codex cache-affinity contract lives in `client.rs` / `session.rs` / `headers.rs`, not in any public doc we found. Cite a commit; behavior can change.
- **One durable identity, reused across calls and molts.** Bind it to the agent/workstream, never to per-call ids, tool ids, random UUIDs, or churning timestamps.
- **Headers and body fields are different surfaces.** Losing cache-affinity *headers* can silently wreck hit rates — guard them with tests.
- **Learn from the ecosystem; don't cargo-cult it.** Third-party header sets are clues to test behind a gate, not a spec to clone.
- **Rotate identity rarely and only on signal** — a real start/refresh, or a cache that has provably plateaued — never on every call.
