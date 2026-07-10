---
title: "Release day: Kernel v0.16.3 and TUI/Portal v0.10.6"
date: 2026-07-10
tags: [tech, devlog]
lang: en
description: "A paired LingTai release: reorganized tool packages with glossaries, a one-shot installer, single-sourced prompt guidance, codex-pool model classification, backend knowledge submanuals, and a platlib-compliant sidecar wheel repair."
---

> **TL;DR** — This release reorganizes how the kernel owns tool knowledge: every built-in tool now lives in its own package directory with a CONTRACT.md, EN/ZH/Wen glossary files, and a centralized glossary validator. Kernel #842 single-sources repeated tool guidance in the system prompt, saving ~2,975 tokens per call on the measured test prompt (measurement scope caveat noted below). The TUI ships a one-shot GitHub-release installer, a custom OpenAI wire selector, codex-pool model classification, mailbox search, session tool-call stats, and portal loopback-only binding. The kernel adds backend flag-discovery submanuals for 9 daemon backends, IMAP attachment filename sanitization, extended credential redaction, AED manifest recognition, and closes with #847 — a packaging repair that makes the native lingtai-search-sidecar platform wheels install into platlib.

## What changed

### TUI/Portal v0.10.6

The TUI side ships a one-shot GitHub-release installer that bootstraps Go, Node, uv, and the venv-managed runtime from a single `curl | bash` command. The installer hardens WSL and broken-venv fallbacks, bootstraps the correct Go toolchain for portal builds, and falls back to source builds when prebuilt binaries are unavailable.

