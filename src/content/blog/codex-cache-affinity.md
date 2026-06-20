---
title: "One Identity, Many Calls: Codex OAuth Cache Affinity in LingTai"
date: 2026-06-19
author: Zesen Huang
tags: [tech, devlog]
lang: en
description: "Why prompt caching makes or breaks the cost of a long-running Codex OAuth agent, what a stable cache-affinity identity actually means, and how LingTai landed on one durable per-agent key — informed by the wider ecosystem but without cargo-culting third-party headers."
---

<div class="callout callout-tldr">

**TL;DR**

For a long-running agent on Codex OAuth, prompt caching is most of the cost. Caching only helps if every request from the same workstream carries the *same* stable identity. LingTai aligns `session-id`, `thread-id`, and `prompt_cache_key` to one durable per-agent key — not to a per-call id, tool-call id, random UUID, or a timestamp that changes on every molt. We then refined *when* that key is allowed to rotate, guided by ecosystem evidence rather than by copying every header we found in the wild.

</div>

## Why cache affinity matters at all

When an agent runs for hours or days, almost every request it sends shares a long, near-identical prefix: the system prompt, the tool definitions, the accumulated conversation. Re-billing that prefix at full price on every turn would be ruinous. Prompt caching exists precisely to avoid it — the provider keeps a warm copy of the prefix and charges cached tokens at a steep discount on subsequent hits.

But a cache is only useful if your next request lands on the *same* warm copy. That routing is decided by an identity the request carries. Send a different identity each turn and, from the cache's point of view, every request looks like a brand-new conversation. The prefix is re-ingested, the discount evaporates, and cost can multiply several-fold for no behavioral benefit.

So the whole game is: **keep a stable identity across calls, so the cache keeps recognizing you.** This is what we mean by *cache affinity* — the request's affinity for the warm copy it built up.

## The stable identity contract

The official Codex client gives a clear signal here. On its main path, the session identity, the thread identity, and the cache key are not three independent values — they are tied together, derived from one underlying thread identity. In other words, "who am I as a session," "which conversation thread is this," and "which cache bucket do I belong to" are all answered by the *same* durable handle.

LingTai adopted the same contract:

```text
session-id  ==  thread-id  ==  prompt_cache_key  ==  one stable per-agent identity
```

The crucial word is **stable**. The identity must be anchored to the durable thing — the agent / workstream — and not to anything that churns. Concretely, we do **not** derive it from:

- the latest API-call id,
- the latest tool-call id,
- a fresh random UUID per request,
- or a molt/refresh timestamp.

Every one of those changes constantly, which is exactly what you must not do to a cache key. An agent that re-keyed on every tool call would be telling the cache "I'm someone new" dozens of times a minute. LingTai instead derives a short, stable hash from the resolved agent identity and reuses it across calls — and, importantly, *across molts*. Molting wipes an agent's conversation, but its identity persists, so its cache affinity should persist too.

## Reading the ecosystem — usefully, but skeptically

Codex OAuth is a busy ecosystem. A survey of public harnesses, gateways, and runtimes that talk to Codex's OAuth backend showed two broad families:

1. **Shell the official binary or reuse its auth state.** These projects spawn the real Codex app-server or reuse its stored credentials, so the low-level cache and session details are largely owned by the official runtime.
2. **Self-manage the OAuth token and call the backend directly.** These build the request themselves, which means they also have to get the cache identity right themselves.

The dividing line between mature and fragile implementations was not "does it use OAuth." It was "does it maintain a **stable conversation/session-level cache identity.** " Mature gateways consistently send a stable cache key and session/conversation hints; weak ones either omit the key or regenerate an unstable one.

The single richest public reference we found uses a fuller fingerprint than the baseline — additional routing-style headers beyond the core trio. That is genuinely useful *evidence* that extra hints can matter. But it is **not** a license to clone the whole set. Some of those headers may carry official-client or window-specific semantics; others may be tied to a particular gateway's request-shaping strategy. Copying them blindly risks sending values that are meaningless, rejected, or actively counterproductive. The right posture is: treat third-party header sets as hypotheses to test behind a capability gate, not as a spec to hardcode.

## Why this is worth the care: a public regression

That third caution is not theoretical. A well-known Codex OAuth runtime lived through an instructive cycle, all visible in its public history:

- It carried a body-level cache key from the birth of its Codex transport.
- It later added HTTP-header routing hints to scope the cache more precisely.
- While fixing an unrelated backend error about an unsupported parameter, a change stripped the request's extra headers — and accidentally removed those real cache-affinity HTTP headers along with the offending field.
- Cache-hit rates reportedly collapsed from roughly **~95%** to **~20–30%**, with a severe cost impact, before a follow-up restored the headers as proper HTTP headers while keeping the cache key in the body.

The lesson generalizes cleanly: there is a real boundary between **body fields** and **HTTP headers**, and they are not interchangeable. Quietly deleting cache-affinity *headers* can blow up cost even when behavior looks unchanged. Cache identity deserves the same care — and the same regression tests — as any other cost-critical contract.

This pattern is also not a one-off bug peculiar to a single project. Tracing the lineage of these runtimes shows stable cache-affinity handling recurring as an engineering theme across the family, inherited and re-derived rather than invented once. It is a standing concern, not a footnote.

## Where LingTai landed

The baseline above — `session-id == thread-id == prompt_cache_key`, all bound to one stable per-agent identity — is the foundation. The open refinement was *when*, if ever, that identity should change. Always-fixed is simple but brittle; per-call churn is the original sin we were avoiding. The answer is a deliberately narrow rotation policy:

- **On start and on refresh**, the adapter stamps a fresh epoch and derives a new current affinity id. A genuinely new run gets a clean cache lineage.
- **On a stalled cache**, the id rotates in place — but only when the cache signal itself says it is stuck. The trigger is conservative: the last **eight** positive cached-token readings being byte-identical, which suggests the warm copy is no longer growing usefully. Only then does the current id rotate.
- **There is no one-shot temporary id.** Earlier exploration tried a "use a throwaway id for a single request, then revert" path; that was dropped. After a rotation, subsequent requests simply continue on the new current id. One identity at a time, always.

Throughout, the three-field invariant holds: the request body's cache key and both REST headers carry the *same* current id, and the usage metadata records the id that was actually used — so cache behavior stays observable without exposing anything sensitive.

The net result is an agent whose cache affinity is durable by default, survives molts, and steps to a fresh identity only at the two moments where a fresh identity is actually warranted: a genuine new beginning, or a cache that has provably stopped helping.

## Takeaways

- **Prompt caching is a cost contract, not a free optimization.** For long-running agents it dominates the bill; treat it accordingly.
- **One durable identity, reused across calls and molts.** Bind it to the agent/workstream, never to per-call ids, tool ids, random UUIDs, or churning timestamps.
- **Headers and body fields are different surfaces.** Losing cache-affinity *headers* can silently wreck cache hit rates — guard them with tests.
- **Learn from the ecosystem; don't cargo-cult it.** Third-party header sets are clues to test behind a gate, not a spec to clone.
- **Rotate identity rarely and only on signal** — a real start/refresh, or a cache that has provably plateaued — never on every call.
