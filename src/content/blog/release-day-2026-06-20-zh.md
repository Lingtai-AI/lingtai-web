---
title: "Release day：更轻的上下文，更可靠的通知"
date: 2026-06-20
tags: [tech, devlog]
lang: zh
description: "LingTai kernel v0.13.0 与 TUI/Portal v0.9.3 一起发布：渐进披露、通知历史、凝蜕 journal、Codex header 修复，以及更可审计的操作界面。"
---

<div class="callout">
  <strong>TL;DR.</strong> 今天的 LingTai release 让运行时更安静，也更可追溯。Kernel <a href="https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.0">v0.13.0</a> 让 agent 能把大型工具结果摘要化，把通知处理拆到独立工具里，要求凝蜕前写 session journal，并修复 Codex backend 的 cache-affinity header。TUI/Portal <a href="https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.3">v0.9.3</a> 则把这些变化显出来：通知 block 历史、本地时区、daemon token usage，都能在界面里看见。
</div>

LingTai 是 agent runtime，但真正让它长期可用的工作，往往不是再加一个能力，而是让它知道什么该记、什么该放下，以及事后留下足够证据让人审计。

2026-06-20 这组 release 做的正是这件事。Kernel release 改的是 agent 如何管理自己的上下文；TUI/Portal release 改的是操作者如何看见这些运行痕迹。

## Kernel v0.13.0：把渐进披露变成运行时习惯

这次最重要的变化，不是更大的 prompt，也不是新的模型，而是更小的工作集。

大型工具结果现在都会带稳定的 `_tool_result_metadata`：tool call id、tool 名、字符数、阈值、摘要提示等。agent 消化结果之后，可以调用 `system.summarize`，把上下文里巨大的原始输出替换成一段自己写的索引式摘要；原始结果仍然留在 event log 里，必要时还能追溯。

这很重要。真实任务通常不是一个干净答案，而是一串搜索、构建、测试日志、PR review、trace。真正值得留在工作上下文里的，往往不是整段原始输出，而是结论、证据、风险和下一步。

v0.13.0 也让 large-result reminder 可以被 acknowledge。清掉提醒不会删除底层结果，因此通知面板可以保持干净，取证链路也不会被破坏。

## 通知处理成为独立 surface

通知现在由独立的 `notification` capability 负责。旧的 `system.notification` 和 `system.dismiss` alias 已移除。

这不只是改名。`system` 负责生命周期和运行时操作；`notification` 负责实时通知面。边界清楚之后，tool schema 更小，误用空间更少，agent 的规则也更明确：通知的读取和清理由 notification tool 做；mail、chat 等 producer 的具体内容仍优先走各自的 read/dismiss。

Kernel 还会持久化真实的 canonical notification-block snapshot。这样当操作者在 TUI 里问“当时 agent 看到的通知 block 到底是什么？”时，界面有具体对象可以展示，而不是只能猜。

## 凝蜕前必须写 session journal

LingTai agent 通过凝蜕丢掉短期 conversation context，同时保留 durable memory。v0.13.0 起，agent 主动调用 `psyche.context.molt` 时，必须提供合法的 `session_journal_path`。

这是一个很小的约束，但后果很大：在丢掉工作上下文之前，agent 必须先写下一段 durable session record。下一世的自己接到的应该是一封交接信，而不是一片空白。

## Codex header 更稳了

Codex backend 路径也做了可靠性修复。运行时现在会发送下划线形式的 `session_id` 和 `thread_id` header，以匹配 Codex CLI 的 cache-affinity 路径；同时会向 backend 诚实传递 LingTai client-identity metadata。

这类修复最好的结果就是“不再有事”：更少 cache-affinity 意外，更清楚的来源信息，更少 backend 侧的猜测。

## TUI/Portal v0.9.3：让运行时被看见

配套的 TUI/Portal release 重点是可见性。

`/notification` 现在可以从 sqlite event log 里读取历史，所以 live notification surface 变化之后，旧通知也不会凭空消失。它也能展示 kernel 持久化下来的真实 notification-block snapshot。

其他面向操作者的小改动也很直接：

- `/kanban` 时间戳显示本地时区。
- daemons 视图显示本地时区，并在可用时展示 CLI token usage。
- 修复了 TUI metadata/state schema 的 migration version collision。
- developer guide 记录了 runtime refresh verification 的经验。

这些变化合起来，让 LingTai 在运行时更容易 debug，在事后也更容易解释。

## 升级说明

TUI/Portal 用户可以照常用 Homebrew 更新：

```bash
brew update
brew upgrade lingtai-ai/lingtai/lingtai-tui
```

Kernel 包 `lingtai` v0.13.0 已发布到 PyPI，作为 LingTai-managed environment 使用的 runtime package source。已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令 当作普通用户升级故事。

Release 链接：

- Kernel：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.0>
- TUI/Portal：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.3>
- PyPI kernel package：<https://pypi.org/project/lingtai/0.13.0/>

## 方向

这组 release 延续的是同一条线：把沉重细节放到渐进披露之后，把关键证据持久化下来，并让操作者界面诚实显示发生过什么。

一个能长期工作的 runtime，不该越来越吵；它应该越来越可审计。
