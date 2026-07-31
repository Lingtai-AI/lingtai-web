---
title: "Release day: LingTai v0.19.0 / v0.12.0 — one protocol, visible work, one lifecycle"
date: 2026-07-30
tags: [tech, devlog]
lang: en
description: "LingTai Tool Protocol v2 unifies model-facing tools, Task Card makes long work visible, and canonical install/update/remove scripts give the product one lifecycle across POSIX, PowerShell, and the public website."
---

> **Coordinated release** — [Kernel v0.19.0](https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.19.0) and [TUI/Portal v0.12.0](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.12.0) ship as one paired release. The kernel candidate is `a15453ff1e59181aec7cf70759b9821e569cecd7`; the TUI/Portal candidate is `fdbee4705554369bc4c2800927482a51a5114997` and pins kernel v0.19.0.

> **TL;DR** — This release makes LingTai easier to operate as a long-lived system. Model-facing tools converge on LingTai Tool Protocol v2. Task Card gives long-running work a complete, visible lifecycle. Install, update, and removal scripts gain one canonical source of truth. Channel, notification, mail, and TUI reliability work makes failures more bounded and observable. The strict release window contains **85 commits and 72 merged PRs** across the kernel and TUI/Portal, with four audited human contributors.

## What changed

### One model-facing tool protocol, without erasing real ownership

LingTai Tool Protocol v2 replaces a collection of bespoke call shapes with one explicit `action` + `input` envelope. Web, email, system, daemon, Psyche, Telegram, IMAP, Feishu, WeChat, WhatsApp, and Cloud Mail now share the ToolFamily contract, while each integration keeps its actual transport and side-effect boundary.

That distinction matters. A smaller grammar should make tools easier to learn and compose, but it should not pretend that a Telegram message, a filesystem email, and a lifecycle operation have the same operational semantics. This release standardizes the model-facing surface while making transport failures, rate limits, and retry states more explicit.

### Task Card makes long-running work visible from start to retirement

The kernel now owns a declarative Task Card producer with `start`, `inspect`, `retry`, `stop`, and terminal `remove` actions. Telegram keeps its transport-specific projection and automatic composition, while a programmable frame controls task state and active/inactive intent. TUI/Portal adds `/taskcard`, so an operator can open the current artifact directly instead of reconstructing progress from chat history.

The practical contract is simple: if a task is long enough to follow, its card should be truthful while active, preserved when merely stopped, and explicitly removed when the work is complete or abandoned.

### Install, update, and removal have one canonical source

The `Lingtai-AI/lingtai` repository now owns the complete POSIX and PowerShell lifecycle. Stable `install.sh` and `install.ps1` entrypoints cover installation and updating; canonical fix, verify, dev, and removal children live behind them. The public website mirrors the exact upstream bytes and fails loud on drift instead of maintaining an independent installer fork.

The new removal lifecycle is deliberately conservative. `remove.sh` and `remove.ps1` delete only receipt-owned installation state, preserve user configuration, secrets, presets, projects, auth, and shared tooling, and remain idempotent on a second run. That gives users one documented lifecycle without turning “uninstall” into an unbounded cleanup command.

### More honest channel, notification, mail, and operator behavior

A broad reliability pass closes smaller gaps that become painful in long-lived operation:

- Telegram rate limits propagate their real retry contract; WeChat and Cloud Mail retry failed wake delivery; Feishu keeps MCP stdio protocol-only; filesystem mail polling is sliced instead of monopolizing a turn.
- Concurrent daemon terminal wakes and synthetic notification calls remain schema-valid; live SQLite readers see current data instead of a stale connection view.
- The TUI mail conversation rail gets clearer focus, collapse, mouse, and current-row behavior; credential-family handling is unified; frequent live-network refreshes no longer rescan mail history.
- Windows latest-main installation and replacement reporting are more explicit. Windows artifacts for this release were cross-built and hash-verified, but **not executed or claimed as tested**, following the explicit release scope.

## Why this matters

LingTai is not a single request/response program. It is a network that stays alive, receives messages, runs tools, delegates work, and accumulates memory. Small inconsistencies at those boundaries become expensive over time: a tool grammar that changes by channel, a progress card that never retires, an installer copy that drifts, or a rate limit that looks like silence.

This release reduces those long-term costs. Tools speak one model-facing protocol. Long work has a visible lifecycle. Product installation has one owner. Failures surface closer to the layer that owns them.

## Release-window accounting

- **Kernel range:** `v0.18.2..718262f879acd5bb7d2bcf83f23378b759988c0f` — 55 commits, 44 merged PRs
- **TUI/Portal range:** `v0.11.8..8c0d2c22ca554729b850c0feadc2c35fe93e9f63` — 30 commits, 28 merged PRs
- **Human contributors:** [@huangzesen](https://github.com/huangzesen), [@TZZheng](https://github.com/TZZheng), [@BatalloLu](https://github.com/BatalloLu), [@ZacharyHu0](https://github.com/ZacharyHu0)

The complete change ledger is available in the two compare views linked below; the release narrative above groups the work by user-visible contract rather than repeating 72 PR titles.

## Validation and honest limits

The exact kernel package workflow [run 30598196925](https://github.com/Lingtai-AI/lingtai-kernel/actions/runs/30598196925) completed successfully and produced 15 wheels, 1 sdist fallback, a strict release manifest, and `SHA256SUMS`. All package hashes agree across the downloaded bytes, manifest, and sums file; `twine check` passed; clean CPython 3.13.14 native-wheel and CPython 3.14.6 sdist-fallback import/version smokes passed.

The kernel documentation governance gate validated 305 documents. Its terminal source-checkout suite recorded **7,239 passed and 27 skipped**, plus 18 known package-data/resource failure or error nodes. Those 18 nodes are a strict subset of the exact prior baseline with **zero new node names**; they remain recorded as nonzero inherited debt, not presented as a green full-suite claim.

TUI/Portal native and cross builds passed, Portal tests passed, and every TUI test except two exact inherited cursor-panic nodes passed. Both nodes reproduce the same `cursor.(*Model).Blink` nil panic on the frozen base and the release candidate. They remain visible inherited debt, not a release regression and not a PASS claim.

Per the explicit release instruction, Windows execution was not part of this round. Windows wheels and the TUI bundle path were cross-built/hash-verified only; no Windows binary was launched.

## Installation and packages

The supported install and upgrade entrypoint remains:

```bash
curl -fsSL https://lingtai.ai/install.sh | bash
```

Kernel v0.19.0 publishes the same frozen wheel/sdist bytes to PyPI, GitHub, and Gitee. TUI/Portal v0.12.0 publishes its GitHub source release, updates the Homebrew formula, and produces a Windows AMD64 bundle pinned to kernel v0.19.0. Existing Homebrew users remain supported.

## Links

- [Kernel release — v0.19.0](https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.19.0)
- [TUI/Portal release — v0.12.0](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.12.0)
- [Kernel compare — v0.18.2...v0.19.0](https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.18.2...v0.19.0)
- [TUI/Portal compare — v0.11.8...v0.12.0](https://github.com/Lingtai-AI/lingtai/compare/v0.11.8...v0.12.0)
- [Install LingTai](https://lingtai.ai/install.sh)
