---
title: "Release notes：LingTai TUI/Portal v0.10.1 与 kernel v0.15.1"
date: 2026-06-27
tags: [tech, devlog]
lang: zh
description: "一次把「自我更新」补完的 patch：source / user-local 的 TUI 现在可以自我更新——手动地、也在启动时——补完上一轮 release 为 Homebrew 开的头。kernel 新增 claude-code LLM provider、一份带捆绑手册的 MCP manual sidecar 契约、降低状态写入风险的共享文件系统/JSON helper，以及对 spill/refresh 失败更诚实的可见性。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI/Portal <strong>v0.10.1</strong> 与 LingTai kernel <strong>v0.15.1</strong> 是补完 v0.10.0 / v0.15.0 的 patch release。主角：一个即使不是经由 Homebrew 安装也能自我更新的 TUI——手动 self-update 命令、source 安装的更新后端，以及当磁盘源码落后于已发布 TUI 时的启动提示（补完 issue #404）。kernel 新增 <code>claude-code</code> LLM provider、一份为 curated MCP 提供捆绑手册的 MCP manual sidecar 契约、降低 kernel 状态写入风险的共享 <code>_fsutil</code> 文件系统/JSON/JSONL helper、一次 session-recovery 重构，以及对 spill/refresh 失败更诚实的可见性。两个版本都从干净的 release worktree 完成验证；GitHub Releases、PyPI 上传与 Homebrew bump 现已发布。
</div>

这是一个 patch 窗口，而不是一个新功能窗口。上一轮 release 把 token 遥测带进了座舱的默认视图；这一轮收掉它留下的两个口子——让 *source* 的 TUI 像 Homebrew 的 TUI 那样能自我更新，并给 kernel 更安全的状态写入管道，外加一种把 Claude 订阅当作 LLM provider 来驱动的新方式。

主角是「自我更新」收尾。v0.10.0 教会了 Homebrew 的 TUI 自我更新；source 与 user-local 安装仍被搁浅在它们上次构建的那个二进制上。这一轮把同样的原地更新——手动地、也在启动时——带给那些安装，让 TUI 无论怎样落到磁盘上都能保持最新。在它背后，kernel 把更多状态写入经由共享且经过测试的 helper，并不再让 spill 与 refresh 的失败悄悄通过。

## 发生了什么变化

### TUI / Portal v0.10.1

- source / user-local 的 TUI 现在可以自我更新，为*非* Homebrew 管理的安装补完 issue #404：一个手动 self-update 命令（#416）、一个 source 安装的 self-update 后端（#417），以及当磁盘源码落后于已发布 TUI 时提供更新的启动提示（#418）。v0.10.0 发布了 Homebrew 更新后端；v0.10.1 把同一个故事带给 source 安装。
- 座舱打磨：mail 视图底栏的实时 agent 活动指示（#422）、mail 视图复制模式（#402），以及实时 `/viz` ghost-avatar 可见性修复（#354）。
- 一轮 doctor：保存一份脱敏的报告 bundle，带隐私提示与导出提示、安装方式检测，以及诊断分区布局的澄清（#406、#407、#409、#449、#450）。
- 可靠性：在继续之前等待 headless agent 就绪（#365），外加 dev-guide 的 release-workflow 文档与 README 安装方式输出（#448）。

### Kernel v0.15.1

- 一个新的 `claude-code` LLM provider：把 Claude 订阅经由 `claude` CLI 当作 LLM provider 来驱动（#525，最初由已 closed 的 PR #299 提出）。
- 一份带捆绑手册的 MCP manual sidecar 契约：记录在案的 sidecar 结构与最小契约（#529、#530）、为 curated MCP 提供的捆绑手册（#528），以及一份 Telegram 媒体引导手册（#526）。
- 更安全的 kernel 状态写入：共享的 `_fsutil` 文件系统 / JSON / JSONL helper（#510、#522），以及 `turn.py` 里 session-recovery / ToolExecutor helper 的合并，把 `_post_send_housekeeping` 重命名为 `_turn_boundary_housekeeping`（#511、#523）。
- 对 spill 与 refresh 更诚实的可见性：过期 spill 工件的消息（#192、#291）、refresh 永久失败的可见性（#292），以及一份 headless 运行时存活性证明（#351）。
- 更清晰的 Codex pre-molt summarize 引导（#531）。

