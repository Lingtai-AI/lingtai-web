---
title: "Release notes：LingTai kernel v0.16.0 与 TUI/Portal v0.10.3"
date: 2026-07-01
tags: [tech, devlog]
lang: zh
description: "一对把运行时缓存经济纳入显式预算的 release。kernel 新增 cache_miss_budget——一个 per-session、per-molt 的软上限，默认一百万 cache-miss token，触及时在持久 metadata 下重新盖上 molt-now 提示。soul flow 变为显式环境启用，token/meta 表面更精简也更可检视，TUI 内联显示 cache-miss token、教授 soul-flow 显式启用、暴露 model-visible summary 预览，并加入剪贴板图片粘贴。外加 Kimi 后端、claude-p 等待守护、Codex replay 自愈，与完整 release hygiene。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai kernel <strong>v0.16.0</strong> 与 TUI/Portal <strong>v0.10.3</strong> 把运行时的缓存经济与 context-pressure 信号纳入显式预算。kernel 新增 <code>cache_miss_budget</code>——一个 per-session、per-molt 的软上限，默认 <strong>1,000,000</strong> cache-miss token；触及后运行时会在持久的 context metadata 下重新盖上 <code>cache miss budget {budget} reached, molt now</code>，并附上正在累计的 cache-miss 计数。soul flow 变为通过 <code>LINGTAI_SOUL_FLOW_ENABLED</code> 的显式环境启用。token 与 meta 表面更精简也更可检视，TUI 内联显示 current-session cache-miss token、在 setup 与 kanban 中教授 soul-flow 的显式启用、暴露 model-visible 的 summary 预览，并加入剪贴板图片粘贴。两个版本都在发布前从干净的 release worktree 完成验证。
</div>

这个窗口的主题，是把一次长任务的成本变得可见、可消耗。cache miss 正是一个长期运行的 agent 悄悄烧钱与烧上下文的地方，而在此之前它是无形累计的。v0.16.0 把它变成一个预算：一个你能看着它倒数的软上限，用尽时附带一个持久的 `molt now` 提示。与之并行，soul flow 不再默认静默运行，运行时的 token 与 meta 表面更精简，座舱则如实浮现模型确切看到的内容。

## 发生了什么变化

### Kernel v0.16.0

- **cache-miss 预算。** `manifest.cache_miss_budget` 与 `AgentConfig.cache_miss_budget` 增加了一个 per-session、per-molt 的 cache-miss 软上限，默认 1,000,000 token。触及后，运行时会在 `_meta.tool_meta.context.molt` 下重新盖上 `cache miss budget {budget} reached, molt now`，并附上 `cache_miss_budget` 与 `cache_miss_tokens`（#641）。
- **诚实的 context-pressure 提醒。** 当前的 context-pressure 提醒现在存放在持久的 `_meta.tool_meta.context.molt`，而重建的一次性信息保留在 `_meta.tool_meta.reconstruction.molt`，使长期存在的 molt 提示不再与一次性重建混淆（#640、#638、#607）。
- **soul flow 显式启用。** soul flow 默认通过 `LINGTAI_SOUL_FLOW_ENABLED` 显式启用；未设置该标志时，`soul(action="flow")` 返回稳定的 disabled 结果（#639）。
- **更精简的 token/meta 表面。** 紧凑的扁平化 token 诊断、`tool_meta` 下的 current time、稀疏的 `agent_meta`、稀疏的 notification、`agent_meta` 中的大结果排序，以及 `bash`、`read`、`grep` 的 a-priori `summary=true` 支持（#608、#618、#620、#609、#586）。
- **daemon/runtime 后端。** 新增 Kimi Code 后端、claude-p 后台等待守护、显式 daemon email 工具浮现、常见 daemon MCP 补全、出站调用的 HTTP identity headers，以及 Codex 加密推理 replay 自愈，外加 backend/runtime/helper 重构（#634、#611、#584、#636、#633）。

### TUI / Portal v0.10.3

- **cache-miss 遥测。** mail/home 遥测在 token 总量之后立即显示 current-session cache-miss token，例如 `tok 1.1M (miss 8.6k)  cache …`（#498）。
- **座舱中的 soul-flow 显式启用。** setup 与 kanban 反映显式启用模型：未设置 `LINGTAI_SOUL_FLOW_ENABLED` 时 soul flow 默认关闭（#497）。
- **model-visible summary。** TUI 把 `summary=true` 工具结果作为 model-visible summary 呈现在原始工具输出之后，Ctrl+O / soul-mode 的工具调用预览暴露摘要后的 model-visible 结果并提供更长的 summary 预览（#477、#481、#480、#479）。
- **座舱打磨。** 聊天输入新增剪贴板图片粘贴支持，stamina 表面被移除，随包的 skill/anatomy/frontmatter metadata 得到刷新（#467、#478、#464–#459）。

