---
title: "The Anatomy of a Codex Request: What's on the Wire"
date: 2026-06-21
tags: [tech]
lang: en
description: "A source-guided map of the Codex OAuth request path: official Codex CLI, LingTai's native adapter, and CLIProxyAPI's proxy translation layer."
---

<div class="callout callout-tldr">
<strong>TL;DR.</strong> Codex is not just “OpenAI chat completions with a different model name.” The ChatGPT-backed Codex path talks to <code>https://chatgpt.com/backend-api/codex/responses</code>, sends a Responses-style body, receives SSE events, and wraps the request in an identity envelope. The two identity fields that matter most are the OAuth bearer token and the <code>ChatGPT-Account-ID</code> derived from the user's account claims. Client markers such as <code>originator</code>, <code>User-Agent</code>, session/thread/cache IDs, installation IDs, and beta flags are important for routing, telemetry, caching, or compatibility — but they are not a license to impersonate a first-party CLI.
</div>

We originally looked at CLIProxyAPI while exploring whether LingTai should expose Claude Max and Codex subscriptions through a local OpenAI-compatible API. The Claude Max direction was the wrong product boundary: it would encourage account-risky subscription proxying. Codex is different for LingTai because we already have a native OAuth-backed Codex adapter. The right question is therefore narrower and safer:

> What does a legitimate Codex OAuth request look like on the wire, and which parts should LingTai preserve for compatibility without copying a moving CLI fingerprint?

This post is a source-guided answer. It compares three implementations:

1. **Official Codex CLI** — the reference for how OpenAI's own client constructs Codex requests.
2. **LingTai** — our current native Codex adapter.
3. **CLIProxyAPI** — a reverse proxy/translator that accepts standard API-shaped calls and emits Codex backend requests.

All findings below come from static source inspection. No authenticated requests were made, no bearer tokens or JWT payloads are published, and the examples deliberately describe structure rather than real credentials.

## 1. The destination is Responses, not chat completions

The ChatGPT-backed Codex path uses the Codex backend under:

```text
https://chatgpt.com/backend-api/codex
```

The primary model endpoint is:

```text
POST /responses
Accept: text/event-stream
```

The official Codex source defines the ChatGPT-backed Codex base URL separately from the API-key OpenAI base URL (`openai/codex: codex-rs/model-provider-info/src/lib.rs:37,249`). Its core client records `/responses` as the primary endpoint, `/responses/compact` for unary history compaction, and `/memories/trace_summarize` for memory tracing (`openai/codex: codex-rs/core/src/client.rs:150-155`). The `codex-api` endpoint wrapper posts to the literal path `responses`, sets `Accept: text/event-stream`, and returns a streamed `ResponseEvent` channel (`openai/codex: codex-rs/codex-api/src/endpoint/responses.rs:101,143-162`).

That matters because a Codex request body is a **Responses API body**, not a chat-completions body. In the official client, the request type includes fields such as:

- `model`
- `instructions`
- `input` as an array of response items, not chat messages
- `tools`
- `tool_choice`
- `parallel_tool_calls`
- `reasoning`
- `store`
- `stream`
- `include`
- `service_tier`
- `prompt_cache_key`
- `text`
- `client_metadata`

Those fields are defined in `ResponsesApiRequest` (`openai/codex: codex-rs/codex-api/src/common.rs:183-203`) and assembled by the core Codex client (`openai/codex: codex-rs/core/src/client.rs:770-828`). The official client also uses `store=false` for the stateless path and defaults `prompt_cache_key` from the thread identity (`openai/codex: codex-rs/core/src/client.rs:420-424,809`).

The streaming response is also Codex-specific. The official parser turns SSE into typed events such as `response.created`, `response.output_item.added`, `response.output_item.done`, `response.output_text.delta`, custom tool-call deltas, reasoning-summary deltas, `response.completed`, `response.failed`, and `response.incomplete` (`openai/codex: codex-rs/codex-api/src/common.rs:72-114; codex-rs/codex-api/src/sse/responses.rs:298-449`). Some server facts arrive in headers instead of event bodies — for example the effective model, rate limits, model etags, request id, and whether server-side reasoning was included (`openai/codex: codex-rs/codex-api/src/sse/responses.rs:37-79`).