New cockpit features include mailbox search and archive scanning (#610), session tool-call stats in the Details panel (#611), a custom OpenAI wire selector in the preset editor (#613), and a preset-skill router with 12 child manuals (#614) covering Codex, Claude Agent SDK, DeepSeek, Gemini, Kimi, MiMo, MiniMax, NVIDIA, OpenRouter, and Zhipu providers.

Security: the portal now binds to loopback only by default instead of 0.0.0.0. Codex OAuth credentials can be labeled, making multi-account setups distinguishable in the login UI.

Other fixes: i18n locale fallback hardening, spaced agent path preservation in list and purge commands, stale Telegram demo removal, init example sync with template, tool description i18n path resolution, GPT-5.6 preset defaults, and Homebrew formula license alignment.

### Kernel v0.16.3

The kernel release reorganizes tool ownership. Kernel #839 consolidates 14 tool packages from scattered locations (`lingtai/core`, `lingtai/capabilities`, `lingtai/intrinsics`) into a unified `src/tools/` namespace, each with its own CONTRACT.md. Kernel #844 adds per-language glossary files (glossary-en.md, glossary-zh.md, glossary-wen.md) to every tool package, a `tools/i18n/` directory with JSON catalogs, and a `glossary_validator.py` that enforces structure and cross-language key parity.

Kernel #842 single-sources repeated tool guidance in the system prompt by referencing the glossary rather than inlining full descriptions. On the measured test prompt, this saves approximately 2,975 tokens per API call. **Measurement caveat:** this figure comes from a specific test prompt and model configuration; it cannot be taken as a universal net saving across all operator configurations and prompts.

Kernel #843 adds a custom OpenAI wire API selector. Kernel #841 classifies the codex-pool auth pool by exact model identifier. The token ledger now records safe auth metadata for auditability.

Nine daemon backend flag-discovery submanuals (#830–#837) document the exact flags, environment variables, and discovery flow for Codex, OpenCode, claude-p, MiMo Code, built-in LingTai, Kimi Code, Qwen Code, Cursor, and Oh-My-Pi.

The release closes with kernel #847, a packaging repair: the native lingtai-search-sidecar platform-wheel layout now correctly uses platlib (rather than purelib), so the sidecar lands where a platform wheel is expected to install it. The Ubuntu, Intel-macOS, ARM-macOS, and Windows wheel jobs plus an independent sdist all passed on wheels-workflow run 29108219136. Intel and ARM macOS wheels declare 10.12 / 11.0 deployment-target floors, and a dependency-free sidecar smoke test avoids the unrelated PyAV/FFmpeg dependency resolution. This is a fix to the existing Python wheel CI runner — not a new Windows product or tool.

Other fixes: IMAP attachment filename sanitization before disk writes (#770), extended credential key name redaction (#824), AED manifest field recognition (#825), pseudo-agent outbox polling priority (#806), rebuild context observation timing (#828), prompt-related-files runtime path fixes (#846), and anatomy script relocation (#827).

## Why this matters

Tool knowledge ownership is a structural investment. When a contributor can find a tool's public contract, localized terms, and glossary validation in one directory, the cost of adding a new language or modifying a tool description drops. The single-sourcing of system-prompt guidance (#842) is the first concrete payoff, but the measurement scope matters: the -2,975 token saving is real for the test prompt used, not a universal floor.

The one-shot installer removes the largest adoption friction for operators who want to try LingTai without managing Homebrew, Go, and Node installations by hand. Portal loopback-only binding is the right default for a local-first tool. And a platform wheel that lays its native sidecar into platlib is the difference between an install that imports cleanly and one that silently places files where they do not belong.

## Release-window accounting

**Human contributors/authors represented in the window:** @huangzesen, @TZZheng, @9s5bz2jvd2-lang (kernel #843 co-author), @BatalloLu, @wchwawa. Automation and platform identities (@github-actions[bot], the GitHub merge committer) and AI co-authors (Claude Fable 5, Claude Opus 4.8) are documented separately below and are not counted as human authors.

**Commit author audit:** TUI/Portal v0.10.5..v0.10.6 contains 41 commits: 30 by @huangzesen, 7 by @TZZheng, 3 daily star-count updates by @github-actions[bot], and 1 by @BatalloLu; the 13 merge commits are committed by GitHub. Kernel v0.16.2..v0.16.3 contains 54 commits: 48 by @huangzesen, 5 by @TZZheng, and 1 by @wchwawa. @9s5bz2jvd2-lang is a co-author of kernel #843 (whose commit author is @huangzesen), not a separate commit-count author. The bot and GitHub merge committers are automation, documented only in the audit counts.

**Diff stats:** TUI/Portal: 149 files changed, +7,573 / -1,007 lines. Kernel: 396 files changed, +13,306 / -2,780 lines through the v0.16.3 tag (392 files, +12,506 / -2,718 through the candidate before the #847 sidecar-wheel repair added 5 files, +809 / -71).

### Kernel closed PRs (highlights from 54 commits)

- [lingtai-kernel#839](https://github.com/Lingtai-AI/lingtai-kernel/pull/839) (merged) — refactor(tools): consolidate built-in tools — @huangzesen
- [lingtai-kernel#844](https://github.com/Lingtai-AI/lingtai-kernel/pull/844) (merged) — feat(tools): move localized terms into package glossaries — @huangzesen. EN: 0 new chars; ZH: +5,224 chars (+221.17%); Wen: +5,106 chars (+212.66%). These are glossary-file-only deltas; EN terms already existed in source.
- [lingtai-kernel#842](https://github.com/Lingtai-AI/lingtai-kernel/pull/842) (merged) — perf(llm): single-source tool guidance in the system prompt — @huangzesen. Measured -2,975 tokens on the validation test prompt; a wire-saving on that specific prompt, a different scope from the #844 glossary character deltas and not a universal net.
- [lingtai-kernel#843](https://github.com/Lingtai-AI/lingtai-kernel/pull/843) (merged) — feat(llm): add OpenAI wire API selector — @huangzesen (co-authored by @9s5bz2jvd2-lang)
- [lingtai-kernel#841](https://github.com/Lingtai-AI/lingtai-kernel/pull/841) (merged) — feat(codex): classify codex-pool auth pool by exact model — @huangzesen
- [lingtai-kernel#830](https://github.com/Lingtai-AI/lingtai-kernel/pull/830)–[#837](https://github.com/Lingtai-AI/lingtai-kernel/pull/837) (merged) — docs(daemon): add flag-discovery submanuals for 9 backends — @huangzesen
- [lingtai-kernel#847](https://github.com/Lingtai-AI/lingtai-kernel/pull/847) (merged) — fix(packaging): make sidecar wheels platlib compliant — @huangzesen. Ubuntu/Intel-macOS/ARM-macOS/Windows wheel jobs + independent sdist passed on run 29108219136; macOS floors 10.12/11.0; dependency-free sidecar smoke test.
- [lingtai-kernel#846](https://github.com/Lingtai-AI/lingtai-kernel/pull/846) (merged) — fix: prompt-related-files runtime path — @huangzesen
- [lingtai-kernel#770](https://github.com/Lingtai-AI/lingtai-kernel/pull/770) (merged) — fix: sanitize IMAP attachment filenames — @huangzesen
- [lingtai-kernel#824](https://github.com/Lingtai-AI/lingtai-kernel/pull/824) (merged) — fix(trace): redact additional credential key names — @huangzesen
- [lingtai-kernel#825](https://github.com/Lingtai-AI/lingtai-kernel/pull/825) (merged) — fix(init): recognize AED manifest fields — @huangzesen

### TUI/Portal closed PRs (highlights from 41 commits)

- [lingtai#595](https://github.com/Lingtai-AI/lingtai/pull/595) (merged) — feat(install): add GitHub release one-shot installer — @huangzesen
- [lingtai#601](https://github.com/Lingtai-AI/lingtai/pull/601)–[#604](https://github.com/Lingtai-AI/lingtai/pull/604) (merged) — fix: installer venv hardening (uv, ensurepip, broken venv, portal builds) — @huangzesen
- [lingtai#613](https://github.com/Lingtai-AI/lingtai/pull/613) (merged) — feat(tui): add custom OpenAI wire selector — @huangzesen
- [lingtai#612](https://github.com/Lingtai-AI/lingtai/pull/612) (merged) — fix(tui): preserve and truthfully render model-classified codex pools — @huangzesen
- [lingtai#614](https://github.com/Lingtai-AI/lingtai/pull/614) (merged) — docs(preset): add lingtai-preset-skill router with 12 child manuals — @huangzesen
- [lingtai#610](https://github.com/Lingtai-AI/lingtai/pull/610) (merged) — feat(tui): add mailbox search and archive scanning — @huangzesen
- [lingtai#611](https://github.com/Lingtai-AI/lingtai/pull/611) (merged) — feat(tui): show session tool call stats in Details — @TZZheng
- [lingtai#609](https://github.com/Lingtai-AI/lingtai/pull/609) (merged) — feat: update Codex preset GPT-5.6 defaults — @TZZheng
- [lingtai#606](https://github.com/Lingtai-AI/lingtai/pull/606) (merged) — docs: make install.sh the README install path — @huangzesen
- TUI BatalloLu — feat(tui): allow labeling Codex OAuth credentials — @BatalloLu
- TUI fix/portal-loopback — fix(portal): bind to loopback by default — @TZZheng

## Validation and release hygiene

The structured archive entry and companion blog posts were prepared in a clean lingtai-web release worktree on branch `release/20260710-1` at the paired candidate commit. `npm ci && npm run build` passed. Release-window counts were recomputed from the actual repositories at the v0.10.5..v0.10.6 and v0.16.2..v0.16.3 tag ranges. No pushes, deploys, tags, package publishes, GitHub release edits, or config mutations were made.

## Links

- TUI/Portal v0.10.6: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.6>
- Kernel v0.16.3: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.3>
- TUI/Portal compare: <https://github.com/Lingtai-AI/lingtai/compare/v0.10.5...v0.10.6>
- Kernel compare: <https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.16.2...v0.16.3>
- Kernel #839 tools consolidation: <https://github.com/Lingtai-AI/lingtai-kernel/pull/839>
- Kernel #844 tool glossaries: <https://github.com/Lingtai-AI/lingtai-kernel/pull/844>
- Kernel #842 single-source guidance: <https://github.com/Lingtai-AI/lingtai-kernel/pull/842>
- Kernel #847 sidecar wheel platlib repair: <https://github.com/Lingtai-AI/lingtai-kernel/pull/847>
- TUI #595 one-shot installer: <https://github.com/Lingtai-AI/lingtai/pull/595>
