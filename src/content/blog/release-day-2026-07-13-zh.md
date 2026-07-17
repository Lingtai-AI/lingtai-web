---
title: "发布日：TUI/Portal v0.10.7"
date: 2026-07-13
tags: [tech, devlog]
lang: zh
description: "一次 TUI 优先的 LingTai 发布：/projects 成为实时管理网络切换器、邮件历史加载更快且渲染一致、运行时命名空间兼容 shim，以及对一次手动恢复的 Intel-macOS 构建的诚实透明说明。"
---

> **TUI 优先发布** — [TUI/Portal v0.10.7](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.7) 从独立锁定的 TUI/Portal 候选版本发布，提交 `5fb554b69f966b39cb9eca32a70c84d628714d18`（tree `05c068dbc5e50832d2d5d425099c104290acd2f4`）。这是一次仅 TUI/Portal 的发布——它交付 Go TUI 与 portal 二进制文件，二者仅通过文件系统与智能体通信。协调的 kernel 发布按自身节奏开发，不属于本标签。

> **TL;DR** — 核心变化是将 `/projects` 转变为基于运行中进程清单的实时管理网络切换器（#620）。邮件历史现按需分页与限界，最新 200 条约 50ms 加载完成，JSONL 为权威回放源（#632）；一轮邮件渲染打磨使邮箱从缓存渲染一次、显示完整本地时间戳，并将 Ctrl+O 叠加层与默认视图对齐（#631、#637、#638、#640）。一个运行时 shim 让基于旧 `lingtai_kernel` 或新 `lingtai.kernel` 导入布局的项目均可继续工作（#617），修复了一个守护进程 CLI 缓存命中率显示错误（#636），并刷新了文档。严格的 `v0.10.6..v0.10.7` 窗口为 16 个已合并 PR。四个平台归档全部发布——包括一个我们不得不手动恢复的 Intel-macOS 构建，下文诚实说明。

## 发生了什么变化

### `/projects` 成为管理网络切换器

