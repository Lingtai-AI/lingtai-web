---
title: "Release notes: LingTai TUI/Portal v0.10.1 and kernel v0.15.1"
date: 2026-06-27
tags: [tech, devlog]
lang: en
description: "A patch that finishes the self-update story: the source / user-local TUI can now update itself — manually and on startup — completing the work the previous release started for Homebrew. The kernel adds a claude-code LLM provider, an MCP manual sidecar contract with bundled manuals, shared filesystem/JSON helpers that de-risk state writes, and honest spill/refresh failure visibility."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI/Portal <strong>v0.10.1</strong> and LingTai kernel <strong>v0.15.1</strong> are patch releases that finish what v0.10.0 / v0.15.0 began. The headline: a TUI that updates itself even when it was not installed via Homebrew — a manual self-update command, a source-install update backend, and a startup prompt when the on-disk source drifts behind the published TUI (completing issue #404). The kernel adds a <code>claude-code</code> LLM provider, an MCP manual sidecar contract with bundled manuals for curated MCPs, shared <code>_fsutil</code> filesystem/JSON/JSONL helpers that de-risk kernel state writes, a session-recovery refactor, and honest spill/refresh failure visibility. Both versions were validated from clean release worktrees; the GitHub Releases, PyPI upload, and Homebrew bump are now published.
</div>

This is a patch window, not a new feature window. The previous release brought token telemetry into the cockpit's default view; this one closes two loops it left open — let the *source* TUI update itself the way the Homebrew TUI already could, and give the kernel safer state-write plumbing plus a new way to drive a Claude subscription as an LLM provider.

The headline is the self-update story finishing. v0.10.0 taught the Homebrew TUI to update itself; source and user-local installs were still stranded on whatever binary they last built. This release brings the same update-in-place — manual and on startup — to those installs, so the TUI can keep itself current however it was put on disk. Behind it, the kernel routes more of its state writes through shared, tested helpers and stops letting spill and refresh failures pass silently.

## What changed

### TUI / Portal v0.10.1

- The source / user-local TUI can now update itself, finishing issue #404 for installs that are *not* Homebrew-managed: a manual self-update command (#416), a source-install self-update backend (#417), and a startup prompt that offers the update when on-disk source drifts behind the published TUI (#418). v0.10.0 shipped the Homebrew updater backend; v0.10.1 brings the same story to source installs.
- Cockpit polish: a live agent-activity indicator on the mail view footer (#422), mail view copy mode (#402), and the live `/viz` ghost-avatar visibility fix (#354).
- A doctor pass: a saved redacted report bundle with a privacy notice and export hint, install-method detection, and a diagnostic-section layout clarification (#406, #407, #409, #449, #450).
- Reliability: wait for headless agent readiness before proceeding (#365), plus dev-guide release-workflow docs and README install-method output (#448).

### Kernel v0.15.1

- A new `claude-code` LLM provider: drive a Claude subscription through the `claude` CLI as an LLM provider (#525, originally proposed in closed PR #299).
- An MCP manual sidecar contract with bundled manuals: the documented sidecar anatomy and minimal contract (#529, #530), bundled manuals for curated MCPs (#528), and a Telegram media guidance manual (#526).
- Safer kernel state writes: shared `_fsutil` filesystem / JSON / JSONL helpers (#510, #522), and a session-recovery / ToolExecutor helper consolidation in `turn.py` that renames `_post_send_housekeeping` to `_turn_boundary_housekeeping` (#511, #523).
- Honest spill and refresh visibility: expired-spill artifact messaging (#192, #291), refresh-permanent-failure visibility (#292), and a headless runtime liveness proof (#351).
- Clearer Codex pre-molt summarize guidance (#531).

## Why this matters

A self-update path that only works for Homebrew installs leaves source and user-local users stranded on stale binaries; finishing #404 means the TUI can keep itself current however it was installed, and tell the operator when it is behind. On the kernel side the theme is the same one v0.15.0 set — make the runtime honest and safe under long autonomy. Shared filesystem helpers reduce the number of hand-rolled, slightly-different state writes that a fleet can corrupt; spill and refresh failures that used to pass silently now surface; and the `claude-code` provider widens how an operator can back the runtime without changing the cockpit they already use.

## Validation

Both versions were validated from clean release worktrees off `origin/main`.

Kernel v0.15.1 was validated at the version-bump commit `2d23801` (on base `834ce8b`):

- `python -m compileall` over `src` and `tests` (clean);
- full `pytest`: **3034 passing, 4 skipped, 0 genuine failures** — three subprocess-import "failures" were proven to be local-environment artifacts (the spawned child does not inherit `PYTHONPATH=src` and the package is not pip-installed in the validation interpreter) and pass green on re-check with `PYTHONPATH=src`;
- `python -m build` produced the sdist and wheel, and `twine check` PASSED on both;
- the only delta vs `origin/main` is the single `pyproject.toml` version bump from `0.15.0` to `0.15.1`.

TUI/Portal v0.10.1 was validated at candidate head `418e470` (the build version is injected via `make ... VERSION=v0.10.1`, with no source bump):

- `git diff --check` against v0.10.0 was clean;
- Portal web `npm ci && npm run build` passed, Portal `go test ./...` passed, and `make build` produced the TUI and Portal binaries;
- caveat, non-blocking: two `internal/config` install-detection tests failed only on the maintainer's machine because local dev symlinks under `/usr/local/bin` and `/opt/homebrew/bin` resolve out of the Homebrew prefix; the gate classified this as host / test-isolation sensitivity, not a v0.10.1 runtime regression, and verified the underlying classifier returns `homebrew` correctly on a clean path;
- release hygiene note: the `portal/web` toolchain reports dev / build-time `npm audit` advisories (`vite`, `launch-editor`, `js-yaml`); the shipped portal assets are static, so these are not in the runtime.

Note on artifacts: the locally built kernel wheel is macOS-arm64 platform-tagged, so the portable **sdist** is the artifact on PyPI.

## Release links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.1>
- Runtime package source: <https://pypi.org/project/lingtai/0.15.1/>
- TUI/Portal release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.1>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Contributors

@huangzesen (lead, scope and validation owner), @TZZheng (the source self-update epic and the kernel filesystem/recovery refactors), @wchwawa (the live mail-view agent activity indicator), @rawpaper123 (headless readiness and liveness reliability fixes), @LuuOW (review of the `/viz` ghost-avatar fix), and @zechenzhangAGI (who originated the `claude-code` provider).

## Direction

With self-update finished across install methods and the kernel's state writes routed through shared, tested helpers, the runtime is steadier under long unattended sessions. The next steps build on the telemetry the previous window surfaced — act on what the numbers show, and keep widening provider choice without disturbing the cockpit operators already know.
