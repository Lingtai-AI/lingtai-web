---
title: "Release notes: LingTai TUI v0.9.6 and kernel v0.14.2"
date: 2026-06-24
tags: [tech, devlog]
lang: en
description: "A multi-account release: agents and presets can each sign in to Codex as their own OAuth identity, the cockpit turns raw call logs into tool-call and API-call trend reports, /doctor becomes scrollable, loading text goes bilingual, the default context cap drops to 250k, and daemon/bash run-directory edge cases are fixed."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI <strong>v0.9.6</strong> and LingTai kernel <strong>v0.14.2</strong> are out. The headline is multi-account Codex: each agent or preset can point at its own OAuth token file, with a setup UI to match. The cockpit also learns to report where its calls go — tool-call and API-call trends, cache-miss detail in the kanban view — and gets a scrollable <code>/doctor</code>, bilingual loading text, and a more conservative 250k default context cap. The kernel fixes two run-directory edge cases that made long-running daemon work misreport its state.
</div>

This release is about running more than one identity, and seeing more than one number.

The previous window made the runtime honest about *who* it is and *how long* a turn takes. This one lets a fleet be several whos at once — different agents signing in as different Codex accounts — and turns the call log into something you can actually read.

## What changed

### TUI / Portal v0.9.6

- Multi-OAuth Codex: setup gained UI and preset support so you can choose which Codex identity a preset uses, instead of editing a token path by hand (#415).
- Swiss-knife trend reports: a new script and skill produce tool-call and API-call trend reports, with the script and skill wording aligned (#414).
- `/doctor` is scrollable and has section headers, so a long diagnostic readout is navigable instead of a single wall of text (#413).
- Loading strings are bilingual and i18n-aware, so the cockpit speaks the operator's language while it warms up (#412).
- The default context/token cap was lowered to 250k — a more conservative out-of-the-box working budget, still raisable per setup (#411).
- The kanban call view now shows cache-miss detail, so a turn that paid full price instead of hitting cache is visible where operators already look (#410).

### Kernel v0.14.2

- Per-agent and per-preset Codex OAuth token files: a new `manifest.llm.codex_auth_path` lets each agent or preset point at its own Codex OAuth token, so multiple ChatGPT accounts can run side by side; the default falls back to the shared path (#484).
- The daemon historical check now resolves run directories correctly after a refresh or molt, so prior-run inspection no longer breaks across a context shed (#483).
- An empty `working_dir` in a bash call is treated as unset and falls back to the default agent directory, instead of running against an ambiguous path (#480).

Alongside the features, the window carried release hygiene: the kernel update command is confirm-gated, a destructive global preset-split migration was neutralized so it can no longer rewrite operator presets, TUI release version comparisons are now classified explicitly, and the release star CSV was normalized.

## Why this matters

A fleet that mixes accounts needs each agent to authenticate as itself; a single shared token makes attribution and rate limits everyone's problem at once. Per-preset Codex auth turns "which account is this agent on" into a deliberate, inspectable choice. And you cannot tune what you cannot see — making tool-call trends and cache misses legible is the first step toward trimming them. The daemon and bash fixes target the exact moments a long session is most likely to lose track of where it is: just after a molt, or when a field is left empty.

## Validation

Kernel v0.14.2 was validated with:

- `python -m compileall` over `src` and `tests` (clean);
- focused and expanded pytest over the daemon, bash, notification, preset, deep-refresh, tool-executor, openai, codex, provider, and auth surfaces: 513 passed;
- `python -m build` for the sdist and wheel, and `twine check` on both (PASSED);
- PyPI confirmed `info.version = 0.14.2`.

TUI/Portal v0.9.6 was validated with:

- `git diff --check` against v0.9.5 (clean);
- full TUI Go tests, and `make clean && make build`;
- Portal web `npm ci && npm run build` (npm audit warnings noted, build and tests passed);
- full Portal Go tests, and `make clean && make build`;
- the Homebrew Release workflow succeeded for tag v0.9.6.

## Release links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.2>
- Runtime package source: <https://pypi.org/project/lingtai/0.14.2/>
- TUI release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.6>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Direction

The theme stays steady: make the runtime honest, measurable, and now plural. With multiple Codex identities and readable call trends in hand, the next step is to act on what they show — route work to the right account, and trim the calls that miss cache.
