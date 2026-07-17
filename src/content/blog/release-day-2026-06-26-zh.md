---
title: "Release notes：LingTai TUI/Portal v0.10.0 与 kernel v0.15.0"
date: 2026-06-26
tags: [tech, devlog]
lang: zh
description: "一次以遥测为先的 release：home 视图与按轮的 API-call 底栏现在显示一个会话的 token 花在哪里，背后还有一轮聚焦的文案与布局打磨。kernel 让 bash 结果报告内层失败，把 refresh-watcher 事件经由密钥脱敏器写出，用 SQLite 索引 token ledger 并带显式 scope，为每次 daemon run 写出 artifact manifest，在源码漂移时提醒，并微调了 Codex summarize 引导。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI/Portal <strong>v0.10.0</strong> 与 LingTai kernel <strong>v0.15.0</strong>。主角是「落在操作者本就会看的地方」的遥测：API-call 底栏里的按轮 token 用量，以及 home 视图里的当前会话 token 行与一个紧凑的 context 百分比条——背后跟着一轮聚焦的文案与布局打磨：保留底栏、修正行、并让状态提示双语且正确。kernel 让完成的 <code>bash</code> 命令说出它的内层命令是否真的成功，把 refresh-watcher 的事件日志经由密钥脱敏器写出，用 SQLite 索引 token ledger 并带显式的报告 scope，为每次 daemon run 写出 <code>artifacts.json</code>，在磁盘源码与运行时漂移时提醒 agent，并把 Codex summarize 引导重新表述为一个带调好阈值的投资比率。两个版本都从干净的 release worktree 完成验证；tag、GitHub Releases、PyPI 上传与 Homebrew bump 在 publish 步骤中切出。
</div>

这次 release 只关于一件事：让座舱对「一个会话把 token 花在哪里」保持诚实。

上一轮让运行时变得「复数」——多个 Codex 身份，一支 fleet——并把原始调用日志变成趋势报告。这一轮把那份可读性带进默认视图，让操作者不用先打开报告，就能注意到一个正在悄悄烧预算的会话。

## 发生了什么变化

### TUI / Portal v0.10.0

- token 遥测就在调用旁边：API-call 分组底栏显示当前轮用量——input、cache miss、output、cache rate——home 视图底部一行显示当前会话 token 遥测与一个紧凑的 context 百分比条（#441）。
- 更安静的回放：Ctrl+O 默认隐藏臃肿的 `_meta` 信封，并在需要完整 metadata 时指向 `/notification`（#440）。
- 把遥测文案与布局打磨清楚（#442–#447）：显示 session 遥测时保留底栏（#442）；session 遥测不再需要 Ctrl+O（#443）；修正 home 遥测 context 行布局（#444）；清理 home 状态提示与中文遥测文案（#445）；状态提示改正为「expand」（#446）并随后本地化（#447，候选 head）。
- 更丰富的会话可观测性：session/kanban 详情面板显示更多缓存的按会话统计——API 调用统计、展开的 token 拆分、agent 路径——并以 molt 窗口为键，使 refresh 不再漂移（#428、#430、#432、#433、#438、#439）。
- 更快的会话加载：会话事件从 SQLite 索引加载，而不是重新扫描事件文件（#435）。
- markdown front matter：markdown 查看器渲染 YAML front matter（`name` / `description` / `version`），而不是悄悄把它剥掉（#426）。
- `list` 命令呈现可用 companion，新手工作手册被重写，dev-guide 检查确认重建的 TUI 二进制确实落到 `PATH` 上（#421、#423、#425、#427）。

### Kernel v0.15.0

