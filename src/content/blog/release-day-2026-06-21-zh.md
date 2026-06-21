---
title: "Release notes：LingTai TUI v0.9.4 与 kernel v0.13.1"
date: 2026-06-21
tags: [tech, devlog]
lang: zh
description: "这次 release 让运行时 metadata 更可见、但不打扰日常操作：结构化工具结果、通知渲染、session-journal 命名，以及更稳的凝蜕纪律。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI <strong>v0.9.4</strong> 与 LingTai kernel <strong>v0.13.1</strong> 已发布。这组 release 重点改善 agent 与操作者如何看见 tool-result metadata：默认视图更紧凑，需要时能展开细节，必要时还能从日志里按 ID 追溯完整证据。
</div>

这次 release 的主题，是减少意外。

最近几轮运行时改动让工具结果变得更结构化：kernel 现在把持久工具 metadata、最新 runtime state、高注意力 guidance、以及 channel 自有的通知 payload 分开；TUI 也开始在操作者真正会查看的位置渲染这些结构化 block：`/notification`、mail replay，以及 Ctrl+O 的不同 detail layer。

结果应该是：普通视图更安静；当你主动要细节时，信息更明确。

## 发生了什么变化

### TUI / Portal v0.9.4

- `/notification` 现在渲染结构化 metadata block，而不是把它们压平成吵闹的 JSON。
- Mail replay 与 Ctrl+O full detail 会保留 tool-result metadata block，不再提前截断被 session 摄入的结果。
- Ctrl+O compact layer 对很长的一行 tool-call 摘要更严格，快速检查时不再被长行淹没。
- Homebrew tap formula 已指向 v0.9.4 source tag。

### Kernel v0.13.1

- Runtime tool result 现在有更清楚的 metadata 边界：`_tool`、`_runtime.state`、`_runtime.guidance`，以及通知 payload。
- Active guidance bundle 会在 agent boot/refresh 时镜像到每个 agent workdir 的 `system/guidance.json`，所以 filesystem-facing tools 与 LLM context 都能看见同一份 guidance。
- summarize manual 与 resident guidance 现在把预期 workflow 说清楚：先读原始输出，把有用证据写进摘要，再在 context 压力变紧急前主动凝蜕。
- resident procedures prompt 现在明确写出 canonical session-journal child name：
  `knowledge/session-journal/<YYYY-MM-DD>-molt-<molt-count>-<slug>/KNOWLEDGE.md`。

最后一点看起来小，但很重要。Kernel 会验证 session-journal path 是否存在、是否有正确 marker；它不会强制 human-readable child directory 的命名格式。把格式重新放回 resident procedures prompt，能帮助 agent 让同一天的多次凝蜕 journal 仍然可排序、可比较。

## 为什么这重要

LingTai agents 会做长任务。长任务会留下很多噪声：tool calls、tool results、notification payloads、release logs、build output、debugging evidence。目标不是隐藏这些证据，而是把它们放在正确的层级后面：

- normal view：紧凑、可读；
- detail view：结构化、可检查；
- logs：完整保真，并可按 ID 找回。

这次 release 继续把这套分层往正确方向推进。

## 验证

Kernel v0.13.1 通过了：

- full pytest suite：2523 passed，4 skipped；
- 删除 test-generated `__pycache__` 目录后的 package build；
- 对 release artifacts 运行 `twine check`；
- PyPI 已发布 0.13.1 sdist 与 macOS arm64 wheel。

TUI/Portal v0.9.4 通过了：

- 针对本次渲染改动区域的 focused TUI tests；
- full TUI Go tests；
- release build check，输出 `lingtai-tui v0.9.4`；
- Portal web install/build；
- Portal Go tests。

## Release links

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.1>
- Runtime package source：<https://pypi.org/project/lingtai/0.13.1/>
- TUI release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.4>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>

对普通用户来说，LingTai managed project environments 仍然是 runtime package 被解析和管理的正常路径。PyPI 页面是已发布 runtime package source，也是一个有用的验证点，但不是主要的终端用户升级叙事。

## 方向

下一层工作不是花哨功能，而是程序性可靠性：持续教会 agents 总结真正重要的内容，把完整证据留在 logs 里，并在 context 仍健康时主动凝蜕。

这次 release 表面上不大。它的重点，是让长时间运行的工作少一点脆弱感。