## 2. The identity envelope has layers

The most useful way to reason about Codex HTTP identity is to separate **authorization**, **account binding**, **client markers**, and **routing/cache metadata**.

| Layer | Examples | Role | Copying guidance |
| --- | --- | --- | --- |
| Authorization | `Authorization: Bearer <access-token>` | Proves the request is made with an OAuth/API token. | Required, but never log or publish the value. |
| Account binding | `ChatGPT-Account-ID` / `Chatgpt-Account-Id` | Binds the token to a ChatGPT account claim. | Required for ChatGPT-family Codex; derive from the user's own auth claims, do not invent. |
| Client markers | `originator`, `User-Agent` | Tell the backend what client family is calling. | Treat as moving compatibility/fingerprint data, not a stable public API. |
| Routing/cache metadata | `session-id`, `thread-id`, `x-codex-installation-id`, `x-codex-window-id`, `x-codex-turn-metadata`, `x-client-request-id`, `prompt_cache_key` | Help continuity, caching, telemetry, and server routing. | Safe to model conceptually; do not publish real per-user values. |
| Conditional/residency | `X-OpenAI-Fedramp` | Handles FedRAMP/residency cases. | Only send when the account claim says so. |
| Integrity/attestation | `x-oai-attestation` | Integrity signal from the official stack. | Do not copy blindly. Omit unless you can produce it honestly. |

The official bearer-auth provider injects the bearer token, `ChatGPT-Account-ID`, and optional FedRAMP header together (`openai/codex: codex-rs/model-provider/src/bearer_auth_provider.rs:31-47`). The account id is not guessed from an email address. It is extracted from the OAuth id token's namespaced `https://api.openai.com/auth` claim, which includes fields such as `chatgpt_account_id`, plan, user id, and FedRAMP status (`openai/codex: codex-rs/login/src/token_data.rs:72-99; codex-rs/login/src/server.rs:808-812`).

The OAuth flow itself is a normal public-client flow with PKCE. The official CLI uses `https://auth.openai.com`, local redirect handling, S256 PKCE, and scopes including `openid`, `profile`, `email`, `offline_access`, and connector scopes (`openai/codex: codex-rs/login/src/server.rs:52,157,499,520,731; codex-rs/login/src/pkce.rs:19-25`). Tokens are stored in `$CODEX_HOME/auth.json` with mode `0600`; the stored data includes id/access/refresh tokens and the account id (`openai/codex: codex-rs/login/src/auth/storage.rs:39-61,126-128,178-195; codex-rs/login/src/token_data.rs:10-25`). Refresh is a POST to the OAuth token endpoint with a refresh-token grant and is guarded by local synchronization plus a five-minute expiry window (`openai/codex: codex-rs/login/src/auth/manager.rs:118,1231-1272,1330-1334`).

### About `originator` and `User-Agent`

A common trap is to treat CLI marker strings as if they are the protocol. They are not.

In current upstream Codex, the default first-party originator is `codex_cli_rs`, and the User-Agent follows a `codex_cli_rs/<version> (...)` shape. The source still recognizes `codex-tui`, but that is not the current default (`openai/codex: codex-rs/login/src/auth/default_client.rs:36,122-125,133-156,232-247`). This is a freshness correction to older notes and to tools that still hard-code `codex-tui`.

The lesson is simple: client markers are **moving operational facts**. They are useful when diagnosing backend behavior, but a product should not build its safety or legitimacy on copying them.

## 3. LingTai's current path: native, stateless, honest

LingTai does not shell out to Codex CLI and does not route Codex through CLIProxyAPI. The kernel registers a native `codex` provider backed by `CodexOpenAIAdapter`, a `CodexTokenManager`, and the base URL `https://chatgpt.com/backend-api/codex` (`Lingtai-AI/lingtai-kernel: src/lingtai/llm/_register.py:61-105`). The adapter ultimately calls `client.responses.create(...)` through the OpenAI Python SDK (`Lingtai-AI/lingtai-kernel: src/lingtai/llm/openai/adapter.py:1850`). The vision Codex helper uses the same base and same Responses call shape (`Lingtai-AI/lingtai-kernel: src/lingtai/services/vision/codex.py:23,74`).