- bash 结果保真：完成的命令携带附加的、模型可见的 `ok` / `command_status` / `warning` 字段，使非零内层退出或 Python traceback 不再藏在 `status: ok` 之下；`status` 为兼容保留旧含义（#493）。
- 密钥脱敏加固：relaunch/refresh watcher 子进程把 `events.jsonl` 写入经由 kernel 脱敏器（key-aware、fail-open，并带可诊断的 `redaction_unavailable` 标记），堵住一个独立进程的泄露路径（#491、#492 系列）。
- SQLite 中的 token ledger，带 scope：`sum_token_ledger` 新增显式 `scope`——`main_agent` 排除 daemon 行，`all` 包含它们——并记录与测试了 parent/child 重复计数语义（#503、#492）。
- daemon artifact manifest：每次 run 写出仅含 metadata 的 `artifacts.json`，使 `daemon(action="check")` 无需扫描 run directory 即可呈现 path、size、mtime 与 role，并为旧 run 提供安全回退（#499）。
- source-drift 提醒：启动时的运行时指纹（git HEAD + 源码摘要）写入 `.status.json`；当磁盘源码分叉时，agent 发出 `source_drift` 提醒，`lingtai-doctor` 也会报告——在 dev 运行时跳过（关闭 #178）。
- Codex summarize 引导：`adapter_comment` 现在报告 full/incremental 计数、`full_to_incremental_ratio`、`1:10` 目标与动态 `summarize_economy` 提示（#518）；随后微调了引导阈值（#519）——版本 bump 之前最新的功能改动。
- Codex transport 与 MCP/messaging：continuation 与 transport 解耦，session identity 感知 molt，endpoint pool 在 molt 边界轮换并可覆盖，WebSocket cache ledger 被暴露（#486、#495、#498、#502、#504、#517）；修复 Telegram 富格式与空 `chat_action` / `parse_mode` 处理，并抑制 WeChat 入站回放（#488、#496、#501、#508）。

## 为什么这很重要

看不见就无法削减。把按轮 token 代价与会话 context 放进默认视图——并让那一行在两种语言里都读得干净——正是把「我们在某处记录 token」变成「操作者注意到那个昂贵会话」的关键。在 kernel 一侧，同一个主题更深：一个承认内层命令失败的 `bash` 结果、一个说得清是否包含 daemon 的 token 总数、一个无法持久化密钥的事件日志、以及一个知道自己在跑陈旧源码的 agent，都是运行时拒绝在一个漫长、无人值守的会话里悄悄误导你。

## 验证

Kernel v0.15.0 在 bump commit `c365eec`（基于 `0797e93`）的干净 release worktree 上验证：

- `python -m compileall` 覆盖 `src` 与 `tests`（干净）；
- 完整 `pytest`：**2935 passed, 4 skipped**；
- `python -m build` 产出 sdist 与 wheel，`twine check` 两者均 PASSED；
- 相对 `origin/main` 的唯一 delta 是 `pyproject.toml` 版本 bump 到 `0.15.0`。

TUI/Portal v0.10.0 在候选 head `37be28b`（= `origin/main`；构建版本经由 `make ... VERSION=v0.10.0` 注入，无源码 bump）上验证：

- `git diff --check` 对比 v0.9.6，除已知生成文件 `docs/stars/stars.csv` 的 CRLF 注脚外干净；
- 完整 TUI 与 Portal Go 测试通过；
- `portal/web npm ci && npm run build` 通过（dev-only npm audit 警告已记录，不阻塞）；
- `make build` 产出 `lingtai-tui v0.10.0` 与 `lingtai-portal v0.10.0`。

关于工件：本地构建的 kernel wheel 带 macOS-arm64 平台标签，因此除非有意发布按平台的 wheel，PyPI 的工件应为可移植的 **sdist**。

## Release 链接

以下是 v0.10.0 / v0.15.0 的目标 tag；GitHub Releases、PyPI 上传与 Homebrew tap bump 在 publish 步骤中切出。

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.0>
- Runtime package source：<https://pypi.org/project/lingtai/0.15.0/>
- TUI/Portal release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.0>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>

对普通用户而言，LingTai 的 managed project environment 仍是解析 runtime package 的正常方式。PyPI 页面是已发布的 runtime package source 与一个有用的验证点，而不是普通用户的主要升级故事。

## 贡献者

@huangzesen（lead，scope 与验证负责人）、@ktwu01（TUI preset 重构）、@9s5bz2jvd2-lang（TUI 新手工作手册重写）、@TZZheng（kernel 运行时 source-drift 提醒与 MCP inbox 延迟诊断）。

本窗口因 issue 报告而推动落地或完成工作的报告者：@lin-du（kernel #301，已实现并以 PR #488「Expose Telegram rich formatting options」落地；#300 已 closed completed）与 @888yzbt888（TUI #401 preset bug，其中 Bug 1 由窗口内 kernel PR #479 修复；issue 已 closed completed）。

同样感谢 @BrianLiubr（TUI #429/#431）与 @xczics（TUI #437）在窗口内提交的 bug 报告——目前仍在 triage 中，此处作为报告致谢，尚未作为已发布的修复。

## 方向

主题不变：让运行时诚实、可度量，现在还要默认可读。当按会话的 token 代价摆在操作者面前、token ledger 可被 scope，下一步就是据此行动——削减命中不到 cache 的 turn，让座舱指向花得最多的那个会话。