TUI [#620](https://github.com/Lingtai-AI/lingtai/pull/620) 将 `/projects` 转变为基于实时进程清单的管理网络切换器。操作者可选择任意 admin/orchestrator 智能体切换上下文，非管理员成员保持可见以便掌握拓扑。详情面板包含精选的 `/kanban` 子集：生命周期、进程运行时间、molt 计数及实时拓扑。同一窗口中 `/projects` 的智能体分组也得到澄清（[#639](https://github.com/Lingtai-AI/lingtai/pull/639)）。

### 更快、更安全的邮件历史与渲染

邮件是长时间运行智能体的主要异步通信界面，因此本次发布对其做了一轮聚焦打磨：

- [#632](https://github.com/Lingtai-AI/lingtai/pull/632) 按需分页与限界邮件历史；最新 200 条约 50ms 加载完成，JSONL 为权威回放源（修复了 SQLite 内部空洞导致的不一致）。
- [#631](https://github.com/Lingtai-AI/lingtai/pull/631) 将异步邮件历史结果锁定至所属模型，防止结果在视图已更改后到达时产生过期/跨视图变更。
- [#637](https://github.com/Lingtai-AI/lingtai/pull/637)、[#638](https://github.com/Lingtai-AI/lingtai/pull/638) 与 [#640](https://github.com/Lingtai-AI/lingtai/pull/640) 使邮件从实时缓存渲染一次、在每一层显示完整本地时间戳，并将 Ctrl+O 邮箱渲染与默认视图对齐。

### 运行时、诊断与文档打磨

- [#636](https://github.com/Lingtai-AI/lingtai/pull/636) 通过规范化缓存输入计算修复了不可能的守护进程 CLI 缓存命中率显示，使 `TokenTotals.Input` 正确包含缓存输入。
- [#617](https://github.com/Lingtai-AI/lingtai/pull/617) 更新 TUI/Portal 运行时路径，同时识别旧 `lingtai_kernel` 布局与新 `lingtai.kernel` 运行时命名空间，使两种布局的项目均能继续工作。
- [#630](https://github.com/Lingtai-AI/lingtai/pull/630) 精简架构文档检查；[#618](https://github.com/Lingtai-AI/lingtai/pull/618) 澄清 `/btw` 查询语义。
- 文档围绕"终身数字科学家"叙事与分布式架构刷新（[#629](https://github.com/Lingtai-AI/lingtai/pull/629)、[#628](https://github.com/Lingtai-AI/lingtai/pull/628)），一条"从每次挫折中学习"规则落入 Covenant（[#633](https://github.com/Lingtai-AI/lingtai/pull/633)），README 精简且入门指南迁移至网站（[#616](https://github.com/Lingtai-AI/lingtai/pull/616)），Discord 邀请在所有 README 变体中更新（[#642](https://github.com/Lingtai-AI/lingtai/pull/642)）。

## 为什么重要

运行多个智能体网络的操作者需要快速切换上下文并查看每个网络在做什么；`/projects` 切换器使其成为一次按键操作，并配有可一目了然掌握健康的实时 kanban 子集。邮件相关工作消除了长时间会话中积累的小摩擦——一个加载快、只渲染一次、显示诚实时间戳、且不会在过期异步结果下发生变更的邮箱。命名空间兼容 shim（#617）刻意做得很小：它让既有项目升级 TUI 时不必被强制同步切换到新的导入布局。

## 完整已合并 PR 清单

严格的 `v0.10.6..v0.10.7` 发布窗口包含 16 个已合并 PR：

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

## 发布窗口审计

- **范围：** `v0.10.6..v0.10.7`
- **提交：** 共 30 个（22 个非合并、8 个合并）
- **已合并 PR：** 16
- **人类贡献者：** [@huangzesen](https://github.com/huangzesen)
- **自动化：** `github-actions[bot]` 撰写三个每日 star 计数提交；自动化不计入人类作者。

## 验证

精确锁定的候选版本通过了发布门：

- Go vet 纯净
- 所有 TUI 与 Portal 测试通过
- 两个二进制 `lingtai-tui` 与 `lingtai-portal` 均以 `v0.10.7` 版本构建
- 审计六处 Discord 邀请出现，无残留旧链接
- 干净的候选 worktree、精确的 commit/tree 匹配，发布前无标签/版本冲突

## 安装与归档

标签触发的仓库工作流构建四个平台归档——macOS 与 Linux 的 `amd64` 与 `arm64`。每个归档均包含 `lingtai-tui` 与 `lingtai-portal`，并附带一个 SHA-256 文件。同一工作流在计算标签源归档校验和（`6bdde2c41a588cccdf54e32732f5c2c6a89df1c2279cde3f7cbca572d05f4dcf`）后更新受支持的 Homebrew tap。

已发布归档校验和：

| 归档 | SHA-256 |
| --- | --- |
| `lingtai-v0.10.7-darwin-amd64.tar.gz` | `7a73db9924edd3e6955cb69434a91c6b503cbf5f7c25a61a70b2503c2a74ead3` |
| `lingtai-v0.10.7-darwin-arm64.tar.gz` | `27d4d08236d9d00f47427c2a76f858b711d5c481d5eea84312e8575f50db0fac` |
| `lingtai-v0.10.7-linux-amd64.tar.gz` | `dd2374bdba4f146350fa3f50cfc5471429aaac1227b1abc5e9a09f6cd7e77ab8` |
| `lingtai-v0.10.7-linux-arm64.tar.gz` | `645feedc7a4e4ff9b8b8cc8f2b3d75d8dea24b8b7c627da37e5c7c2882c1bde0` |

### 透明说明：Intel-macOS 构建是手动恢复的

我们发布四个平台归档，但这一次它们并非全部从自动化 runner 上顺利产出。GitHub 正在退役发布工作流用于构建 Intel-macOS（`darwin-amd64`）归档所依赖的 `macos-13` Intel runner 镜像，该作业在本次发布运行中失败，而 Apple Silicon、Linux `amd64` 与 Linux `arm64` 作业均通过。我们没有只发三个平台，而是手动重建了 Intel-macOS 归档并上传，使四个归档齐全。手动恢复的 `lingtai-v0.10.7-darwin-amd64.tar.gz` 哈希恰为上表所列的 `7a73db99…`——手动构建的制品与发布意图字节级一致。Intel-macOS 用户获得真实、可校验的构建；手动步骤在此公开说明，而非藏在一个绿色对勾之后。

## 链接

- [Release — v0.10.7](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.7)
- [精确候选](https://github.com/Lingtai-AI/lingtai/commit/5fb554b69f966b39cb9eca32a70c84d628714d18)
- [对比 v0.10.6...v0.10.7](https://github.com/Lingtai-AI/lingtai/compare/v0.10.6...v0.10.7)
- [安装指南](https://github.com/Lingtai-AI/lingtai#installation)
