---
title: "Release notes: LingTai kernel v0.14.1"
date: 2026-06-23
tags: [tech, devlog]
lang: en
description: "A Codex Responses stability release: persistent WebSocket state, safer cache resets, honest LingTai identity, and practical guidance for batching summarize calls so Codex cache stays warm."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai kernel <strong>v0.14.1</strong> is out. This release stabilizes the ChatGPT Codex Responses integration: persistent WebSocket reuse, incremental <code>previous_response_id</code> continuation, frozen tool outputs, fresh-epoch resets, honest LingTai identity, and a concise runtime warning about batching summarize calls so Codex cache does not get broken repeatedly.
</div>

The short version: LingTai can now keep a Codex conversation warm for longer, and it knows when to start over.

The previous release made the integration more observable. This patch release focuses on the state chain behind each Codex turn: when we can safely continue it, when we must rebuild it, and how to avoid accidentally resetting it over and over.

## What changed

### WebSocket continuation for Codex Responses

LingTai now keeps a persistent WebSocket path for ChatGPT Codex Responses. When the local history matches the remote baseline, the next turn can be sent as an incremental request instead of a full replay. In the token ledger this appears as:

- <code>ws_incremental</code>: continue the existing remote <code>previous_response_id</code> chain;
- <code>ws_full</code>: send a complete request reconstructed from local history and start a fresh remote state chain.

That distinction matters because Codex caching is not only about sending the same prompt text. It is also about preserving the backend state chain that knows what the previous response already contained.

### Safer tool-output handling

Tool outputs are now frozen against the baseline used for the Codex request. That prevents a later local mutation from changing what an incremental Codex request thinks it is replying to. If a mismatch appears, LingTai can fall back to a full request instead of building on a stale or inconsistent remote state.

### Fresh epochs, but with restraint

LingTai now has two ways to start a fresh Codex epoch:

1. a periodic reset after the configured interval, and
2. an immediate reset after a successful local <code>system(action="summarize")</code>.

A fresh epoch is useful when old metadata or frozen tool-output state should be left behind. But it has a cost: the next Codex request is <code>ws_full</code>, not <code>ws_incremental</code>. If you summarize five large tool results one at a time, you can force five cache-breaking fresh epochs.

That is why the runtime comment now says the quiet part out loud: for Codex specifically, do not summarize ordinary long results one by one within a few turns. Read them, decide which raw payloads are no longer needed, and summarize several finished results together. Other providers are much less sensitive to this <code>previous_response_id</code> boundary.

### Honest identity by default

During earlier protocol experiments, we compared LingTai's requests against the official Codex CLI request shape. That experimental path remains available locally, but the shipped default is now explicit and honest:

- <code>originator: lingtai</code>
- <code>User-Agent: LingTai/&lt;version&gt;</code>

The official CLI-shaped identity is only an opt-in comparison switch. The release also updates the surrounding comments, tests, and ANATOMY notes so the documentation no longer describes the old experiment as the default.

### Runtime and documentation cleanup

This release also carries smaller but important cleanup:

- daemon terminal-state notifications are preserved more reliably;
- oversized tool-result comment metadata is kept out of the wrong context budget path;
- OpenAI/Codex ANATOMY citations were refreshed;
- base-agent, email, and notification ANATOMY line ranges were repaired;
- the local ANATOMY citation checker passed 599 citations with 0 issues.

## Validation

Kernel v0.14.1 was validated with:

- full pytest suite: <code>2715 passed, 4 skipped in 304.41s</code>;
- targeted Codex adapter-comment and identity tests: <code>42 passed</code>;
- <code>python -m build</code>;
- <code>python -m twine check dist/*</code>;
- artifact inspection: 0 <code>__pycache__</code> or <code>.pyc</code> entries in both wheel and sdist;
- custom all-ANATOMY citation check: 599 checked, 0 issues.

## Release links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.1>
- Runtime package source: <https://pypi.org/project/lingtai/0.14.1/>
- Release report: <https://github.com/Lingtai-AI/lingtai-kernel/tree/main/reports/kernel-release-v0.14.1-20260623>

## Artifact SHA-256

- <code>952be6499f75df3f83624276c3b9adb0ade8a8862f3f1f57575e0d9a148f7321</code> — <code>lingtai-0.14.1-cp312-cp312-macosx_11_0_arm64.whl</code>
- <code>9574b9a81f0deb673e71fa090ba925aa3f05f84c2dbf9ccafa040e1381e756a3</code> — <code>lingtai-0.14.1.tar.gz</code>
