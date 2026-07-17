---
title: "Release notes：LingTai TUI/Portal v0.10.2 与 kernel v0.15.3"
date: 2026-06-28
tags: [tech, devlog]
lang: zh
description: "一对让两条运行时契约变诚实的小 patch。生成、模板与示例 init.json 不再 seed legacy prompt 或空的 lingtai 字段——创建之后 character state 由 system/lingtai.md / psyche 拥有。kernel 让 context-pressure 信号更如实：延迟的 summarization 重建报告一次性证据，而持续的高 context 压力作为单独的 molt warning。外加系统提示 Markdown 目录、WeChat MCP 修复、grep/IMAP 人体工学，与 release hygiene。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI/Portal <strong>v0.10.2</strong> 与 LingTai kernel <strong>v0.15.3</strong> 是一对让两条运行时契约变诚实的小 patch release。生成、模板与示例 <code>init.json</code> 不再 seed legacy <code>prompt</code> 与空的 <code>lingtai</code> 字段——长生命周期的 character state 在创建之后由 <code>system/lingtai.md</code> / psyche 拥有，kernel 把缺失的 seed 视为合法的空 seed。kernel 也让 context-pressure 信号更如实：延迟的 summarization 重建报告一次性证据，而持续的高 context 压力作为 molt warning 单独浮现。两个版本都在发布前从干净的 release worktree 完成验证。
</div>

这是一个 patch 窗口，而不是一个新功能窗口。它的主题是诚实：运行时此前在两个地方说了一点点悄悄的谎，现在它们说真话了。生成的 `init.json` 不再 seed 运行时已不再认可的 character 字段，context-pressure 信号也不再把一次性的重建与持续的压力混为一谈。

## 发生了什么变化

### TUI / Portal v0.10.2

- 生成的 `init.json` 不再 seed character 字段：TUI 不再写入 legacy `prompt` / `lingtai` seed 字段，并附带一个回归测试，确保生成的 init JSON 不含 `prompt`、`prompt_file`、`lingtai`、`lingtai_file`（#458）。character state 在创建之后通过 `system/lingtai.md` / psyche 管理。
- ledger 保真：refresh 重建与 context 重建现在被标记在 call ledger 中，使 recent-call 视图能把重建与普通 API 调用区分开（#457、#455）。
- 座舱人体工学：恢复了更大的 mail page-size 默认值并在 mail 视图间复用 mail renderer（#454、#453），`ctrl-y` 选择模式现在全局可用并带显著指示（#452）。

### Kernel v0.15.3

- init prompt/character 契约被正式化：`prompt` 不是 legacy alias；缺失的 `lingtai` / `lingtai_file` 是合法的，表示空的初始 seed；deprecated 的 brief 字段被忽略（#550、#551、#552、#557）。长生命周期的 character state 通过 `system/lingtai.md` / psyche 管理。
- 感知重建的 context/molt metadata：延迟的 summarization 重建现在报告一次性证据，而持续的高 context 压力作为 molt warning 单独浮现（#556）。常驻 meta-guidance 排序与 prompt-layer 文档被收紧，延迟 summarize 的引导更精确（#542、#558）。
- 系统提示资源被重构为 Markdown 目录，related-file 行为更清晰，principle 层改为由 kernel 管理而非运行时注入（#555、#547、#549）。
- 集成与工具修复：WeChat MCP 配置路径解析与入站媒体按 magic bytes 校验（#554、#543）、grep 在读文件前裁剪 glob filter（#544）、更清晰的 IMAP 空参数人体工学与 flag 诊断（#548），以及事件日志上的 kernel runtime identity 戳（#540）。

## 为什么这重要

一个 seed 了运行时会忽略的字段的 `init.json`，是对「character state 住在哪里」的一种悄悄的谎言。把生成器、模板、示例与 schema 对齐，意味着一个新建 agent 从一个诚实的事实来源出发，而不是从陈旧的、从未被认可的 prompt 文本出发——并且 kernel 现在把缺失的 seed 当作合法的空 seed，而不是某种需要修复的东西。

在 context 一侧，一次重建事件与持续的 context 压力是两个不同的事实，需要不同的应对。把重建只报告一次、把持续压力单独浮现，能避免 agent 把一次性重建误读成长期的紧急状态。

## 验证

两个版本都从 `origin/main` 的干净 release worktree 验证。

本窗口的严格范围：

- TUI `v0.10.1..v0.10.2`：12 个 commit、38 个文件变更、+1612/-177。
- Kernel `v0.15.2..v0.15.3`：38 个 commit、99 个文件变更、+6331/-829。

Kernel v0.15.3 gate：

- 对比 v0.15.2 的 `git diff --check`（干净）；
- `python -m compileall` 覆盖 `src` 与 `tests`（干净）；
- 完整 `pytest` 通过；
- `python -m build` 产出 sdist 与 wheel，`twine check` 两者均 PASSED；
- release hygiene：init-schema 测试已与 v0.15.2 之后引入的可选 `lingtai` seed 契约对齐，包版本 bump 到 `0.15.3`。

TUI/Portal v0.10.2 gate：

- 对比 v0.10.1 的 `git diff --check`（干净）；
- `tui` 与 `portal` 的 `go test ./...` 通过；
- `portal/web npm ci && npm run build` 通过；
- `make build` 产出 `lingtai-tui v0.10.2` 与 `lingtai-portal v0.10.2`；
- release hygiene：规范化了 `docs/stars/stars.csv` 的空白，并把 Homebrew 安装检测测试与真实开发者机器的符号链接隔离。

## Release 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.3>
- Runtime package source：<https://pypi.org/project/lingtai/0.15.3/>
- TUI/Portal release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.2>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>

对普通用户而言，LingTai 的 managed project environment 仍是解析 runtime package 的正常方式。PyPI 页面是已发布的 runtime package source 与一个有用的验证点，而不是普通用户的主要升级故事。

## 方向

随着 init 契约从头到尾变诚实、重建信号与持续压力被分开，一个新建 agent 与一个长期运行的 agent 都从对自身状态更清晰的认识出发。下一步继续偿还同一笔债——让运行时报告的与实际为真的之间，少一些悄悄的谎。