Authentication comes from the TUI's `~/.lingtai-tui/codex-auth.json`. LingTai refreshes through `https://auth.openai.com/oauth/token` with the same public client id family and a refresh-token grant; refresh uses a file lock and a five-minute safety buffer (`Lingtai-AI/lingtai-kernel: src/lingtai/auth/codex.py:17-18,35-36,99,110-127`). The SDK supplies the bearer token header from the refreshed access token.

LingTai also made a deliberate compatibility choice: the Codex adapter sends a full stateless input each turn, forces `stream=True`, forces `store=False`, deliberately omits `previous_response_id`, and never sends `prompt_cache_retention` (`Lingtai-AI/lingtai-kernel: src/lingtai/llm/openai/adapter.py:1629-1645,1806-1841`). It uses `prompt_cache_key` for backend cache affinity while avoiding Anthropic-style `cache_control` leakage, which the Codex backend rejects (`Lingtai-AI/lingtai-kernel: tests/test_codex_prompt_cache_key.py:1-11`).

For continuity and cache affinity, LingTai derives one stable eight-character hash from the agent's `init.json` path and reuses it as `session_id`, `thread_id`, and `prompt_cache_key`. The provider-default wiring injects the agent path as the default anchor only for Codex; explicit manifest settings still win (`Lingtai-AI/lingtai-kernel: src/lingtai/llm/service.py:63-83,87-142; src/lingtai/llm/openai/adapter.py:96-106,1655-1701`). The current adapter uses underscore header names `session_id` and `thread_id`, matching captured backend behavior in LingTai's tests and comments (`Lingtai-AI/lingtai-kernel: src/lingtai/llm/openai/adapter.py:61-67,1682-1702`).

Most importantly, LingTai does **not** pretend to be the official CLI. It sends honest client identity headers: `originator: lingtai` and `User-Agent: LingTai/<version>` (`Lingtai-AI/lingtai-kernel: src/lingtai/llm/openai/adapter.py:154-156`). That is the right product boundary.

### The main gap: account id

The biggest compatibility gap is that LingTai currently does not send `ChatGPT-Account-ID`. The official Codex bearer-auth path treats that account header as part of the normal identity envelope (`openai/codex: codex-rs/model-provider/src/bearer_auth_provider.rs:31-47`), and CLIProxyAPI also extracts it from Codex OAuth metadata before forwarding requests (`router-for-me/CLIProxyAPI: internal/auth/codex/jwt_parser.go:43-50,101; internal/runtime/executor/codex_executor.go:1660-1669`).

That does not mean LingTai should impersonate Codex CLI. It means LingTai should eventually parse the user's own OAuth id token/account metadata and send the user's own `ChatGPT-Account-ID` alongside the bearer token. That is an interoperability fix, not a subscription-proxy feature.

Other differences are less urgent:

- LingTai does not send `x-codex-installation-id`.
- LingTai does not echo `x-codex-turn-state`.
- LingTai does not negotiate Responses-over-WebSocket or the associated `OpenAI-Beta` path.
- LingTai does not use zstd request compression.
- LingTai correctly does not invent `x-oai-attestation`.

## 4. CLIProxyAPI's Codex path: translate, impersonate, bridge

CLIProxyAPI approaches Codex from a different product angle. It exposes standard API-shaped endpoints, then translates those requests into the Codex backend's Responses shape.

Its OAuth code uses the same auth.openai.com family, PKCE, local redirect, and Codex-specific query parameters such as `codex_cli_simplified_flow` and organization-id token additions (`router-for-me/CLIProxyAPI: internal/auth/codex/openai_auth.go:25-28,75,79-81`). It parses the id token/JWT to extract `chatgpt_account_id`, plan, organizations, and email (`router-for-me/CLIProxyAPI: internal/auth/codex/jwt_parser.go:43-50,101`). It stores credential files named from email and plan and supports refresh flows (`router-for-me/CLIProxyAPI: internal/auth/codex/filename.go:9-27; internal/auth/codex/openai_auth.go:168-175,210-277`). It also has a device-login path through `https://auth.openai.com/codex/device` and polling endpoints (`router-for-me/CLIProxyAPI: sdk/auth/codex_device.go:28-32,99`).

