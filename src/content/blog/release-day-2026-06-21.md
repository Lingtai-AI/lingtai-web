---
title: "Release notes: LingTai TUI v0.9.4 and kernel v0.13.1"
date: 2026-06-21
tags: [tech, devlog]
lang: en
description: "A release focused on making runtime metadata visible without flooding the operator: structured tool results, notification rendering, session-journal naming, and calmer molt discipline."
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI <strong>v0.9.4</strong> and LingTai kernel <strong>v0.13.1</strong> are out. This pair sharpens how agents and operators see tool-result metadata: compact by default, detailed when requested, and recoverable from logs when needed.
</div>

This release is mostly about reducing surprise.

The last few runtime changes made tool results more structured: the kernel now separates durable tool metadata, latest runtime state, high-attention guidance, and channel-owned notification payloads. The TUI now knows how to render those blocks in the places operators actually look: `/notification`, mail replay, and the Ctrl+O detail layers.

The result should feel quieter in the ordinary view, but more explicit when you ask for detail.

## What changed

### TUI / Portal v0.9.4

- `/notification` renders structured metadata blocks instead of flattening them into noisy JSON.
- Mail replay and Ctrl+O full detail preserve tool-result metadata blocks without pre-truncating session-ingested results.
- The compact Ctrl+O layer is stricter about very long one-line tool-call summaries, so quick inspection stays quick.
- The Homebrew tap formula now points at the v0.9.4 source tag.

### Kernel v0.13.1

- Runtime tool results now carry clearer metadata boundaries for `_tool`, `_runtime.state`, `_runtime.guidance`, and notification payloads.
- The active guidance bundle is mirrored into each agent workdir as `system/guidance.json` on boot/refresh, making the guidance visible to filesystem-facing tools as well as the LLM context.
- The summarize manual and resident guidance now make the intended workflow explicit: read raw output, preserve the useful evidence in a summary, and molt deliberately before pressure becomes urgent.
- The resident procedures prompt now spells out the canonical session-journal child name:
  `knowledge/session-journal/<YYYY-MM-DD>-molt-<molt-count>-<slug>/KNOWLEDGE.md`.

That last point looks small, but it matters. The kernel validates that the session-journal path exists and has the right marker; it does not enforce the human-readable child-directory name. Putting the format back into the resident procedures prompt helps agents keep journals sortable and comparable across same-day molts.

## Why this matters

LingTai agents do long work. Long work creates noisy traces: tool calls, tool results, notification payloads, release logs, build output, and debugging evidence. The goal is not to hide that evidence. The goal is to put it behind the right layer:

- normal view: compact and readable;
- detail view: structured and inspectable;
- logs: full-fidelity and recoverable by ID.

This release keeps that layering moving in the right direction.

## Validation

Kernel v0.13.1 was validated with:

- full pytest suite: 2523 passed, 4 skipped;
- package build after removing test-generated `__pycache__` directories;
- `twine check` on the release artifacts;
- PyPI publication for the 0.13.1 sdist and macOS arm64 wheel.

TUI/Portal v0.9.4 was validated with:

- focused TUI tests for the changed rendering areas;
- full TUI Go tests;
- a release build check that printed `lingtai-tui v0.9.4`;
- Portal web install/build;
- Portal Go tests.

## Release links

- Kernel release: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.1>
- Runtime package source: <https://pypi.org/project/lingtai/0.13.1/>
- TUI release: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.4>
- Homebrew tap: <https://github.com/Lingtai-AI/homebrew-lingtai>

For regular users, LingTai's managed project environments remain the normal way the runtime package is resolved. The PyPI page is the published runtime package source and a useful verification point, not the primary end-user upgrade story.

## Direction

The next layer is procedural rather than flashy: keep teaching agents to summarize what matters, retain full evidence in logs, and molt while the context is still healthy.

The release is small on the surface. It is about making long-running work feel less brittle.
