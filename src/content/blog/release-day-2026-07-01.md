---
title: "Release notes: LingTai kernel v0.16.0 and TUI/Portal v0.10.3"
date: 2026-07-01
tags: [tech, devlog]
lang: en
description: "A paired release that puts the runtime's cache economy under an explicit budget. The kernel adds a cache_miss_budget — a per-session, per-molt soft cap defaulting to a million cache-miss tokens that restamps a durable molt-now cue when reached. Soul flow becomes an explicit env opt-in, token/meta surfaces get leaner and more inspectable, and the TUI shows cache-miss tokens inline, teaches the soul-flow opt-in, exposes model-visible summary previews, and adds clipboard image paste. Plus a Kimi backend, a claude-p wait guard, Codex replay self-heal, and full release hygiene."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai kernel <strong>v0.16.0</strong> and TUI/Portal <strong>v0.10.3</strong> put the runtime's cache economy and context-pressure signals under an explicit budget. The kernel adds a <code>cache_miss_budget</code> — a per-session, per-molt soft cap defaulting to <strong>1,000,000</strong> cache-miss tokens; when it is reached the runtime restamps <code>cache miss budget {budget} reached, molt now</code> under durable context metadata, alongside a running cache-miss count. Soul flow becomes an explicit env opt-in via <code>LINGTAI_SOUL_FLOW_ENABLED</code>. Token and meta surfaces get leaner and more inspectable, and the TUI shows current-session cache-miss tokens inline, teaches the soul-flow opt-in in setup and kanban, exposes model-visible summary previews, and adds clipboard image paste. Both versions were validated from clean release worktrees before publication.
</div>

This window is about making the cost of a long run visible and spendable. A cache miss is where a long-running agent quietly burns money and context, and until now it accrued invisibly. v0.16.0 turns it into a budget: a soft cap you can see counting down, with a durable `molt now` cue when it runs out. Alongside it, soul flow stops running silently by default, the runtime's token and meta surfaces get leaner, and the cockpit surfaces exactly what the model saw.

## What changed

### Kernel v0.16.0

- **Cache-miss budgets.** `manifest.cache_miss_budget` and `AgentConfig.cache_miss_budget` add a per-session, per-molt cache-miss soft cap defaulting to 1,000,000 tokens. When it is reached, the runtime restamps `cache miss budget {budget} reached, molt now` under `_meta.tool_meta.context.molt`, alongside `cache_miss_budget` and `cache_miss_tokens` (#641).
- **Honest context-pressure reminders.** Current context-pressure reminders now live in durable `_meta.tool_meta.context.molt`, while reconstruction one-shots stay under `_meta.tool_meta.reconstruction.molt`, so a standing molt cue is no longer confused with a one-time rebuild (#640, #638, #607).
- **Soul flow is opt-in.** Soul flow is env opt-in by default via `LINGTAI_SOUL_FLOW_ENABLED`; `soul(action="flow")` returns a stable disabled result unless the flag is set (#639).
- **Leaner token/meta surfaces.** Compact flattened token diagnostics, current time under `tool_meta`, sparse `agent_meta`, sparse notifications, large-result ranking in `agent_meta`, and a-priori `summary=true` support for `bash`, `read`, and `grep` (#608, #618, #620, #609, #586).
- **Daemon/runtime backends.** A Kimi Code backend, a claude-p background wait guard, explicit daemon email-tool surfacing, common daemon MCP completion, HTTP identity headers on outbound calls, and Codex encrypted-reasoning replay self-heal, plus backend/runtime/helper refactors (#634, #611, #584, #636, #633).

### TUI / Portal v0.10.3

- **Cache-miss telemetry.** Mail/home telemetry shows current-session cache-miss tokens immediately after the token total, e.g. `tok 1.1M (miss 8.6k)  cache …` (#498).
- **Soul-flow opt-in in the cockpit.** Setup and kanban reflect the opt-in model: soul flow is disabled by default unless `LINGTAI_SOUL_FLOW_ENABLED` is set (#497).
- **Model-visible summaries.** The TUI presents `summary=true` tool results as a model-visible summary after the raw tool output, and Ctrl+O / soul-mode tool-call previews expose summarized model-visible results with longer summary previews (#477, #481, #480, #479).
- **Cockpit polish.** Clipboard image paste support landed for chat input, the stamina surfaces were removed, and bundled skill/anatomy/frontmatter metadata was refreshed (#467, #478, #464–#459).

## Why this matters

A cache miss is the quiet cost of a long run — it burns money and context at the same time, and an invisible cost is one nobody manages. Turning it into a budget with a visible running count and a durable `molt now` cue makes that cost spendable: the operator and the agent both see it accrue, and both know when it is time to molt rather than keep paying.

The same instinct runs through the rest of the window. A powerful behavior that runs silently by default is a surprise waiting to happen, so soul flow becomes an explicit flag with a stable disabled result — on only when someone chose it, with the cockpit showing that choice rather than guessing at it. And an agent reasons better on a lean, ranked view than on a wall of raw meta, so the token and meta surfaces get flattened and thinned while the TUI surfaces exactly what the model saw. Less hidden cost, fewer silent defaults, more of the picture visible.

## Validation and release hygiene

Both versions were validated from clean release worktrees before publication.

Strict ranges for this window:

- Kernel `v0.15.3..v0.16.0`: 88 commits (27 merge + 61 non-merge), 48 merged PRs, 283 files changed, +15,005/-6,365.
- TUI/Portal `v0.10.2..v0.10.3`: 32 commits (12 merge + 20 non-merge), 14 merged PRs, 117 files changed, +2,904/-450.

Kernel v0.16.0 gates:

- `git diff --check` against v0.15.3 (clean);
- Dev-1/Dev-2/Dev-3 independent post-v0.15.3 validation gate PASS after cleanup PR #642;
- focused dev-1 suite after #642: 309 passed, 1 known warning;
- full release validation from PR #643 head: 3,475 passed, 4 skipped, 1 known warning;
- a final Python 3.11 build from the merge commit passed `twine check` for both artifacts, and a clean no-deps wheel import smoke passed (`import lingtai, lingtai_kernel`);
- artifact hashes — wheel `c0b5f526…8588d`, sdist `22c7486c…2330`.

TUI/Portal v0.10.3 gates:

- `git diff --check` (clean);
- `go test ./internal/tui ./internal/preset` and `go test ./...` from `tui/` passed;
- `npm --prefix portal/web ci` and `npm --prefix portal/web run build` passed (audit reported 4 pre-existing advisories — 1 low, 2 moderate, 1 high — and the build passed); portal module tests passed via `(cd portal && go test ./...)`;
- Homebrew tap automation updated the formula to v0.10.3 (formula SHA256 `ee1043cc…fb7a71`; `brew info` showed stable 0.10.3), and the local operator binaries were verified to print `lingtai-tui v0.10.3`.

## Links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.0>
- TUI/Portal release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.3>
- Runtime package source (PyPI): <https://pypi.org/project/lingtai/0.16.0/>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>
- Kernel compare: <https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.15.3...v0.16.0>
- TUI compare: <https://github.com/Lingtai-AI/lingtai/compare/v0.10.2...v0.10.3>
- Previous release log: <https://lingtai.ai/en/releases/20260628-1/>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Direction

With cache misses under a visible budget and soul flow behind an explicit flag, both a long-running agent and its operator start from a clearer picture of what the run is spending and what it is doing. The next steps keep paying down the same debt — turning hidden costs and silent defaults into things you can see, budget, and choose.