## 为什么这很重要

一条只对 Homebrew 安装有效的 self-update 路径，会把 source 与 user-local 用户搁浅在陈旧的二进制上；补完 #404 意味着无论怎样安装，TUI 都能让自己保持最新，并在落后时告诉操作者。在 kernel 一侧，主题与 v0.15.0 相同——让运行时在长时间自治下保持诚实与安全。共享的文件系统 helper 减少了那些手写的、各自略有差异、可能被 fleet 写坏的状态写入；过去会悄悄通过的 spill 与 refresh 失败现在会浮现；而 `claude-code` provider 拓宽了操作者在不改动既有座舱的前提下支撑运行时的方式。

## 验证

两个版本都从 `origin/main` 的干净 release worktree 验证。

Kernel v0.15.1 在版本 bump commit `2d23801`（基于 `834ce8b`）上验证：

- `python -m compileall` 覆盖 `src` 与 `tests`（干净）；
- 完整 `pytest`：**3034 passing、4 skipped、0 个真实失败**——三个 subprocess-import「失败」被证明是本地环境工件（spawn 出的子进程不继承 `PYTHONPATH=src`，且包未在验证解释器里 pip 安装），用 `PYTHONPATH=src` 复查时全部转绿；
- `python -m build` 产出 sdist 与 wheel，`twine check` 两者均 PASSED；
- 相对 `origin/main` 的唯一 delta 是 `pyproject.toml` 单行版本从 `0.15.0` bump 到 `0.15.1`。

TUI/Portal v0.10.1 在候选 head `418e470`（构建版本经由 `make ... VERSION=v0.10.1` 注入，无源码 bump）上验证：

- `git diff --check` 对比 v0.10.0 干净；
- Portal web `npm ci && npm run build` 通过、Portal `go test ./...` 通过，`make build` 产出 TUI 与 Portal 二进制；
- 注脚、不阻塞：两个 `internal/config` 安装检测测试只在维护者机器上失败，因为 `/usr/local/bin` 与 `/opt/homebrew/bin` 下的本地 dev 符号链接被解析到 Homebrew prefix 之外；gate 把它归类为 host / 测试隔离的敏感性，而非 v0.10.1 运行时回归，并验证底层分类器在干净路径上正确返回 `homebrew`；
- release hygiene 注脚：`portal/web` 工具链报告 dev / 构建期的 `npm audit` 警告（`vite`、`launch-editor`、`js-yaml`）；实际打包的 portal 资产是静态的，因此这些不在运行时里。

关于工件：本地构建的 kernel wheel 带 macOS-arm64 平台标签，因此 PyPI 上的工件是可移植的 **sdist**。

## Release 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.1>
- Runtime package source：<https://pypi.org/project/lingtai/0.15.1/>
- TUI/Portal release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.1>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>

对普通用户而言，LingTai 的 managed project environment 仍是解析 runtime package 的正常方式。PyPI 页面是已发布的 runtime package source 与一个有用的验证点，而不是普通用户的主要升级故事。

## 贡献者

本次 6/27 patch 窗口的主要贡献者包括 @huangzesen（release lead，scope 与验证负责人）、@TZZheng（source self-update epic、doctor/install 工作，以及 kernel 的文件系统/recovery 重构）、@wchwawa（mail 视图实时 agent 活动指示），以及 @rawpaper123（headless 就绪与存活性可靠性修复）。

release window 内的 review 与来源贡献也计入名单：@LuuOW review 了 `/viz` ghost-avatar 修复；@zechenzhangAGI 在一个 closed kernel PR 中提出 `claude-code` provider，后由 #525 落地；@9s5bz2jvd2-lang 提交了 closed/unmerged 的 `/kanban` main/daemon API-call 拆分 PR #367，该 PR 在窗口内完成 review 与致谢后关闭。

上一轮 6/26 release 的相邻窗口 issue reporters 继续留在 6/26 贡献者名单中，不在这里重复计入。

## 方向

随着 self-update 在各种安装方式上补完、kernel 的状态写入经由共享且经过测试的 helper，运行时在长时间无人值守的会话下更稳。下一步建立在上一轮浮现出的遥测之上——据数字行动，并在不打扰操作者已熟悉的座舱的前提下持续拓宽 provider 选择。
