---
title: "Release day: Kernel v0.16.2 and TUI/Portal v0.10.5"
date: 2026-07-07
tags: [tech, devlog]
lang: en
description: "A paired LingTai patch release for safer migrations, guarded cleanup, atomic config writes, and cleaner kernel summary/manual contracts."
---

> **TL;DR** — This release is about making long-lived LingTai projects harder to damage and easier to reason about. TUI/Portal v0.10.5 hardens migrations, `lingtai clean`, and global config writes. Kernel v0.16.2 improves summary/manual contracts, daemon/MCP propagation, and persistent messaging context. Homebrew is the normal end-user upgrade path; PyPI 0.16.2 is published as the runtime package source and verification point for project virtual environments.

## What changed

### TUI/Portal v0.10.5

The TUI side closes three reliability reports from the community-issue sweep:

- schema-critical migrations now fail loudly instead of advancing the stored migration version after a half-applied migration;
- `lingtai clean` now refuses to delete `.lingtai/` when live or surviving agents are discoverable, or when discovery itself fails, unless the operator uses `--force`;
- global `config.json`, `tui_config.json`, and `.env` writes now use atomic sibling-temp writes with fsync, rename, cleanup, and permission preservation.

The release also includes smaller operator-facing improvements: clearer Codex account labels, pool credential UI polish, first-run and recipe error surfacing, preserved preset load causes, updater already-current feedback, API-call grouping, refreshed knowledge entries, async home telemetry, network activity evidence, Ctrl+End tail-jump coverage, and removal of the Time Machine auto-launch path.

### Kernel v0.16.2

The kernel release continues the work needed for long-running agents that delegate, summarize, and communicate across many surfaces:

- daemon/glob results now participate in summary flows, with clearer a-priori compression metadata and docs;
- info/manual signpost actions are split so runtime health and bundled manuals do not blur together;
- prompt section contracts, adapt-from-evidence guidance, retention-footprint reports, and timely transient `_meta` filtering reduce stale or noisy context;
- Kimi native MCP config, parent MCP propagation into CLI backends, Codex pool provider/preset support, and external skill intake docs make delegated work easier to reproduce;
- persistent Telegram notification/reply context and the LICC notification contract reduce message-surface context loss.

## Why this matters

A release flow is exactly the kind of long task LingTai should survive: lots of validation, multiple repositories, delegated drafts, platform publishing, and public copy. The fixes in this patch release aim at that same shape of work. State changes should be atomic, cleanup should be guarded, and summaries should preserve the evidence without dragging every raw log into future context.

## Validation and release hygiene

Release validation ran from clean worktrees.

- TUI diff check passed with the documented `docs/stars/stars.csv` CRLF caveat left untouched.
- TUI targeted tests passed; the full TUI suite passed after rerunning the known flaky `TestPortalURLTimeoutKillsChild`.
- Portal web build and Go tests passed.
- TUI and Portal release builds completed successfully from the release candidate.
- Kernel diff check, compileall, and full pytest passed (`3798 passed, 4 skipped`).
- Kernel wheel/sdist build and `twine check` passed.
- PyPI upload succeeded: <https://pypi.org/project/lingtai/0.16.2/>.
- Homebrew formula v0.10.5 is published with SHA256 `7510d443f59d8d571d8f4ab6431c10103fbc5fead03903fb6851f543c15b94ed`; Ruby syntax check and strict formula audit passed.

## Links

- TUI/Portal v0.10.5: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.5>
- Kernel v0.16.2: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.2>
- PyPI: <https://pypi.org/project/lingtai/0.16.2/>
- Homebrew formula: <https://github.com/Lingtai-AI/homebrew-lingtai/blob/main/lingtai-tui.rb>
