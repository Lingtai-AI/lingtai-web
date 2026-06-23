---
title: "How LingTai Finally Made Codex Responses Cache: ws_full, ws_incremental, and the WebSocket State Chain"
date: 2026-06-23
author: Zesen Huang
tags: [tech, devlog]
lang: en
description: "A source-grounded deep dive into Codex Responses over WebSocket: why store=true failed, what ws_full and ws_incremental mean, why previous_response_id only worked on a persistent connection, and how LingTai keeps the cache chain stable."
---

<div class="callout callout-tldr">

**TL;DR**

Codex cache did not become reliable because LingTai found a magic `store=true` flag. That path is closed for the ChatGPT-backed Codex endpoint: it requires `store=false`. The working path is closer to the official Codex CLI: keep `store=false`, keep a stable cache-affinity identity, use Responses over a persistent WebSocket, remember the last accepted request and response, and on the next turn send only the strict suffix plus `previous_response_id`. In LingTai's ledger this shows up as `ws_full` for a full request that starts or resets an epoch, and `ws_incremental` for a true delta request that continues the same remote response chain.

The surprising part was not just “use WebSocket.” We also had to learn that `previous_response_id` continuity is bound to the same live WebSocket connection, that the baseline must be expressed in LingTai's converter-stable input schema rather than raw server output schema, and that old tool outputs must be frozen byte-for-byte because moving runtime metadata can break the prefix match. The result is a safe state chain: fall back to `ws_full` whenever the prefix cannot be proven, periodically reset stale remote state, and treat `system(action="summarize")` as a Codex cache boundary because it intentionally forces the next request to be `ws_full`.

</div>

This post explains the mechanism we just shipped in the LingTai kernel around Codex Responses caching. It is the longer companion to the v0.14.1 release note: not just what changed, but why the previous approaches failed, what `ws_full` and `ws_incremental` mean, and how to read the cache behavior when a long-running LingTai agent is using Codex.

The concrete implementation lives in the kernel's Codex adapter and WebSocket transport:

- `src/lingtai/llm/openai/adapter.py`
- `src/lingtai/llm/openai/codex_ws.py`
- tests around `test_codex_ws_session.py`, `test_codex_ws_delta.py`, `test_codex_ws_tool_result_freeze.py`, and `test_codex_prompt_cache_key.py`

The article avoids credentials and private request bodies. It describes the protocol shape and the state machine.

## The symptom: “the cache should be hot, but it keeps going cold”

A LingTai agent is not a short one-shot chat. It can run for hours, receive mail, call tools, spawn daemons, update memory, and keep a very large system prompt plus accumulated conversation. From the provider's point of view, most turns share a huge prefix:

1. system prompt and runtime guidance;
2. tool definitions;
3. durable character/pad/skill catalogs;
4. prior conversation and tool results;
5. only a small suffix changes on the current turn.

Prompt caching should make that prefix cheap after the first request. If every turn carries a nearly identical prefix and a stable cache identity, the backend can reuse a warm copy instead of charging the whole prefix as fresh input.

But before the recent work, Codex cache behavior was noisy. Sometimes cached-token counts appeared, sometimes they disappeared, and long agent turns still looked like repeated full ingestion. That raised two related questions:

- **Cache affinity question:** Are repeated requests routed to the same warm cache key?
- **State continuity question:** Can the client avoid resending the already-accepted transcript at all?

The first question led to stable `prompt_cache_key`, `session_id`, and `thread_id`. The second question led to Responses-over-WebSocket and `previous_response_id`.

They are related, but they are not the same layer.

## Layer 1: prompt cache affinity is identity, not state

Earlier work found that official Codex-style requests carry a stable identity envelope. In LingTai, the default Codex path now uses an honest LingTai identity:

```text
originator: lingtai
User-Agent: LingTai/<installed-version>
```

Separately, the cache-affinity identity is kept stable for the session. In the anchored path, the effective identity is used byte-identically for:

