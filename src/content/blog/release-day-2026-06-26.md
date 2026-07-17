---
title: "Release notes: LingTai TUI/Portal v0.10.0 and kernel v0.15.0"
date: 2026-06-26
tags: [tech, devlog]
lang: en
description: "A telemetry-first release: the home view and per-round API-call footer now show where a session's tokens go, with a focused copy-and-layout pass behind it. The kernel makes bash results report inner failures, routes refresh-watcher events through the secret redactor, indexes the token ledger in SQLite with an explicit scope, writes a per-run daemon artifact manifest, nudges on source drift, and tunes Codex summarize guidance."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI/Portal <strong>v0.10.0</strong> and LingTai kernel <strong>v0.15.0</strong>. The headline is telemetry that lives where operators already look: per-round token usage in the API-call footer, and a current-session token line plus a compact context-percentage bar in the home view — followed by a focused copy-and-layout pass that kept the footer, fixed the row, and made the status hints bilingual and correct. The kernel makes a completed <code>bash</code> command say whether its inner command actually succeeded, routes the refresh-watcher's event log through the secret redactor, indexes the token ledger in SQLite with an explicit reporting scope, writes a per-run daemon <code>artifacts.json</code>, nudges agents when on-disk source drifts from the running runtime, and reframes Codex summarize guidance as an investment ratio with tuned thresholds. Both versions were validated from clean release worktrees; the tags, GitHub Releases, PyPI upload, and Homebrew bump are cut as part of the publish step.
</div>

This release is about one thing: making the cockpit honest about where a session spends its tokens.

The previous window made the runtime plural — many Codex identities, one fleet — and turned the raw call log into trend reports. This one brings that legibility into the default view, so an operator notices a session quietly burning budget without first opening a report.

## What changed

### TUI / Portal v0.10.0

