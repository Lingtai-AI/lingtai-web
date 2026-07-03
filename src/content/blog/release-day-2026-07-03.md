---
title: "Release notes: LingTai kernel v0.16.1 and TUI/Portal v0.10.4"
date: 2026-07-03
tags: [tech, devlog]
lang: en
description: "A release about making context cleanup deliberate instead of reflexive: summarize markers now move through pending/done states, rebuild is an explicit tactical apply step, the hard forced-rebuild boundary is 1.0, and the TUI/Portal release tightens startup, setup, and self-update paths."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai kernel <strong>v0.16.1</strong> and TUI/Portal <strong>v0.10.4</strong> are out. The kernel makes summarize/rebuild behavior explicit: summaries are recorded as <code>pending</code>, <code>system(action="summarize", rebuild=true)</code> is the public tactical apply path, the emergency forced-rebuild boundary is <strong>1.0</strong>, and the runtime tells the agent not to loop rebuilds. The TUI/Portal release hardens startup and replay behavior, adds the <code>/update-tui</code> self-update command, tightens setup/config handling, and keeps Homebrew release hygiene current.
</div>

This window is about resisting the cleanup reflex.

A long-running agent should summarize noisy results, but it should not rebuild the provider context just because a summary exists. v0.16.1 turns that distinction into a visible state machine: record the grain now, apply it later when the context is high or a fresh context is worth the cache-miss cost. At the same time, the cockpit side gets safer startup, clearer update paths, and tighter setup defaults.

## What changed

### Kernel v0.16.1

- **Summarize markers have state.** Summary markers now move through explicit `status: pending` and `status: done` states, and pending totals are computed from that state rather than from every historical marker (#692).
- **Rebuild is a public boolean, not a hidden mode.** The public API is now `system(action="summarize", rebuild=true)`. Public `rebuild_only` / `dry_run` wording is gone; the internal epoch label remains only as runtime reconstruction metadata (#692).
- **The hard boundary is truly hard.** The runtime forced-rebuild boundary is now 1.0 of the context window. It applies pending summaries then, but also runs even when there are no pending summaries so a fresh replay can drop transient context such as agent meta, notifications, and cleared surfaces (#692).
- **The guidance discourages rebuild loops.** Summarize-only results explain that the active provider context may still contain the old raw result; rebuild results explain what was applied and say to molt rather than repeatedly rebuild if the rebuilt context remains above the 0.6 recovery target (#692).
- **Runtime reliability polish.** Compact stable daemon IDs, streamed tool-call fallback logging, JSONL close-race guards, empty-response usage handling, restored token accounting, token-scope/layout fixes, refresh rebuild opt-in, atomic chat-history writes, and AED/inquiry/logger cleanups landed across the same window (#693, #691, #689, #688, #683, #682, #679, #684, #651, #656, #666, #665).
- **Addon and safety updates.** Telegram dynamic slash-command docs, WeChat filename sanitization, email schedule-doc cleanup, gitignore/secrets safeguards, nirvana lifecycle signaling, preset default persistence, runtime venv markers, and the NoKV workbench MCP example/metadata validation are included (#686, #646, #687, #628, #629, #647, #685, #637).

### TUI / Portal v0.10.4

- **Portal startup and replay cleanup.** Portal startup timeout cleanup, replay-cache writer sharing, and the `rehydrateDone` guard reduce deadlock and startup edge cases (#530, #521, #519).
- **Self-update and refresh paths.** The TUI now has a `/update-tui` self-update command, and utility refresh during startup is explicit (#500, #525).
- **Setup and config hardening.** Setup credential Esc behavior returns to setup correctly, `config.json` permissions are tightened to `0600`, and runtime venv environment-marker checks make dev/runtime state more explicit (#499, #514, #528).
- **UI and docs polish.** Chat stays anchored to the bottom after verbose toggles, dead setup routes were removed, canonical recipe preview resolvers are used, release docs were refreshed, and the release commit normalizes stars CSV whitespace (#469, #522, #523, #524).

## Why this matters

Summarization and rebuilding are different operations with different costs. Summarization is a local memory decision: preserve the important facts and stop carrying the raw text as first-class context. Rebuild is a provider-context decision: pay a cache-miss cost to make pending summaries active now. When the runtime collapses those two ideas into one vague reminder, agents are tempted to rebuild as cleanup. When it names the states and the thresholds, the agent can wait.

That is the release's central design choice. v0.16.1 tells the agent: a pending summary is normal; rebuild tactically at the 0.75 hint or when a fresh context is worth it; if the emergency 1.0 path fires, treat it as an emergency path; if rebuilt context still sits above 0.6, stop looping and molt. The result is less context churn and fewer expensive reflexes.

The TUI/Portal work follows the same taste: remove hidden traps from startup, setup, and update paths. A cockpit that starts cleanly, updates explicitly, and stores config with stricter permissions gives the runtime's new discipline somewhere visible to land.

## Contributor scope

The public contributor set below was audited from the strict release windows: kernel `v0.16.0..v0.16.1` and TUI/Portal `v0.10.3..v0.10.4`. The audit used commit authors plus parsed PR authors/review/comment evidence for the PRs in the window, and excludes AI/model names from the public contributor field.

Public contributors for this release window: `huangzesen`, `BrianLiubr`, `TZZheng`, `ZigongXu`, `BatalloLu`, `wchwawa`.

## Validation and release hygiene

Kernel v0.16.1 gates from a clean release worktree:

- `git diff --check v0.16.0...HEAD` passed;
- `python -m compileall -q src tests` passed;
- focused pytest set passed: `400 passed in 20.36s`;
- `python -m build` produced `lingtai-0.16.1.tar.gz` and `lingtai-0.16.1-cp312-cp312-macosx_11_0_arm64.whl`;
- `python -m twine check dist/*` passed;
- PyPI JSON verification confirmed <https://pypi.org/project/lingtai/0.16.1/> and both uploaded files.

TUI/Portal v0.10.4 gates from a clean release worktree:

- `git diff --check v0.10.3...HEAD` passed after stars CSV normalization;
- `cd tui && go test -count=1 ./...` passed;
- `cd portal/web && npm ci && npm run build` passed (npm audit still reports four pre-existing advisories);
- `cd portal && go test -count=1 ./...` passed;
- `cd tui && make clean && make build && ./bin/lingtai-tui version` passed;
- `cd portal && make clean && make build && ./bin/lingtai-portal version` passed.

Homebrew release hygiene:

- TUI v0.10.4 tarball SHA256: `cc5622562d98ed21449df62425547af4bfabeaf6642090ea85d2702a88c61d68`;
- the Homebrew tap updated to v0.10.4, then formula style was cleaned so `brew audit --formula --strict --online lingtai-ai/lingtai/lingtai-tui` passed;
- `brew fetch --force --formula lingtai-ai/lingtai/lingtai-tui` passed without changing the local dev PATH.

## Links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.1>
- TUI/Portal release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.4>
- Runtime package source (PyPI): <https://pypi.org/project/lingtai/0.16.1/>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>
- Kernel compare: <https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.16.0...v0.16.1>
- TUI compare: <https://github.com/Lingtai-AI/lingtai/compare/v0.10.3...v0.10.4>
- Previous release log: <https://lingtai.ai/en/releases/20260701-1/>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Direction

The runtime now has a cleaner answer to a subtle question: when should an agent keep working, and when should it pay for a fresh context? The answer is no longer "whenever a summary exists." It is: keep the grain, wait for the threshold or the need, and molt when repeated rebuilding would only hide the real pressure.