```text
prompt_cache_key == session_id == thread_id
```

The key point is **stability**: no timestamp, no epoch salt, no per-refresh randomization. If this identity changes, prompt cache routing sees a different caller/thread and the warm prefix may no longer match.

This layer helps the backend know where to look for a hot prefix. But it does **not** by itself make a REST request stateful. A normal full request may still upload the whole `input` array. Prompt caching can discount repeated tokens, but the client is still constructing and sending the whole request.

To stop full replay, LingTai needed a second layer.

## The false door: public Responses `store=true`

The obvious idea was: use the Responses API like a stateful API.

A naive plan looked like this:

```text
Turn 1:
  store=true
  previous_response_id absent
  input = full bootstrap transcript

Turn 2:
  store=true
  previous_response_id = response id from turn 1
  input = only the new delta
```

That is how many people expect a stateful Responses chain to work. It is not what the ChatGPT-backed Codex endpoint accepts.

Live tests against `/backend-api/codex/responses` showed the hard constraint: **store must be false**. `store=true` is rejected. The official Codex CLI source points in the same direction for the ChatGPT Codex provider: ChatGPT Codex requests use `store=false` rather than public server-side Responses storage.

So the first important conclusion was negative:

> Codex cache cannot be fixed for this endpoint by turning on public Responses storage. `store=true + previous_response_id` is not the path.

This matters because it prevents a misleading explanation. LingTai did not “enable store.” The working mechanism keeps `store=false`.

## REST with `store=false`: stable but still full replay

Once `store=true` was ruled out, the REST path had a clear contract:

```text
POST /backend-api/codex/responses
store = false
input = full current transcript
previous_response_id = omitted
```

LingTai still sends `prompt_cache_key` on the relevant Codex Responses requests, and the stable cache-affinity work remains useful. But with REST `store=false`, `previous_response_id` is not used. Every turn is logically a full replay.

That is why cache affinity alone did not solve the cost anomaly. It helped the backend recognize repeated prefixes, but it did not create an incremental transcript protocol.

The missing piece was the Codex-specific WebSocket state chain.

## What the official CLI taught us: client-side delta state

Source inspection of the official Codex CLI showed a different pattern on the WebSocket path. It does not rely on `store=true`. Instead, it keeps client-side state:

- the **last request** the server accepted;
- the **last response id** returned by the server;
- the **output items** the server added;
- enough shape checks to know whether the next full request strictly extends the previous baseline.

On the next turn, the client compares:

```text
baseline = previous_request.input + previous_response.items_added
current  = current_full_request.input
```

If `current` starts with `baseline`, the suffix is safe to send as a delta:

```text
delta = current[len(baseline):]
```

Then the WebSocket frame can say:

```text
store = false
previous_response_id = <last response id>
input = delta
```

This is the core idea behind LingTai's `ws_incremental` mode. The server is not being asked to store public Responses state with `store=true`; it is being asked, on a live Codex WebSocket state chain, to continue from a response id that this connection already knows.

## Two ledger modes: `ws_full` and `ws_incremental`

LingTai records the request mode in usage metadata so operators can tell which path a turn took.

### `ws_full`

`ws_full` means:

```text
WebSocket path is used,
but the request sends the full current Responses input,
and no previous_response_id is attached.
```

This happens when:

- the WebSocket session has no baseline yet (`no_baseline`);
- there is no usable previous response id;
- the current request does not strictly match the previous baseline (`prefix_mismatch`);
- non-input request fields changed in a way that makes continuation unsafe;
- a periodic fresh epoch is due;
- local history was summarized, so LingTai intentionally starts a fresh remote epoch.

A `ws_full` turn is not necessarily a bug. It is the safe mode. It says: “I cannot prove that the remote response chain is exactly the transcript I need, so I will rebuild from local truth.”

### `ws_incremental`

`ws_incremental` means:

```text
WebSocket path is used,
the previous response id is known,
the current input strictly extends the saved baseline,
and only the suffix is sent.
```

In this mode, the frame carries:

```text
store = false
previous_response_id = <last response id>
input = <delta only>
```

This is the mode that finally makes the long-running agent shape efficient. Instead of resending the whole transcript, LingTai sends only what changed after the last accepted response.

## The hidden requirement: the same WebSocket connection

The first implementation of the WebSocket state chain still failed in a revealing way.

LingTai sent a second request with `previous_response_id`, but opened a new WebSocket connection for it. The server rejected the request with the equivalent of:

```text
Previous response with id ... not found.
```

A manual probe then kept both requests on the same WebSocket connection:

1. first request: full input, no previous response id;
2. server returned a response id;
3. second request on the same connection: delta input plus that response id;
4. server accepted it.

That proved an important operational rule:

> For the ChatGPT Codex WebSocket path, `previous_response_id` continuity is connection/session-bound. It is not enough to remember the id locally; the continuation must stay on the same live WebSocket transport.

LingTai therefore changed `CodexResponsesSession` to retain the WebSocket transport across sequential sends in the same chat session, and to close/reset it on transport failure or epoch reset.

This is why “we send `previous_response_id` now” is not the whole story. The durable part is the **persistent transport + local baseline + response id** together.

## `x-codex-turn-state`: sticky routing, not a cache key

The Codex path also has an opaque `x-codex-turn-state` value. LingTai treats it carefully:

- capture it from the WebSocket handshake / response path when present;
- replay it during the same provider turn / tool loop where it is relevant;
- reset it on a new user-text turn;
- do not confuse it with `prompt_cache_key`, `session_id`, or `thread_id`.

This is best understood as sticky provider routing or turn-state metadata. It helps the provider continue the right active turn, but it is not the stable long-term cache identity. The stable identity remains the cache-affinity triple. The remote response continuation remains the WebSocket response-id chain.

## Why the baseline had to be converter-stable

After the connection issue was solved, another problem appeared: some turns still fell back to `ws_full` even when they seemed semantically continuous.

The root cause was schema shape.

LingTai has a local chat interface. Before sending to Codex Responses, it converts that interface into Responses input items. The server streams back output items in its own output schema. Those two schemas are related, but not byte-identical.

The first tempting baseline was:

```text
baseline = previous request input + raw server output items
```

But the next turn's `current_full_request.input` is produced again by LingTai's converter. If the baseline contains raw server output shape and the current request contains converter-produced input shape, a strict prefix comparison can fail every time.

The fix was to record the baseline from the converter after the assistant turn is represented in LingTai's own interface. In other words:

```text
baseline = converter_stable_input_after_last_turn
```

Now the next request is compared against something generated by the same converter, so strict prefix matching becomes meaningful.

This distinction is subtle but central. Incremental mode is not allowed to be “approximately equal.” It must be a safe byte-level prefix in the request representation that will actually be sent.

## Why old tool outputs had to be frozen

Tool calls made the baseline problem harder.

LingTai tool results include useful runtime metadata: notification snapshots, guidance, current state, and other envelopes that help the agent reason. But some of that metadata is **latest-only**. As time moves on, older visible tool-result blocks may no longer serialize exactly the same way. A field that was present when the model first saw the tool output may be stripped or replaced later.

That is good for context hygiene, but dangerous for a strict delta baseline.

Imagine this sequence:

```text
Turn N:
  tool output call_1 is sent with output = {payload, _meta: {...latest...}}
  model sees that exact string

Turn N+1:
  local replay of call_1 now serializes as {payload}
  or as {payload, _meta: different_latest_state}
```

Semantically it is the same tool result, but byte-for-byte it is not the same `function_call_output.output`. If the previous baseline contains one string and the next current input contains another, the prefix match breaks. LingTai must fall back to `ws_full`.

