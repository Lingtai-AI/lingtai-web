---
title: "Release day: TUI/Portal v0.10.7"
date: 2026-07-13
tags: [tech, devlog]
lang: en
description: "A TUI-first LingTai release: /projects becomes a live admin network switcher, email history loads faster and renders consistently, a runtime namespace-compat shim, and honest transparency about a manually recovered Intel-macOS build."
---

> **TUI-first release** — [TUI/Portal v0.10.7](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.7) is published from the independently locked TUI/Portal candidate at commit `5fb554b69f966b39cb9eca32a70c84d628714d18` (tree `05c068dbc5e50832d2d5d425099c104290acd2f4`). This is a TUI/Portal-only release — it ships the Go TUI and portal binaries, which talk to agents purely over the filesystem. The coordinated kernel release is developed on its own cadence and is not part of this tag.

> **TL;DR** — The headline change turns `/projects` into a live admin network switcher backed by the running process inventory (#620). Email history is bounded and paged so the newest 200 entries load in about 50 ms with JSONL as the authoritative replay source (#632), and a mail-rendering polish pass makes the mailbox render once from cache, show full local timestamps, and align the Ctrl+O overlay with the default view (#631, #637, #638, #640). A runtime shim lets projects on either the legacy `lingtai_kernel` or the new `lingtai.kernel` import layout keep working (#617), a daemon CLI cache-hit display bug is fixed (#636), and documentation is refreshed. The strict `v0.10.6..v0.10.7` window is 16 merged PRs. All four platform archives are published — including an Intel-macOS build we had to recover by hand, described honestly below.

## What changed

### `/projects` becomes an admin network switcher

TUI [#620](https://github.com/Lingtai-AI/lingtai/pull/620) transforms `/projects` into an admin network switcher backed by the live process inventory. Operators can select any admin/orchestrator agent to switch context, while non-admin members remain visible for topology awareness. The detail pane includes a curated `/kanban` subset: lifecycle, process uptime, molt count, and live topology. Agent grouping in `/projects` is clarified in the same window ([#639](https://github.com/Lingtai-AI/lingtai/pull/639)).

### Faster, safer mail history and rendering

Email is the primary asynchronous communication surface for long-running agents, so this release spends a focused polish pass on it:

- [#632](https://github.com/Lingtai-AI/lingtai/pull/632) bounds and pages email history on demand; the newest 200 entries load in about 50 ms, with JSONL as the authoritative replay source (fixing SQLite interior-hole inconsistencies).
- [#631](https://github.com/Lingtai-AI/lingtai/pull/631) gates asynchronous mail-history results to their owning model, preventing stale or cross-view mutations when a result arrives after the view has changed.
- [#637](https://github.com/Lingtai-AI/lingtai/pull/637), [#638](https://github.com/Lingtai-AI/lingtai/pull/638), and [#640](https://github.com/Lingtai-AI/lingtai/pull/640) render mail once from the live cache, show complete local timestamps in every layer, and align Ctrl+O mailbox rendering with the default view.

### Runtime, diagnostics, and documentation polish

- [#636](https://github.com/Lingtai-AI/lingtai/pull/636) fixes an impossible daemon CLI cache-hit display by normalizing cached-input accounting, so `TokenTotals.Input` correctly includes cached input.
- [#617](https://github.com/Lingtai-AI/lingtai/pull/617) updates the TUI/Portal runtime path to recognize both the legacy `lingtai_kernel` layout and the new `lingtai.kernel` runtime namespace, so projects on either layout continue to work.
- [#630](https://github.com/Lingtai-AI/lingtai/pull/630) simplifies architecture-document checks; [#618](https://github.com/Lingtai-AI/lingtai/pull/618) clarifies `/btw` inquiry semantics.
- Documentation is refreshed around the "lifelong Digital Scientist" narrative and distributed architecture ([#629](https://github.com/Lingtai-AI/lingtai/pull/629), [#628](https://github.com/Lingtai-AI/lingtai/pull/628)), a "learn from every setback" rule lands in the Covenant ([#633](https://github.com/Lingtai-AI/lingtai/pull/633)), the README is simplified with the beginner guide moved to the website ([#616](https://github.com/Lingtai-AI/lingtai/pull/616)), and the Discord invitation is updated across all README variants ([#642](https://github.com/Lingtai-AI/lingtai/pull/642)).

## Why this matters

An operator running several agent networks needs to switch context quickly and see what each one is doing; the `/projects` switcher makes that a single keystroke, with a live kanban subset for at-a-glance health. The mail work removes the papercuts that accumulate over a long session — a mailbox that loads fast, renders once, shows honest timestamps, and does not mutate under a stale async result. The namespace-compat shim (#617) is deliberately small: it lets existing projects upgrade the TUI without being forced onto a new import layout in lockstep.

## Complete merged-PR ledger

The strict `v0.10.6..v0.10.7` release window contains 16 merged PRs:

1. [#642 — docs(readme): update Discord invite](https://github.com/Lingtai-AI/lingtai/pull/642)
2. [#640 — fix(tui): align Ctrl+O mailbox rendering](https://github.com/Lingtai-AI/lingtai/pull/640)
3. [#639 — fix(tui): clarify and group agents in /projects](https://github.com/Lingtai-AI/lingtai/pull/639)
4. [#638 — fix(tui): show full timestamps for mailbox mail](https://github.com/Lingtai-AI/lingtai/pull/638)
5. [#637 — fix(tui): render mail once from mailbox cache](https://github.com/Lingtai-AI/lingtai/pull/637)
6. [#636 — fix(tui): normalize daemon CLI cached input](https://github.com/Lingtai-AI/lingtai/pull/636)
7. [#633 — docs(covenant): learn from every setback](https://github.com/Lingtai-AI/lingtai/pull/633)
8. [#632 — perf(tui): speed up large Email history loading](https://github.com/Lingtai-AI/lingtai/pull/632)
9. [#631 — fix(tui): gate async mail history results](https://github.com/Lingtai-AI/lingtai/pull/631)
10. [#630 — test: simplify architecture document checks](https://github.com/Lingtai-AI/lingtai/pull/630)
11. [#629 — docs: present LingTai as a lifelong Digital Scientist](https://github.com/Lingtai-AI/lingtai/pull/629)
12. [#628 — docs: establish distributed architecture systems](https://github.com/Lingtai-AI/lingtai/pull/628)
13. [#620 — feat(tui): turn projects into admin network switcher](https://github.com/Lingtai-AI/lingtai/pull/620)
14. [#618 — docs(tui): clarify /btw inquiry semantics](https://github.com/Lingtai-AI/lingtai/pull/618)
15. [#617 — refactor(runtime): support lingtai namespace migration](https://github.com/Lingtai-AI/lingtai/pull/617)
16. [#616 — simplify README and move beginner guide to website](https://github.com/Lingtai-AI/lingtai/pull/616)

## Release-window accounting

- **Range:** `v0.10.6..v0.10.7`
- **Commits:** 30 total (22 non-merge, 8 merge)
- **Merged PRs:** 16
- **Human contributor:** [@huangzesen](https://github.com/huangzesen)
- **Automation:** `github-actions[bot]` authored three daily star-count commits; automation is not counted as human authorship.

## Validation

The exact locked candidate passed the release gate:

- Go vet clean
- all TUI and Portal tests passed
- both `lingtai-tui` and `lingtai-portal` built with the `v0.10.7` version
- six Discord invitation occurrences audited with no legacy links remaining
- clean candidate worktree, exact commit/tree match, and no tag/version collision before publication

## Installation and assets

The tag-triggered repository workflow builds four platform archives — macOS and Linux on `amd64` and `arm64`. Every archive contains both `lingtai-tui` and `lingtai-portal` and is accompanied by a SHA-256 file. The same workflow updates the supported Homebrew tap after computing the tagged source-archive checksum (`6bdde2c41a588cccdf54e32732f5c2c6a89df1c2279cde3f7cbca572d05f4dcf`).

Published archive checksums:

| Asset | SHA-256 |
| --- | --- |
| `lingtai-v0.10.7-darwin-amd64.tar.gz` | `7a73db9924edd3e6955cb69434a91c6b503cbf5f7c25a61a70b2503c2a74ead3` |
| `lingtai-v0.10.7-darwin-arm64.tar.gz` | `27d4d08236d9d00f47427c2a76f858b711d5c481d5eea84312e8575f50db0fac` |
| `lingtai-v0.10.7-linux-amd64.tar.gz` | `dd2374bdba4f146350fa3f50cfc5471429aaac1227b1abc5e9a09f6cd7e77ab8` |
| `lingtai-v0.10.7-linux-arm64.tar.gz` | `645feedc7a4e4ff9b8b8cc8f2b3d75d8dea24b8b7c627da37e5c7c2882c1bde0` |

### Transparency: the Intel-macOS build was recovered by hand

We publish four platform archives, but they did not all come off the automated runners cleanly this time. GitHub is retiring the `macos-13` Intel runner image that the release workflow uses to build the Intel-macOS (`darwin-amd64`) archive, and that job failed on this release run while the Apple-Silicon, Linux `amd64`, and Linux `arm64` jobs all passed. Rather than ship three platforms, we rebuilt the Intel-macOS archive manually and uploaded it, so all four archives are present. The manually recovered `lingtai-v0.10.7-darwin-amd64.tar.gz` hashes to exactly `7a73db99…`, the same checksum listed above — the hand-built artifact is byte-identical to what the release intends. Intel-macOS users get a real, verifiable build; the manual step is disclosed here rather than hidden behind a green checkmark.

## Links

- [Release — v0.10.7](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.7)
- [Exact candidate](https://github.com/Lingtai-AI/lingtai/commit/5fb554b69f966b39cb9eca32a70c84d628714d18)
- [Compare v0.10.6...v0.10.7](https://github.com/Lingtai-AI/lingtai/compare/v0.10.6...v0.10.7)
- [Installation guide](https://github.com/Lingtai-AI/lingtai#installation)
