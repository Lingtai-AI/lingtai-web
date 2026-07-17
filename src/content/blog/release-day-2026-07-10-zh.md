---
title: "发布日：Kernel v0.16.3 与 TUI/Portal v0.10.6"
date: 2026-07-10
tags: [tech, devlog]
lang: zh
description: "一次成对的 LingTai 发布：重组的工具包与术语表、一键安装脚本、单一来源化的提示指导、codex-pool 模型分类、后端知识子手册，以及一次符合 platlib 规范的 sidecar wheel 修复。"
---

> **TL;DR** — 这次发布重组了 kernel 对工具知识的拥有方式：每个内置工具现在位于自己的包目录中，配有 CONTRACT.md、EN/ZH/Wen 术语表文件和集中式术语校验器。Kernel #842 在系统提示中单一来源化重复的工具指导，在所测量的测试提示上每次调用节省约 2,975 token（测量范围注意事项见下文）。TUI 新增一键 GitHub-release 安装脚本、自定义 OpenAI wire 选择器、codex-pool 模型分类、邮箱搜索、会话工具调用统计和仅回环 portal 绑定。Kernel 为 9 个 daemon 后端添加了 flag-discovery 子手册、IMAP 附件文件名消毒、扩展凭证脱敏和 AED manifest 识别，并以 #847 收尾——一次让原生 lingtai-search-sidecar 平台 wheel 安装进 platlib 的打包修复。

## 发生了什么变化

### TUI/Portal v0.10.6

TUI 侧新增了一个一键 GitHub-release 安装脚本，从单条 `curl | bash` 命令启动 Go、Node、uv 和 venv 管理的 runtime。安装脚本加固了 WSL 和损坏 venv 的回退，为 portal 构建引导正确的 Go 工具链，并在预构建二进制不可用时回退到源码构建。

新座舱功能包括邮箱搜索和归档扫描（#610）、Details 面板中的会话工具调用统计（#611）、preset 编辑器中的自定义 OpenAI wire 选择器（#613），以及一个含 12 个子手册的 preset-skill 路由（#614），涵盖 Codex、Claude Agent SDK、DeepSeek、Gemini、Kimi、MiMo、MiniMax、NVIDIA、OpenRouter 和 Zhipu 提供商。

安全：portal 现在默认仅绑定回环地址，而非 0.0.0.0。Codex OAuth 凭证可以打标签，使多账户设置在登录 UI 中可区分。

其他修复：i18n 回退加固、list 和 purge 命令中空格路径保留、过时 Telegram demo 移除、init 示例与模板同步、工具描述 i18n 路径解析、GPT-5.6 preset 默认值、Homebrew formula 许可证对齐。

### Kernel v0.16.3

kernel 发布重组了工具所有权。Kernel #839 将 14 个工具包从分散位置（`lingtai/core`、`lingtai/capabilities`、`lingtai/intrinsics`）整合到统一的 `src/tools/` 命名空间中，每个工具配有 CONTRACT.md。Kernel #844 为每个工具包添加了按语言的术语表文件（glossary-en.md、glossary-zh.md、glossary-wen.md）、一个 `tools/i18n/` 目录（含 JSON 目录）和一个强制结构与跨语言键对等的 `glossary_validator.py`。

Kernel #842 通过引用术语表而非内联完整描述，在系统提示中单一来源化重复的工具指导。在所测量的测试提示上，这每次 API 调用节省约 2,975 token。**测量注意事项：**此数字来自特定的测试提示和模型配置；不能作为跨所有操作者配置和提示的通用净减量。

Kernel #843 添加自定义 OpenAI wire API 选择器。Kernel #841 按精确模型标识符分类 codex-pool 认证池。token 账本现在记录安全的认证元数据以便审计。

九个 daemon 后端 flag-discovery 子手册（#830–#837）记录了 Codex、OpenCode、claude-p、MiMo Code、内置 LingTai、Kimi Code、Qwen Code、Cursor 和 Oh-My-Pi 的确切标志、环境变量和发现流程。

本次发布以 kernel #847 收尾，这是一次打包修复：原生 lingtai-search-sidecar 平台 wheel 布局现在正确使用 platlib（而非 purelib），使 sidecar 安装到平台 wheel 应当安装的位置。Ubuntu、Intel macOS、ARM macOS 和 Windows wheel 作业外加一个独立 sdist，均在 wheels 工作流 run 29108219136 上通过。Intel 与 ARM macOS wheel 声明 10.12 / 11.0 部署目标下限，且一个无依赖的 sidecar 冒烟测试避开了无关的 PyAV/FFmpeg 依赖解析。这是对既有 Python wheel CI 运行器的修复——而非新的 Windows 产品或工具。