## 为什么这重要

cache miss 是一次长任务的隐性成本——它同时烧钱与烧上下文，而一项无形的成本是没人会去管理的。把它变成一个带可见累计计数与持久 `molt now` 提示的预算，就让这项成本变得可消耗：操作者与 agent 都看着它累计，也都知道何时该 molt 而非继续付账。

同样的直觉贯穿本窗口其余部分。一个默认静默运行的强力行为，是一个迟早会发生的意外，于是 soul flow 变成带稳定 disabled 结果的显式标志——只在有人主动选择时才开启，座舱如实展示这个选择而不是去猜。而 agent 在精简、排序过的视图上比在一堵原始 meta 墙前推理得更好，于是 token 与 meta 表面被扁平化并削薄，同时 TUI 浮现模型确切看到的内容。更少的隐藏成本、更少的静默默认、更多可见的画面。

## 贡献者口径

第一次网站稿之后，我们按 LingTai release note 新要求重新审计了贡献者口径。release card 上的 contributor 列表覆盖两个仓库过去两个版本窗口：kernel `v0.15.2..v0.16.0` 与 TUI/Portal `v0.10.1..v0.10.3`。口径不只包括 release / commit 证据，也包括 PR 作者、PR 评论者 / reviewer、issue 作者与 issue 评论者；已经关闭、未合并或被拒绝但发生过讨论的 PR / issue 也计入。

这次审计扫描了 160 条 PR 记录与 128 条 issue 记录。本次 release entry 的公开 contributor 集合是：`huangzesen`, `TZZheng`, `ZigongXu`, `BrianLiubr`, `9s5bz2jvd2-lang`, `BatalloLu`, `houleixx`, `Keesan12`, `LinnkidChen`, `LuuOW`, `rawpaper123`, `wchwawa`, `xczics`, `github-actions[bot]`。

## 验证与 release hygiene

两个版本都在发布前从干净的 release worktree 完成验证。

本窗口的严格范围：

- Kernel `v0.15.3..v0.16.0`：88 个 commit（27 merge + 61 non-merge）、48 个 merged PR、283 个文件变更、+15,005/-6,365。
- TUI/Portal `v0.10.2..v0.10.3`：32 个 commit（12 merge + 20 non-merge）、14 个 merged PR、117 个文件变更、+2,904/-450。

Kernel v0.16.0 gate：

- 对比 v0.15.3 的 `git diff --check`（干净）；
- Dev-1/Dev-2/Dev-3 在 v0.15.3 之后的独立验证 gate，在清理 PR #642 之后 PASS；
- #642 之后的 dev-1 聚焦 suite：309 passed，1 个已知 warning；
- 从 PR #643 head 的完整 release validation：3,475 passed、4 skipped、1 个已知 warning；
- 从 merge commit 的最终 Python 3.11 build，两个工件均通过 `twine check`，干净的 no-deps wheel import smoke 通过（`import lingtai, lingtai_kernel`）；
- 工件哈希——wheel `c0b5f526…8588d`，sdist `22c7486c…2330`。

TUI/Portal v0.10.3 gate：

- `git diff --check`（干净）；
- `go test ./internal/tui ./internal/preset` 与 `tui/` 下的 `go test ./...` 通过；
- `npm --prefix portal/web ci` 与 `npm --prefix portal/web run build` 通过（audit 报告 4 个既有告警——1 low、2 moderate、1 high——build 通过）；portal module 测试通过 `(cd portal && go test ./...)`；
- Homebrew tap 自动化把 formula 更新到 v0.10.3（formula SHA256 `ee1043cc…fb7a71`；`brew info` 显示 stable 0.10.3），本地 operator 二进制经验证打印 `lingtai-tui v0.10.3`。

## 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.0>
- TUI/Portal release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.3>
- Runtime package source（PyPI）：<https://pypi.org/project/lingtai/0.16.0/>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>
- Kernel compare：<https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.15.3...v0.16.0>
- TUI compare：<https://github.com/Lingtai-AI/lingtai/compare/v0.10.2...v0.10.3>
- 上一份 release log：<https://lingtai.ai/en/releases/20260628-1/>

对普通用户而言，LingTai 的 managed project environment 仍是解析 runtime package 的正常方式。PyPI 页面是已发布的 runtime package source 与一个有用的验证点，而不是普通用户的主要升级故事。

## 方向

随着 cache miss 被纳入可见预算、soul flow 被置于显式标志之后，一个长期运行的 agent 与它的操作者都从对「这次运行在花什么、在做什么」更清晰的认识出发。下一步继续偿还同一笔债——把隐藏成本与静默默认，变成你能看见、能预算、能选择的东西。