The fix was to freeze the first model-facing `function_call_output.output` per `call_id` inside a live Codex WebSocket session. When that old call id is replayed, LingTai reuses the exact string the model already saw.

This is not hiding information from the model. It preserves fidelity: the model saw the original output, so the remote response chain should continue from that original output. Fresh tool results still carry their fresh content. Orphan placeholder outputs are not frozen, because they are temporary scaffolding that will be replaced by the real tool result.

Periodic epoch reset and summarize-triggered reset clear the frozen-output map so stale metadata is not replayed forever.

## The state machine in one picture

Here is the simplified LingTai state machine.

```text
Start of a Codex WS epoch
  previous_response_id = None
  baseline = None
  frozen_outputs = {}
  websocket = open or will be opened

Turn 1
  full_input = convert(local_chat_history, frozen_outputs)
  send response.create:
    store = false
    input = full_input
    previous_response_id absent
  mode = ws_full
  receive response_id = resp_1
  record converter-stable baseline for the accepted turn

Turn 2
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

The important safety rule is that LingTai never uses incremental mode unless it can prove the prefix. A false `ws_incremental` would be worse than an expensive `ws_full`, because it would ask the model to continue from a remote state that may not match the local transcript.

## What happens on failure

The implementation treats failure as a state-boundary.

If streaming fails after LingTai has prepared a new baseline but before the server completes the response, LingTai restores the previous accepted baseline and closes the transport. The next turn must not compare against a request the server may not have accepted.

If the WebSocket path cannot be used, LingTai falls back to the HTTP full-replay path with `store=false`. That fallback is more expensive, but it is safe and preserves correctness.

If a prefix mismatch is detected, LingTai records a safe diagnostic such as `prefix_mismatch` and uses `ws_full`. This gives operators something concrete to inspect without leaking request bodies.

## Why summarize forces a fresh epoch

LingTai's `system(action="summarize")` replaces selected old visible tool-result blocks in local chat history with an agent-authored summary. That is good context hygiene. But for Codex's remote response chain, it creates a boundary.

The remote chain behind `previous_response_id` has already accepted the older full blocks. The local transcript now contains a shorter summary instead. There is no safe way to edit the remote chain in place and say: “please pretend the previous response id was built from this summarized transcript instead.”

So LingTai does the honest thing:

```text
on successful summarize:
  clear previous_response_id
  clear local baseline
  clear pending baseline
  clear frozen tool-output cache
  close/reset WebSocket transport
  mark next Codex request as fresh epoch