- Token telemetry where the calls are: API-call group footers show current-round usage — input, cache miss, output, cache rate — and the home view bottom row shows current-session token telemetry plus a compact context-percentage bar (#441).
- Less noisy replay: Ctrl+O hides the bulky `_meta` envelope by default and points to `/notification` when full metadata is wanted (#440).
- Telemetry copy and layout, made legible (#442–#447): the footer is preserved while session telemetry shows (#442); session telemetry no longer needs Ctrl+O (#443); the home telemetry context row layout is fixed (#444); the home status hint and zh telemetry copy are cleaned up (#445); the status hint is corrected to say "expand" (#446) and then localized (#447, the candidate head).
- Richer session observability: session/kanban detail panels show more cached per-session stats — API call stats, expanded token breakdowns, agent paths — keyed to molt windows so refreshes stop drifting (#428, #430, #432, #433, #438, #439).
- Faster session loading: session events load from the SQLite index instead of re-scanning event files (#435).
- Markdown front matter: the markdown viewer renders YAML front matter (`name` / `description` / `version`) instead of silently stripping it (#426).
- A `list` command surfaces companions, the beginner work manual was rewritten, and a dev-guide check confirms a rebuilt TUI binary actually lands on `PATH` (#421, #423, #425, #427).

### Kernel v0.15.0

- Bash result fidelity: completed commands carry additive, model-visible `ok` / `command_status` / `warning` fields, so a nonzero inner exit or a Python traceback no longer hides under `status: ok`; `status` keeps its old meaning for compatibility (#493).
- Secret-redaction hardening: the relaunch/refresh watcher subprocess routes `events.jsonl` writes through the kernel redactor (key-aware, fail-open with a diagnosable `redaction_unavailable` marker), closing a separate-process leak path (#491, #492 series).
- Token ledger in SQLite, with scope: `sum_token_ledger` gains an explicit `scope` — `main_agent` excludes daemon rows, `all` includes them — with parent/child double-count semantics documented and tested (#503, #492).
- Daemon artifact manifest: each run writes a metadata-only `artifacts.json`, so `daemon(action="check")` surfaces path, size, mtime, and role without scanning the run directory, with safe fallback for older runs (#499).
- Source-drift nudge: startup runtime fingerprints (git HEAD + source digest) land in `.status.json`; agents emit `source_drift` nudges when on-disk source diverges, and `lingtai-doctor` reports them — skipped in dev runtimes (closes #178).
- Codex summarize guidance: `adapter_comment` now reports full/incremental counts, a `full_to_incremental_ratio`, a `1:10` target, and dynamic `summarize_economy` hints (#518); the guidance thresholds were then tuned (#519) — the newest functional change before the version bump.
- Codex transport and MCP/messaging: continuation is decoupled from transport, session identity is molt-aware, the endpoint pool rotates and can be overridden at molt boundaries, and the WebSocket cache ledger is surfaced (#486, #495, #498, #502, #504, #517); Telegram rich-formatting and empty `chat_action` / `parse_mode` handling are fixed and WeChat inbound replay is suppressed (#488, #496, #501, #508).

## Why this matters

You cannot trim what you cannot see. Putting per-round token cost and session context in the default view — and making that row read cleanly in both languages — is what turns "we log tokens somewhere" into "the operator notices the expensive session." On the kernel side, the same theme runs deeper: a `bash` result that admits its inner command failed, a token total that says whether it counts daemons, an event log that cannot persist a secret, and an agent that knows when it is running stale source are all the runtime refusing to quietly mislead a long, unattended session.

## Validation

Kernel v0.15.0 was validated from a clean release worktree at the bump commit `c365eec` (on base `0797e93`):

- `python -m compileall` over `src` and `tests` (clean);
- full `pytest`: **2935 passed, 4 skipped**;
- `python -m build` for the sdist and wheel, and `twine check` on both (PASSED);
- the only delta vs `origin/main` is the `pyproject.toml` version bump to `0.15.0`.

TUI/Portal v0.10.0 was validated at candidate head `37be28b` (= `origin/main`; the build version is injected via `make ... VERSION=v0.10.0`, with no source bump):

- `git diff --check` against v0.9.6, clean apart from the known generated `docs/stars/stars.csv` CRLF caveat;
- full TUI and Portal Go tests passed;
- `portal/web npm ci && npm run build` passed (dev-only npm audit advisories noted, not blocking);
- `make build` produced `lingtai-tui v0.10.0` and `lingtai-portal v0.10.0`.

Note on artifacts: the locally built kernel wheel is macOS-arm64 platform-tagged, so the portable **sdist** is the artifact for PyPI unless per-platform wheels are intentionally published.

## Release links

These are the intended tags for v0.10.0 / v0.15.0; the GitHub Releases, PyPI upload, and Homebrew tap bump are cut as part of the publish step.

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.0>
- Runtime package source: <https://pypi.org/project/lingtai/0.15.0/>
- TUI/Portal release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.0>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Contributors

@huangzesen (lead, scope and validation owner), @ktwu01 (TUI preset refactor), @9s5bz2jvd2-lang (TUI beginner work-manual rewrite), and @TZZheng (kernel runtime source-drift nudge and MCP inbox latency diagnostics).

Issue reporters whose reports drove shipped or completed work this window: @lin-du (kernel #301, implemented and shipped as PR #488 "Expose Telegram rich formatting options"; #300 closed completed) and @888yzbt888 (TUI #401 preset bugs, with Bug 1 fixed by in-window kernel PR #479; issue closed completed).

Thanks also to @BrianLiubr (TUI #429/#431) and @xczics (TUI #437) for in-window bug reports that are still under triage — credited here as reports, not yet as shipped fixes.

## Direction

The theme holds: make the runtime honest, measurable, and now legible by default. With per-session token cost in front of operators and a token ledger they can scope, the next step is to act on what the numbers show — trim the turns that miss cache, and let the cockpit point at the session that is spending the most.