其他修复：写入磁盘前的 IMAP 附件文件名消毒（#770）、扩展凭证键名脱敏（#824）、AED manifest 字段识别（#825）、伪 agent 发件箱轮询优先级（#806）、重建上下文观察时机（#828）、prompt 相关文件运行时路径修复（#846）、anatomy 脚本迁移（#827）。

## 为什么重要

工具知识所有权是一项结构性投资。当贡献者可以在一个目录中找到一个工具的公开契约、本地化术语和术语表校验时，添加新语言或修改工具描述的成本就会降低。系统提示指导的单一来源化（#842）是第一个具体的收益，但测量范围很重要：-2,975 token 的节省对所使用的测试提示是真实的，但不是通用下限。

一键安装脚本消除了想在不手动管理 Homebrew、Go 和 Node 安装的情况下尝试 LingTai 的操作者面临的最大采用摩擦。仅回环 portal 绑定是一个本地优先工具的正确默认值。而把原生 sidecar 放进 platlib 的平台 wheel，决定了一次安装是能干净地 import，还是把文件悄悄放到了不该在的位置。

## 发布窗口审计

**本窗口代表的人类贡献者/作者：**@huangzesen、@TZZheng、@9s5bz2jvd2-lang（kernel #843 共同作者）、@BatalloLu、@wchwawa。自动化与平台身份（@github-actions[bot]、GitHub merge 提交者）以及 AI 共同作者（Claude Fable 5、Claude Opus 4.8）在下文单独记录，不计入人类作者。

**Commit 作者审计：**TUI/Portal v0.10.5..v0.10.6 包含 41 个 commit：30 个 @huangzesen、7 个 @TZZheng、3 个每日 star 更新 by @github-actions[bot]、1 个 @BatalloLu；其中 13 个 merge commit 由 GitHub 提交。Kernel v0.16.2..v0.16.3 包含 54 个 commit：48 个 @huangzesen、5 个 @TZZheng、1 个 @wchwawa。@9s5bz2jvd2-lang 是 kernel #843 的共同作者（该 commit 的作者是 @huangzesen），而非独立的 commit 计数作者。bot 与 GitHub merge 提交者属于自动化，仅在审计计数中记录。

**差异统计：**TUI/Portal：149 个文件变更，+7,573 / -1,007 行。Kernel：至 v0.16.3 标签为 396 个文件变更，+13,306 / -2,780 行（在 #847 sidecar wheel 修复新增 5 个文件、+809 / -71 之前，至候选提交为 392 个文件、+12,506 / -2,718 行）。

### Kernel 关闭的 PR（54 个 commit 中的重点）