```

The next request is therefore `ws_full` with a diagnostic like:

```text
codex_ws_delta_reason = epoch_reset
codex_ws_epoch_reset_reason = summarize
```

After that full request establishes a new baseline, ordinary turns can return to `ws_incremental`.

This is why the operator guidance says: do not summarize one old block at a time in a tight loop on Codex. Each successful summarize intentionally breaks the response-id chain for the next request. If several noisy results are done and should be compacted, batch them into one summarize call rather than paying multiple fresh epochs.

## Periodic fresh epochs are intentional

Even without summarize, LingTai occasionally starts a fresh Codex epoch. The reason is hygiene.

A remote `previous_response_id` chain can otherwise carry old runtime metadata and frozen tool outputs indefinitely. The local truth is always LingTai's `chat_history`; the remote chain is an optimization. Periodic reset drops only request-side Codex state and then rebuilds a complete request from local history.

That reset clears:

- `previous_response_id`;
- the local delta baseline;
- pending baseline state;
- the frozen tool-output cache;
- the WebSocket transport.

It does **not** delete LingTai's local conversation. It just pays one `ws_full` request to start a clean remote chain.

## How to read the ledger

When inspecting token ledger or usage metadata, these fields are the useful ones:

```text
codex_request_mode          ws_full | ws_incremental | http_full
codex_store                 false
codex_previous_response_id  present only on incremental continuation
codex_prompt_cache_key      stable identity when enabled
codex_ws_delta_reason       ok, no_baseline, prefix_mismatch, epoch_reset, ...
codex_ws_epoch_reset_reason summarize, turn_count, ...
```

Interpretation:

- `ws_incremental` means the remote response chain continued with a delta.
- `ws_full no_baseline` is normal at the beginning of a session or after reset.
- `ws_full epoch_reset summarize` is expected immediately after `system(action="summarize")`.
- `ws_full prefix_mismatch` means LingTai refused to risk an invalid continuation because the current request did not strictly extend the saved baseline.
- `http_full` or fallback metadata means the WebSocket path could not be used and LingTai used the safe full-replay path.

Cached-token percentage and request mode are related but not identical. A `ws_full` request may still get prompt-cache benefits if the stable cache identity and prefix match. A `ws_incremental` request is stronger: it sends only the suffix and uses `previous_response_id` to continue remote state.

## Why cache works now

Putting the pieces together, the cache started working because LingTai now satisfies several contracts at once:

1. **Stable cache affinity.** `prompt_cache_key`, `session_id`, and `thread_id` are stable and aligned where applicable.
2. **Honest request identity.** Default Codex requests identify as LingTai, not as a first-party CLI impersonation experiment.
3. **Correct store contract.** ChatGPT Codex uses `store=false`; LingTai does not try to force unsupported `store=true`.
4. **Persistent WebSocket transport.** `previous_response_id` is reused on the same live WebSocket connection that established it.
5. **Client-side delta baseline.** LingTai records the last accepted request/response state and only sends a suffix when the current input strictly extends it.
6. **Converter-stable comparison.** Baselines are expressed in the same input schema LingTai will generate next turn.
7. **Frozen old tool outputs.** Tool output strings already seen by the model are replayed byte-identically per `call_id` inside the epoch.
8. **Safe fallback.** Any mismatch or failure returns to `ws_full` or HTTP full replay instead of gambling with remote state.
9. **Fresh-epoch hygiene.** Periodic reset and summarize-triggered reset prevent stale remote chains from living forever.

No single item was sufficient. Stable `prompt_cache_key` without WebSocket state still full-replayed. WebSocket without persistent connection could not resolve `previous_response_id`. Persistent connection without converter-stable baselines still collapsed into `ws_full`. Incremental mode without frozen tool outputs broke on moving metadata.

The final shape is a chain of small invariants.

## Practical operator guidance

If you run LingTai on Codex and care about cache behavior:

- Expect the first turn after startup, refresh, fallback, or epoch reset to be `ws_full`.
- Do not panic when `ws_full` appears with `no_baseline` or `epoch_reset`; those are normal safety boundaries.
- Investigate repeated `prefix_mismatch` if most turns never become `ws_incremental`.
- Batch `system(action="summarize")` calls. Summarizing five old tool results one by one costs five fresh epochs; summarizing them together costs one.
- Remember that `system(action="summarize")` is still good hygiene. The point is not “never summarize.” The point is “summarize deliberately.”
- Treat the local chat history as truth. The remote response chain is an optimization that may be discarded whenever safety requires.

## The bigger lesson

Codex Responses caching was not a one-flag feature. It was a protocol alignment problem.

The public-looking concepts — `prompt_cache_key`, `store`, `previous_response_id`, WebSocket streaming — only made sense after we learned which backend accepted which contract. For this endpoint:

- `store=true` was the wrong abstraction;
- stable cache identity was necessary but incomplete;
- `previous_response_id` belonged to a live WebSocket chain;
- the local client had to prove byte-stable deltas;
- the runtime had to expose honest telemetry so operators could tell when the optimization was active.

That is why LingTai now names the modes directly. `ws_full` says, “I rebuilt the remote state from local truth.” `ws_incremental` says, “I proved the prefix and continued the existing chain.” Both are correct. The improvement is that the agent can finally spend most ordinary continuation turns in the second mode, while still having a safe path back to the first whenever the transcript changes shape.
