---
title: "Release notes: LingTai TUI/Portal v0.10.2 and kernel v0.15.3"
date: 2026-06-28
tags: [tech, devlog]
lang: en
description: "A small paired patch that makes two runtime contracts honest. Generated, template, and example init.json no longer seed legacy prompt or empty lingtai fields — character state is owned by system/lingtai.md / psyche after creation. The kernel makes context-pressure signals truthful: a delayed-summarization reconstruction reports one-shot evidence while sustained high-context pressure is a separate molt warning. Plus system-prompt Markdown catalogs, a WeChat MCP fix, grep/IMAP ergonomics, and release hygiene."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI/Portal <strong>v0.10.2</strong> and LingTai kernel <strong>v0.15.3</strong> are small paired patch releases that make two runtime contracts honest. Generated, template, and example <code>init.json</code> stop seeding legacy <code>prompt</code> and empty <code>lingtai</code> fields — long-lived character state is owned by <code>system/lingtai.md</code> / psyche after creation, and the kernel treats a missing seed as a valid empty seed. The kernel also makes context-pressure signals truthful: a delayed-summarization reconstruction reports one-shot evidence while sustained high-context pressure is surfaced separately as a molt warning. Both versions were validated from clean release worktrees before publication.
</div>

This is a patch window, not a new feature window. Its theme is honesty: two places where the runtime told a small, quiet lie now tell the truth. A generated `init.json` stops seeding character fields the runtime no longer honors, and the context-pressure signals stop conflating a one-time reconstruction with standing pressure.

## What changed

### TUI / Portal v0.10.2

- Generated `init.json` no longer seeds the character field: the TUI stops writing legacy `prompt` / `lingtai` seed fields and ships a regression test that generated init JSON omits `prompt`, `prompt_file`, `lingtai`, and `lingtai_file` (#458). Character state is managed through `system/lingtai.md` / psyche after creation.
- Ledger fidelity: refresh rebuilds and context rebuilds are now marked in the call ledger, so the recent-call view distinguishes a rebuild from an ordinary API call (#457, #455).
- Cockpit ergonomics: larger mail page-size defaults are restored and mail renderers are reused across mail views (#454, #453), and `ctrl-y` select mode is now available globally with a prominent indicator (#452).

### Kernel v0.15.3

- The init prompt/character contract is formalized: `prompt` is not a legacy alias, a missing `lingtai` / `lingtai_file` is valid and means an empty initial seed, and deprecated brief fields are ignored (#550, #551, #552, #557). Long-lived character state is managed through `system/lingtai.md` / psyche.
- Reconstruction-aware context/molt metadata: a delayed summarization reconstruction now reports one-shot evidence, while sustained high-context pressure is surfaced separately as a molt warning (#556). Resident meta-guidance ordering and prompt-layer docs are tightened with more precise delayed-summarize guidance (#542, #558).
- System-prompt resources are refactored into Markdown catalogs with clearer related-file behavior, and the principle layer is kernel-managed rather than runtime-injected (#555, #547, #549).
- Integration and utility fixes: WeChat MCP config-path resolution and inbound-media validation by magic bytes (#554, #543), grep glob-filter pruning before file reads (#544), clearer IMAP empty-argument ergonomics and flag diagnostics (#548), and kernel runtime-identity stamps on event logs (#540).

## Why this matters

An `init.json` that seeds fields the runtime ignores is a quiet lie about where character state lives. Aligning the generator, templates, examples, and schema means a freshly created agent starts from one honest source of truth instead of stale, never-honored prompt text — and the kernel now accepts a missing seed as a valid empty seed rather than something to repair.

On the context side, a single reconstruction event and ongoing context pressure are different facts that ask for different responses. Reporting the reconstruction once and surfacing sustained pressure on its own keeps an agent from over-reading a one-time rebuild as a standing emergency.

## Validation

Both versions were validated from clean release worktrees off `origin/main`.

Strict ranges for this window:

- TUI `v0.10.1..v0.10.2`: 12 commits, 38 files changed, +1612/-177.
- Kernel `v0.15.2..v0.15.3`: 38 commits, 99 files changed, +6331/-829.

Kernel v0.15.3 gates:

- `git diff --check` against v0.15.2 (clean);
- `python -m compileall` over `src` and `tests` (clean);
- full `pytest` passed;
- `python -m build` produced the sdist and wheel, and `twine check` PASSED on both;
- release hygiene: the init-schema tests were aligned with the optional `lingtai` seed contract introduced after v0.15.2, and the package version was bumped to `0.15.3`.

TUI/Portal v0.10.2 gates:

- `git diff --check` against v0.10.1 (clean);
- `tui` and `portal` `go test ./...` passed;
- `portal/web npm ci && npm run build` passed;
- `make build` produced `lingtai-tui v0.10.2` and `lingtai-portal v0.10.2`;
- release hygiene: `docs/stars/stars.csv` whitespace was normalized, and the Homebrew install-detection tests were isolated from real developer-machine symlinks.

## Release links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.3>
- Runtime package source: <https://pypi.org/project/lingtai/0.15.3/>
- TUI/Portal release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.2>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Direction

With the init contract honest end to end and reconstruction signals separated from sustained pressure, a freshly created agent and a long-running one both start from a clearer picture of their own state. The next steps keep paying down the same debt — fewer quiet lies between what the runtime reports and what is actually true.
