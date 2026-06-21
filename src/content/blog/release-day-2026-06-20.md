---
title: "Release day: smaller contexts, sturdier notifications"
date: 2026-06-20
tags: [tech, devlog]
lang: en
description: "LingTai kernel v0.13.0 and TUI/Portal v0.9.3 ship a quieter, more inspectable runtime: progressive disclosure, notification history, session journals, Codex header fixes, and better operator views."
---

<div class="callout">
  <strong>TL;DR.</strong> Today’s LingTai releases make the runtime less noisy and more accountable. Kernel <a href="https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.0">v0.13.0</a> teaches agents to summarize large tool results, keeps notification handling in its own tool, requires session journals before deliberate molts, and fixes Codex backend affinity headers. TUI/Portal <a href="https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.3">v0.9.3</a> makes those changes visible with notification-block history, timezone-aware views, and daemon token usage.
</div>

LingTai is an agent runtime, but the work of making it useful is often less glamorous than adding one more capability. A long-running agent needs to remember what matters, forget what does not, and leave enough evidence that the human can audit what happened.

The 2026-06-20 release pair is about that discipline. The kernel release changes what agents carry through their own context. The TUI/Portal release changes what operators can inspect afterward.

## Kernel v0.13.0: progressive disclosure becomes a runtime habit

The headline feature is not a new model or a bigger prompt. It is a smaller working set.

Large tool results now carry consistent `_tool_result_metadata`, including the tool call id, tool name, character count, threshold, and summarization hint. Agents can call `system.summarize` after digesting a result to replace the context-visible blob with a compact, agent-authored index while the original remains available in the event log.

This matters because many real tasks are not one clean answer. They are searches, builds, test logs, PR reviews, and traces. The useful memory is not the entire raw output; it is the conclusion, the evidence, the risks, and the next step.

v0.13.0 also makes large-result reminders dismissible. A reminder can be acknowledged without deleting the underlying result, which keeps the notification surface clean without damaging the forensic trail.

## Notifications move to their own surface

Notification handling is now owned by a dedicated `notification` capability. The old `system.notification` and `system.dismiss` aliases are gone.

That split is more than naming. `system` owns lifecycle and runtime operations. `notification` owns the live notification surface. Keeping those boundaries separate makes tool schemas smaller, reduces accidental misuse, and gives agents a clearer rule: read and clear notifications through the notification tool; use producer-specific reads for mail or chat.

The kernel also persists actual canonical notification-block snapshots. That gives the TUI something concrete to show when an operator asks, “what notification block did the agent see then?”

## Molts now require a session journal

LingTai agents molt to shed conversation context while keeping durable memory. In v0.13.0, deliberate agent-initiated `psyche.context.molt` calls must provide a valid `session_journal_path`.

This is a small constraint with a large consequence: before an agent drops its working context, it has to write a durable segment record. The next self should inherit a briefing, not a mystery.

## Codex gets steadier headers

The Codex backend path also received reliability work. The runtime now sends underscore `session_id` and `thread_id` headers for compatibility with the Codex CLI cache-affinity path, and it passes honest LingTai client-identity metadata upstream.

The practical result is boring in the best way: fewer cache-affinity surprises, clearer origin metadata, and less backend guesswork.

## TUI/Portal v0.9.3: make the runtime visible

The companion TUI/Portal release is about operator visibility.

The `/notification` view can now read from the sqlite event log, so notification history does not disappear when the live notification surface changes. It also shows the persisted notification-block snapshots emitted by the kernel.

Other operator-facing improvements are smaller but immediately useful:

- `/kanban` timestamps show the local timezone.
- The daemons view shows local timezone information and CLI token usage where available.
- A migration version collision was fixed in the TUI metadata/state schema.
- The developer guide now records runtime refresh verification lessons.

Together, these changes make LingTai easier to debug while it is running and easier to explain after it has moved on.

## Upgrade notes

For the TUI/Portal release, Homebrew users can update in the usual way:

```bash
brew update
brew upgrade lingtai-ai/lingtai/lingtai-tui
```

For the kernel package, `lingtai` v0.13.0 is published on PyPI as the runtime package source used by LingTai-managed environments. Existing projects should follow their normal TUI-managed refresh or setup path rather than treating a a bare global pip command as the user upgrade story.

Release links:

- Kernel: <https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.0>
- TUI/Portal: <https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.3>
- PyPI kernel package: <https://pypi.org/project/lingtai/0.13.0/>

## The direction

These releases continue a simple pattern: put heavy details behind progressive disclosure, keep durable evidence for later inspection, and make the operator surface honest about what happened.

That is the shape of a runtime that can work for a long time without becoming opaque.
