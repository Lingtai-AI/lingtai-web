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

## Release-window accounting

Following the same structure as the 20260703-1 release log, this entry accounts for every issue and PR closed in the release window, not only the items that shipped as merged code. The window runs from the previous TUI/kernel releases (v0.10.4 / v0.16.1) through this paired release.

**Contributors/authors represented in the window:** @huangzesen, @TZZheng, @ZigongXu, @BrianLiubr, @888yzbt888, and @9s5bz2jvd2-lang.

**Commit author audit:** TUI/Portal v0.10.4..v0.10.5 contains 45 commits: 39 by @huangzesen, 2 by @TZZheng, and 4 daily star-count updates by @github-actions[bot]. Kernel v0.16.1..v0.16.2 contains 51 commits: 29 by @9s5bz2jvd2-lang, 20 by @huangzesen, and 2 by @TZZheng. The contributor list names human authors; the bot is documented only in the audit counts.

### TUI/Portal closed PRs (20 total: 19 merged, 1 closed unmerged)

- [lingtai#539](https://github.com/Lingtai-AI/lingtai/pull/539) (merged) — docs: route issue reporting consent through issue-report skill — @huangzesen
- [lingtai#538](https://github.com/Lingtai-AI/lingtai/pull/538) (merged) — Remove Time Machine — @huangzesen
- [lingtai#541](https://github.com/Lingtai-AI/lingtai/pull/541) (merged) — docs: add YAML prompt section definitions — @huangzesen
- [lingtai#540](https://github.com/Lingtai-AI/lingtai/pull/540) (merged) — Make home telemetry asynchronous — @huangzesen
- [lingtai#543](https://github.com/Lingtai-AI/lingtai/pull/543) (merged) — Revert TUI prompt-section YAML definitions — @huangzesen
- [lingtai#542](https://github.com/Lingtai-AI/lingtai/pull/542) (merged) — Expand TUI network activity evidence — @TZZheng
- [lingtai#547](https://github.com/Lingtai-AI/lingtai/pull/547) (merged) — fix(tui): refresh knowledge view entries — @huangzesen
- [lingtai#545](https://github.com/Lingtai-AI/lingtai/pull/545) (merged) — docs: mention issue report skill in tutorial skills catalog — @huangzesen
- [lingtai#544](https://github.com/Lingtai-AI/lingtai/pull/544) (merged) — feat(setup): add Codex pool credentials UI — @huangzesen
- [lingtai#550](https://github.com/Lingtai-AI/lingtai/pull/550) (merged) — fix(setup): label Codex OAuth accounts — @huangzesen
- [lingtai#556](https://github.com/Lingtai-AI/lingtai/pull/556) (merged) — fix(update): skip TUI updater when already latest — @huangzesen
- [lingtai#557](https://github.com/Lingtai-AI/lingtai/pull/557) (merged) — fix(preset): preserve load error causes — @huangzesen
- [lingtai#558](https://github.com/Lingtai-AI/lingtai/pull/558) (merged) — test(tui): cover ctrl+o viewport anchoring — @huangzesen
- [lingtai#559](https://github.com/Lingtai-AI/lingtai/pull/559) (merged) — fix(firstrun): surface API key save errors — @huangzesen
- [lingtai#555](https://github.com/Lingtai-AI/lingtai/pull/555) (merged) — Add Ctrl+End chat tail jump — @TZZheng
- [lingtai#554](https://github.com/Lingtai-AI/lingtai/pull/554) (closed unmerged) — fix: skip brew update when TUI is already at latest version — @BrianLiubr
- [lingtai#560](https://github.com/Lingtai-AI/lingtai/pull/560) (merged) — fix(tui): surface recipe reapply errors before launch — @huangzesen
- [lingtai#575](https://github.com/Lingtai-AI/lingtai/pull/575) (merged) — fix(tui): show api call group separators — @huangzesen
- [lingtai#584](https://github.com/Lingtai-AI/lingtai/pull/584) (merged) — fix: make codex account fallback filenames clearer — @huangzesen
- [lingtai#585](https://github.com/Lingtai-AI/lingtai/pull/585) (merged) — fix: harden migrations, clean, and config writes — @huangzesen

### TUI/Portal closed issues (31 total)

- [lingtai#472](https://github.com/Lingtai-AI/lingtai/issues/472) — Issue-report protocol should support scoped standing authorizations — @ZigongXu
- [lingtai#546](https://github.com/Lingtai-AI/lingtai/issues/546) — /knowledge 命令在 agent 运行时写入 knowledge 后不显示新条目 — @huangzesen
- [lingtai#548](https://github.com/Lingtai-AI/lingtai/issues/548) — feat: system(start, address=xxx) API for parent agents to launch child agents — @888yzbt888
- [lingtai#552](https://github.com/Lingtai-AI/lingtai/issues/552) — bug: `/update-tui` runs `brew update` even when TUI is already at the latest version — @BrianLiubr
- [lingtai#483](https://github.com/Lingtai-AI/lingtai/issues/483) — Preset Load() collapses parse/permission errors into "not found" — @ZigongXu
- [lingtai#495](https://github.com/Lingtai-AI/lingtai/issues/495) — Add TestCtrlOAnchorToBottom regression test for ctrl+o anchor fix (PR #469 follow-up) — @BrianLiubr
- [lingtai#509](https://github.com/Lingtai-AI/lingtai/issues/509) — API key save error silently ignored in first-run wizard — @ZigongXu
- [lingtai#490](https://github.com/Lingtai-AI/lingtai/issues/490) — TUI: recipe re-apply errors are swallowed before agent launch — @ZigongXu
- [lingtai#494](https://github.com/Lingtai-AI/lingtai/issues/494) — TUI: agent init.json venv_path can redirect launcher to arbitrary interpreter — @ZigongXu
- [lingtai#511](https://github.com/Lingtai-AI/lingtai/issues/511) — API key materialized in temp file persists on crash (ctrl+e editor) — @ZigongXu
- [lingtai#513](https://github.com/Lingtai-AI/lingtai/issues/513) — Source installer uses curl|bash without checksum verification — @ZigongXu
- [lingtai#505](https://github.com/Lingtai-AI/lingtai/issues/505) — Batch LOW findings: migration system reliability improvements (3 items) — @ZigongXu
- [lingtai#518](https://github.com/Lingtai-AI/lingtai/issues/518) — Batch: Non-atomic writes and silently ignored errors across preset/ and fs/ packages — @ZigongXu
- [lingtai#485](https://github.com/Lingtai-AI/lingtai/issues/485) — Security: Portal binds 0.0.0.0 with CORS * and no authentication — exposes network topology and geolocation — @ZigongXu
- [lingtai#503](https://github.com/Lingtai-AI/lingtai/issues/503) — Migration system: no concurrency control — TUI and Portal can race on same project's migrations — @ZigongXu
- [lingtai#512](https://github.com/Lingtai-AI/lingtai/issues/512) — Batch LOW: 6 reliability issues in firstrun.go Update() function — @ZigongXu
- [lingtai#537](https://github.com/Lingtai-AI/lingtai/issues/537) — Portal: Batch reliability issues — topology race, TOCTOU, unbounded reads, ipinfo.io trust — @ZigongXu
- [lingtai#517](https://github.com/Lingtai-AI/lingtai/issues/517) — ResolveAddress has no path confinement — absolute paths and ../ escape baseDir — @ZigongXu
- [lingtai#484](https://github.com/Lingtai-AI/lingtai/issues/484) — Security: Postman UDP receiver — unauthenticated remote file write via msgID path traversal — @ZigongXu
- [lingtai#486](https://github.com/Lingtai-AI/lingtai/issues/486) — Security: recipe library_name path traversal can escape project root and poison skills.paths — @ZigongXu
- [lingtai#492](https://github.com/Lingtai-AI/lingtai/issues/492) — TUI: preset.Load accepts path traversal in preset name — @ZigongXu
- [lingtai#515](https://github.com/Lingtai-AI/lingtai/issues/515) — Path traversal via preset.Name in Save/Delete — unsanitized path component — @ZigongXu
- [lingtai#506](https://github.com/Lingtai-AI/lingtai/issues/506) — Security: First-run wizard agent directory name not validated — path traversal via dirInput — @ZigongXu
- [lingtai#532](https://github.com/Lingtai-AI/lingtai/issues/532) — Portal: ResolveAddress path traversal — absolute paths and ../ escape baseDir — @ZigongXu
- [lingtai#533](https://github.com/Lingtai-AI/lingtai/issues/533) — Portal: All file readers follow symlinks — TOCTOU and information disclosure — @ZigongXu
- [lingtai#534](https://github.com/Lingtai-AI/lingtai/issues/534) — Portal: Raw init.json fallback exposes API keys and secrets via API — @ZigongXu
- [lingtai#516](https://github.com/Lingtai-AI/lingtai/issues/516) — copyTree follows symlinks despite documentation claiming it skips them — @ZigongXu
- [lingtai#535](https://github.com/Lingtai-AI/lingtai/issues/535) — Portal: Error responses leak internal filesystem paths — @ZigongXu
- [lingtai#488](https://github.com/Lingtai-AI/lingtai/issues/488) — TUI: clean can delete .lingtai/ while agents are still alive — @ZigongXu
- [lingtai#502](https://github.com/Lingtai-AI/lingtai/issues/502) — Migration system: per-file errors silently swallowed in m028/m030/m035/m039 — partial failures silently bump version — @ZigongXu
- [lingtai#508](https://github.com/Lingtai-AI/lingtai/issues/508) — Non-atomic writes for config.json and .env — crash can corrupt API keys — @ZigongXu

### Kernel closed PRs (26 total: 20 merged, 6 closed unmerged)

- [lingtai-kernel#694](https://github.com/Lingtai-AI/lingtai-kernel/pull/694) (closed unmerged) — fix: confine pad/email paths to working directory (#624) — @ZigongXu
- [lingtai-kernel#695](https://github.com/Lingtai-AI/lingtai-kernel/pull/695) (closed unmerged) — daemon: preflight required inputs before scheduling — @9s5bz2jvd2-lang
- [lingtai-kernel#696](https://github.com/Lingtai-AI/lingtai-kernel/pull/696) (merged) — docs(prompts): add prompt section contracts — @huangzesen
- [lingtai-kernel#697](https://github.com/Lingtai-AI/lingtai-kernel/pull/697) (merged) — feat(codex): add codex-pool provider — @huangzesen
- [lingtai-kernel#698](https://github.com/Lingtai-AI/lingtai-kernel/pull/698) (merged) — fix(daemon): allow codex-pool presets — @huangzesen
- [lingtai-kernel#700](https://github.com/Lingtai-AI/lingtai-kernel/pull/700) (merged) — feat: add Telegram notification persistent context — @huangzesen
- [lingtai-kernel#704](https://github.com/Lingtai-AI/lingtai-kernel/pull/704) (merged) — feat: annotate Telegram persistent context — @huangzesen
- [lingtai-kernel#705](https://github.com/Lingtai-AI/lingtai-kernel/pull/705) (merged) — fix: trim telegram transient notification hook — @huangzesen
- [lingtai-kernel#706](https://github.com/Lingtai-AI/lingtai-kernel/pull/706) (merged) — docs: add LICC notification contract — @huangzesen
- [lingtai-kernel#701](https://github.com/Lingtai-AI/lingtai-kernel/pull/701) (closed unmerged) — fix(daemon): expose Codex auth lane in quota diagnostics — @9s5bz2jvd2-lang
- [lingtai-kernel#707](https://github.com/Lingtai-AI/lingtai-kernel/pull/707) (merged) — Move email notification context to persistent lane — @huangzesen
- [lingtai-kernel#721](https://github.com/Lingtai-AI/lingtai-kernel/pull/721) (merged) — fix(notifications): move curated IM context to persistent lane — @huangzesen
- [lingtai-kernel#789](https://github.com/Lingtai-AI/lingtai-kernel/pull/789) (merged) — docs(skills): document external skill intake — @huangzesen
- [lingtai-kernel#719](https://github.com/Lingtai-AI/lingtai-kernel/pull/719) (closed unmerged) — docs(notifications): document persistent Telegram/email hooks — @huangzesen
- [lingtai-kernel#720](https://github.com/Lingtai-AI/lingtai-kernel/pull/720) (closed unmerged) — fix(notifications): move WhatsApp context to persistent lane — @huangzesen
- [lingtai-kernel#722](https://github.com/Lingtai-AI/lingtai-kernel/pull/722) (closed unmerged) — fix(notifications): move Feishu context to persistent lane — @huangzesen
- [lingtai-kernel#790](https://github.com/Lingtai-AI/lingtai-kernel/pull/790) (merged) — fix(daemon): propagate parent MCPs to CLI backends — @huangzesen
- [lingtai-kernel#791](https://github.com/Lingtai-AI/lingtai-kernel/pull/791) (merged) — docs(daemon): add architecture capability contract — @huangzesen
- [lingtai-kernel#792](https://github.com/Lingtai-AI/lingtai-kernel/pull/792) (merged) — fix(daemon): mount Kimi MCP config natively — @huangzesen
- [lingtai-kernel#793](https://github.com/Lingtai-AI/lingtai-kernel/pull/793) (merged) — Report high-footprint retention categories — @TZZheng
- [lingtai-kernel#795](https://github.com/Lingtai-AI/lingtai-kernel/pull/795) (merged) — docs(prompt): prefer a priori tool summaries — @huangzesen
- [lingtai-kernel#799](https://github.com/Lingtai-AI/lingtai-kernel/pull/799) (merged) — feat(summary): report a-priori compression effect — @huangzesen
- [lingtai-kernel#797](https://github.com/Lingtai-AI/lingtai-kernel/pull/797) (merged) — feat(tools): split info and manual signpost actions — @huangzesen
- [lingtai-kernel#796](https://github.com/Lingtai-AI/lingtai-kernel/pull/796) (merged) — feat(tools): allow summaries for daemon and glob — @huangzesen
- [lingtai-kernel#800](https://github.com/Lingtai-AI/lingtai-kernel/pull/800) (merged) — fix: share timely transient meta serialization — @huangzesen
- [lingtai-kernel#801](https://github.com/Lingtai-AI/lingtai-kernel/pull/801) (merged) — docs(prompts): add adapt-from-evidence principle — @huangzesen

### Kernel closed issues (15 total)

- [lingtai-kernel#625](https://github.com/Lingtai-AI/lingtai-kernel/issues/625) — Security: Agent can self-escalate to karma/nirvana by editing own init.json — @ZigongXu
- [lingtai-kernel#590](https://github.com/Lingtai-AI/lingtai-kernel/issues/590) — docs(i18n): molt recovery note says 'Check email' while sibling strings use generic 'inbox' — @ZigongXu
- [lingtai-kernel#596](https://github.com/Lingtai-AI/lingtai-kernel/issues/596) — docs(i18n): system.stuck_revive message says 'You called: {tool_calls}' but fills it with error description — @ZigongXu
- [lingtai-kernel#598](https://github.com/Lingtai-AI/lingtai-kernel/issues/598) — enhancement(skills): skills info returns full manual body + health snapshot while knowledge info returns health only — @ZigongXu
- [lingtai-kernel#676](https://github.com/Lingtai-AI/lingtai-kernel/issues/676) — MailService has no resource limits: no cap on message size, attachment count, or attachment size — @ZigongXu
- [lingtai-kernel#677](https://github.com/Lingtai-AI/lingtai-kernel/issues/677) — Batch LOW findings: MailService reliability improvements (7 items) — @ZigongXu
- [lingtai-kernel#614](https://github.com/Lingtai-AI/lingtai-kernel/issues/614) — lingtai-telegram: getUpdates offset advanced before handler — message loss on exception — @ZigongXu
- [lingtai-kernel#615](https://github.com/Lingtai-AI/lingtai-kernel/issues/615) — lingtai-feishu: no WebSocket reconnection logic — single network blip permanently disables inbound — @ZigongXu
- [lingtai-kernel#617](https://github.com/Lingtai-AI/lingtai-kernel/issues/617) — lingtai-imap: watermark stalls permanently on SEARCH→FETCH race (livelock) — @ZigongXu
- [lingtai-kernel#668](https://github.com/Lingtai-AI/lingtai-kernel/issues/668) — Batch: LOW-severity code quality findings from lifecycle.py, meta_block.py, and __init__.py audits — @ZigongXu
- [lingtai-kernel#673](https://github.com/Lingtai-AI/lingtai-kernel/issues/673) — rebuild_sqlite_event_index deletes -wal/-shm and replaces DB without coordinating with concurrent doctor()/query() — @ZigongXu
- [lingtai-kernel#594](https://github.com/Lingtai-AI/lingtai-kernel/issues/594) — Daemon deliverables have no designated output area — files pollute agent working directory root — @ZigongXu
- [lingtai-kernel#595](https://github.com/Lingtai-AI/lingtai-kernel/issues/595) — No rate-limit coordination between parent and concurrent daemons sharing same API key — @ZigongXu
- [lingtai-kernel#622](https://github.com/Lingtai-AI/lingtai-kernel/issues/622) — Unbounded growth: events.jsonl, chat_history_archive.jsonl, and worker_hang artifacts lack rotation/resolution — @ZigongXu
- [lingtai-kernel#623](https://github.com/Lingtai-AI/lingtai-kernel/issues/623) — No per-tool execution timeout: hung MCP/built-in tool blocks agent indefinitely — @ZigongXu

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