At runtime, CLIProxyAPI's executor defaults the upstream base URL to `https://chatgpt.com/backend-api/codex`, translates the incoming request body into Codex Responses form, deletes fields that the Codex backend should not receive, and posts to `/responses` (`router-for-me/CLIProxyAPI: internal/runtime/executor/codex_executor.go:786-846,1073-1145`). It also has a `/responses/compact` path for compaction (`router-for-me/CLIProxyAPI: internal/runtime/executor/codex_executor.go:972-1018`).

The header layer is where its proxy role is clearest. `applyCodexHeaders` sets JSON content type, bearer authorization, stream `Accept`, optional beta/turn/client-request headers, a User-Agent, an Originator, and — for OAuth accounts — `Chatgpt-Account-Id` from auth metadata (`router-for-me/CLIProxyAPI: internal/runtime/executor/codex_executor.go:1625-1677`). Its current hard-coded defaults still look like `codex-tui` (`router-for-me/CLIProxyAPI: internal/runtime/executor/codex_executor.go:38-39`), while current upstream Codex CLI has moved its default originator to `codex_cli_rs`.

That contrast is useful. CLIProxyAPI is valuable as a translator for clients that cannot speak Codex Responses. But for LingTai, which already has a native Codex adapter, adding a local proxy layer would mostly add moving fingerprint risk and another place for protocol drift.

## 5. What LingTai should learn — and what it should not copy

The safe lessons are implementation lessons:

1. **Send the account id honestly.** Parse the user's own OAuth id token or stored account metadata and add `ChatGPT-Account-ID`/`Chatgpt-Account-Id` consistently with the official account claim.
2. **Keep the native Responses path.** Continue sending `POST /responses` with Responses body fields rather than wrapping Codex as chat completions.
3. **Keep stateless turns explicit.** `store=false`, full input replay, and stable cache affinity are understandable and testable.
4. **Keep identity honest.** `originator: lingtai` is better than chasing `codex_cli_rs`/`codex-tui` strings.
5. **Treat fingerprints as freshness data.** User-Agent, Originator, beta flags, and client marker headers can change; cite the exact source version when debugging.
6. **Do not copy integrity signals.** Fields like `x-oai-attestation` should only exist if LingTai can produce them honestly.
7. **Improve diagnostics.** If the backend rejects a request, log structural metadata — provider, endpoint, presence/absence of account id, cache-affinity id hash, request id — but never log bearer tokens, refresh tokens, id tokens, raw JWT payloads, real account ids, or per-user session values.

The unsafe lesson would be to turn subscriptions into a generic resale-like API surface. That is not LingTai's direction.

## 6. Redaction rules for future debugging

When debugging Codex OAuth requests, it is safe to share:

- endpoint paths and HTTP method;
- request field names;
- SSE event names;
- source file and line references;
- whether a header is present or absent;
- short non-secret hashes used only for local correlation.

Do not share:

- access tokens, refresh tokens, id tokens, JWT payloads, or decoded JWT claim values;
- real `ChatGPT-Account-ID` values;
- email, organization id, user id, plan metadata, or FedRAMP status for a real account;
- real `x-codex-installation-id`, session id, thread id, window id, turn metadata, cache key, or request id from captured traffic;
- `x-oai-attestation` values;
- local auth file contents.

A good bug report says, “the `ChatGPT-Account-ID` header was absent,” not “here is my account id.”

## 7. The short version for maintainers

- Codex OAuth's request anatomy is closer to **ChatGPT backend Responses/SSE** than to public OpenAI chat completions.
- Official Codex CLI sends bearer auth plus `ChatGPT-Account-ID` and then layers client/routing metadata around it.
- LingTai already does the right high-level thing: native Responses, honest identity, stateless replay, stable cache affinity.
- The highest-value compatibility fix is to add honest `ChatGPT-Account-ID` support from the user's own auth metadata.
- CLIProxyAPI is a useful comparison because it shows how a translator/proxy fills in Codex backend headers, but LingTai should not adopt the proxy/impersonation boundary as its primary product path.

This gives us a safer rule of thumb: **match the protocol, not the costume.**