- [lingtai-kernel#839](https://github.com/Lingtai-AI/lingtai-kernel/pull/839)（merged）— refactor(tools): consolidate built-in tools — @huangzesen
- [lingtai-kernel#844](https://github.com/Lingtai-AI/lingtai-kernel/pull/844)（merged）— feat(tools): move localized terms into package glossaries — @huangzesen。EN：0 新字符；ZH：+5,224 字符（+221.17%）；Wen：+5,106 字符（+212.66%）。这些是仅术语表文件的增量；EN 术语已存在于源码中。
- [lingtai-kernel#842](https://github.com/Lingtai-AI/lingtai-kernel/pull/842)（merged）— perf(llm): single-source tool guidance in the system prompt — @huangzesen。在验证测试提示上实测 -2,975 token；这是该特定提示上的 wire 节省，与 #844 术语表字符增量属于不同范围，且非通用净减量。
- [lingtai-kernel#843](https://github.com/Lingtai-AI/lingtai-kernel/pull/843)（merged）— feat(llm): add OpenAI wire API selector — @huangzesen（由 @9s5bz2jvd2-lang 共同作者）
- [lingtai-kernel#841](https://github.com/Lingtai-AI/lingtai-kernel/pull/841)（merged）— feat(codex): classify codex-pool auth pool by exact model — @huangzesen
- [lingtai-kernel#830](https://github.com/Lingtai-AI/lingtai-kernel/pull/830)–[#837](https://github.com/Lingtai-AI/lingtai-kernel/pull/837)（merged）— docs(daemon): 为 9 个后端添加 flag-discovery 子手册 — @huangzesen
- [lingtai-kernel#847](https://github.com/Lingtai-AI/lingtai-kernel/pull/847)（merged）— fix(packaging): make sidecar wheels platlib compliant — @huangzesen。Ubuntu/Intel-macOS/ARM-macOS/Windows wheel 作业 + 独立 sdist 在 run 29108219136 上通过；macOS 下限 10.12/11.0；无依赖 sidecar 冒烟测试。
- [lingtai-kernel#846](https://github.com/Lingtai-AI/lingtai-kernel/pull/846)（merged）— fix: prompt-related-files runtime path — @huangzesen
- [lingtai-kernel#770](https://github.com/Lingtai-AI/lingtai-kernel/pull/770)（merged）— fix: sanitize IMAP attachment filenames — @huangzesen
- [lingtai-kernel#824](https://github.com/Lingtai-AI/lingtai-kernel/pull/824)（merged）— fix(trace): redact additional credential key names — @huangzesen
- [lingtai-kernel#825](https://github.com/Lingtai-AI/lingtai-kernel/pull/825)（merged）— fix(init): recognize AED manifest fields — @huangzesen

### TUI/Portal 关闭的 PR（41 个 commit 中的重点）

- [lingtai#595](https://github.com/Lingtai-AI/lingtai/pull/595)（merged）— feat(install): add GitHub release one-shot installer — @huangzesen
- [lingtai#601](https://github.com/Lingtai-AI/lingtai/pull/601)–[#604](https://github.com/Lingtai-AI/lingtai/pull/604)（merged）— fix: installer venv hardening（uv、ensurepip、broken venv、portal builds）— @huangzesen
- [lingtai#613](https://github.com/Lingtai-AI/lingtai/pull/613)（merged）— feat(tui): add custom OpenAI wire selector — @huangzesen
- [lingtai#612](https://github.com/Lingtai-AI/lingtai/pull/612)（merged）— fix(tui): preserve and truthfully render model-classified codex pools — @huangzesen
- [lingtai#614](https://github.com/Lingtai-AI/lingtai/pull/614)（merged）— docs(preset): add lingtai-preset-skill router with 12 child manuals — @huangzesen
- [lingtai#610](https://github.com/Lingtai-AI/lingtai/pull/610)（merged）— feat(tui): add mailbox search and archive scanning — @huangzesen
- [lingtai#611](https://github.com/Lingtai-AI/lingtai/pull/611)（merged）— feat(tui): show session tool call stats in Details — @TZZheng
- [lingtai#609](https://github.com/Lingtai-AI/lingtai/pull/609)（merged）— feat: update Codex preset GPT-5.6 defaults — @TZZheng
- [lingtai#606](https://github.com/Lingtai-AI/lingtai/pull/606)（merged）— docs: make install.sh the README install path — @huangzesen
- TUI BatalloLu — feat(tui): allow labeling Codex OAuth credentials — @BatalloLu
- TUI fix/portal-loopback — fix(portal): bind to loopback by default — @TZZheng

## 验证与发布 hygiene

结构化归档条目和配套博客在一个干净的 lingtai-web 发布 worktree（分支 `release/20260710-1`，位于成对候选提交处）中准备。`npm ci && npm run build` 通过。发布窗口计数从实际仓库的 v0.10.5..v0.10.6 与 v0.16.2..v0.16.3 标签范围重新计算。未执行任何 push、deploy、tag、包发布、GitHub release 编辑或 config 变更。

## 链接

- TUI/Portal v0.10.6：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.6>
- Kernel v0.16.3：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.3>
- TUI/Portal compare：<https://github.com/Lingtai-AI/lingtai/compare/v0.10.5...v0.10.6>
- Kernel compare：<https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.16.2...v0.16.3>
- Kernel #839 tools consolidation：<https://github.com/Lingtai-AI/lingtai-kernel/pull/839>
- Kernel #844 tool glossaries：<https://github.com/Lingtai-AI/lingtai-kernel/pull/844>
- Kernel #842 single-source guidance：<https://github.com/Lingtai-AI/lingtai-kernel/pull/842>
- Kernel #847 sidecar wheel platlib repair：<https://github.com/Lingtai-AI/lingtai-kernel/pull/847>
- TUI #595 one-shot installer：<https://github.com/Lingtai-AI/lingtai/pull/595>
