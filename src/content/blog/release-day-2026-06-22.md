---
title: "Release notes: LingTai TUI v0.9.5 and kernel v0.14.0"
date: 2026-06-22
tags: [tech, devlog]
lang: en
description: "An honesty-and-latency release: the kernel sends truthful Codex metadata and the operator's own account header, records where turn time actually goes, and recovers from wedged turns; the TUI starts faster and renders fuller notifications."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI <strong>v0.9.5</strong> and LingTai kernel <strong>v0.14.0</strong> are out. The kernel makes the Codex integration more honest and observable — accurate request metadata, the operator's own ChatGPT account header, and end-to-end LLM latency telemetry — while hardening turn recovery. The TUI gets a faster launch path and richer, more readable notifications.
</div>

This release is about telling the truth and measuring the cost.

The previous window made tool-result metadata visible. This one turns that lens on the runtime's own behavior: what it tells the backend about itself, and how long each phase of a turn actually takes. Less guessing, more measurement.

## What changed

### TUI / Portal v0.9.5

- Launch is faster: the authoritative session rebuild is deferred off the launch path, and the session cache is now concurrency-safe so a deferred rebuild can't race the UI.
- `/daemons` lazy-loads run detail, and token-ledger reads now stream instead of loading whole JSONL files into memory.
- Notification snapshots render their full meta envelope and markdown blocks, are scrollable, and persist across restarts.
- The initial mail view shows a `loading…` banner while the first rebuild is pending instead of looking empty.
- Codex thinking defaults to `xhigh`, with a reasoning-effort preset option.
- Setup preserves agent identity and legacy init-preset fields; portal meta hygiene and repo ignore rules were tightened.

### Kernel v0.14.0

- Agents send an honest metadata envelope to the Codex backend, and forward the operator's own `ChatGPT-Account-ID` header on Codex requests, so attribution and account routing are accurate.
- New LLM latency telemetry records provider-wait and per-phase timings, so operators can see where a turn's time is actually spent.
- Long tool results are surfaced in agent meta with a top-10 preview list and char counts; metadata is nested under `_meta` and excluded from summarize sizing, so it no longer distorts the context budget.
- Durable tool results are replayed before heal, and turns poisoned by a stuck worker (`WorkerStillRunning`) now recover instead of wedging.
- Legacy molt-pressure configuration is ignored; molt pressure moved into agent meta.

## Why this matters

When an agent runs for hours, two questions decide whether you trust it: *what is it telling the world about itself*, and *where is the time going*. This release answers both. The honest metadata envelope and forwarded account header mean Codex sees the truth about who is calling; the latency telemetry means a slow turn is now a measurable fact instead of a hunch. The recovery work — durable replay, poison recovery — keeps a single stuck turn from taking down a long session.

## Validation

Kernel v0.14.0 was validated with:

- full pytest suite: 2635 passed, 4 skipped;
- `python -m build` for the sdist and macOS arm64 wheel;
- `twine check` on both artifacts (PASSED);
- a clean-venv install from the published wheel (`import lingtai → 0.14.0`).

TUI/Portal v0.9.5 was validated with:

- focused TUI tests for the changed areas;
- full TUI Go tests;
- Portal web install/build (vite);
- Portal Go tests.

## Release links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.0>
- Runtime package source: <https://pypi.org/project/lingtai/0.14.0/>
- TUI release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.5>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Direction

The theme stays steady: make the runtime honest about itself, and measurable. With latency now instrumented, the next step is to act on what it shows — trim the slow phases, and keep long-running work both truthful and recoverable.
