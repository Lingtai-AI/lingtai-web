---
title: "Release notes：LingTai kernel v0.16.1 与 TUI/Portal v0.10.4"
date: 2026-07-03
tags: [tech, devlog]
lang: zh
description: "一次关于让 context 清理从反射动作变成有意识决策的 release：summary marker 现在有 pending/done 状态，rebuild 是显式的战术 apply 步骤，hard forced-rebuild boundary 是 1.0；TUI/Portal 则收紧启动、setup 与自更新路径。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai kernel <strong>v0.16.1</strong> 与 TUI/Portal <strong>v0.10.4</strong> 已发布。kernel 把 summarize/rebuild 语义变得显式：summary 会记录为 <code>pending</code>，<code>system(action="summarize", rebuild=true)</code> 是公开的战术 apply 路径，紧急 forced-rebuild 边界是 <strong>1.0</strong>，并且 runtime 会明确告诉 agent 不要循环 rebuild。TUI/Portal 这一侧则加固启动与 replay，加入 <code>/update-tui</code> 自更新命令，收紧 setup/config 行为，并完成 Homebrew release hygiene。
</div>

这次窗口的主题，是抵抗「清理一下」的反射动作。

长时间运行的 agent 应该 summarize 嘈杂结果，但不应该因为存在一个 summary 就立刻 rebuild provider context。v0.16.1 把这个区别变成可见的状态机：现在先保存精华，等 context 真的高了、或 fresh context 确实值得 cache-miss 成本时，再 apply。与此同时，驾驶舱侧也把启动、更新、setup 默认行为做得更安全。

## 发生了什么变化

### Kernel v0.16.1

- **Summary marker 有状态。** Summary marker 现在明确经过 `status: pending` 与 `status: done`，pending totals 由状态计算，而不是扫描所有历史 marker (#692)。
- **Rebuild 是公开 boolean，不是隐藏 mode。** 公开 API 现在是 `system(action="summarize", rebuild=true)`。公开的 `rebuild_only` / `dry_run` wording 被移除；内部 epoch label 只保留在 runtime reconstruction metadata 中 (#692)。
- **Hard boundary 真正 hard。** runtime forced-rebuild 边界是 context window 的 1.0。它会在此时应用 pending summaries；即使没有 pending summary，也会跑 fresh replay，以便释放 agent meta、notifications、已清除 surfaces 等 transient context (#692)。
- **提示词阻止 rebuild 循环。** summarize-only 结果会说明 active provider context 可能仍含旧 raw result；rebuild 结果会说明应用了什么，并提示如果 rebuilt context 仍高于 0.6 recovery target，就应该 molt，而不是反复 rebuild (#692)。
- **Runtime 可靠性补强。** 同一窗口还落地了 compact stable daemon IDs、streamed tool-call fallback logging、JSONL close-race guard、empty-response usage handling、token accounting restore、token scope/layout 修正、refresh rebuild opt-in、atomic chat-history writes，以及 AED/inquiry/logger 清理 (#693, #691, #689, #688, #683, #682, #679, #684, #651, #656, #666, #665)。
- **Addon 与安全更新。** Telegram dynamic slash command 文档、WeChat 文件名净化、email schedule 文档清理、gitignore/secrets 防护、nirvana lifecycle signal、preset default persistence、runtime venv marker，以及 NoKV workbench MCP 示例/metadata validation 也在本窗口内发布 (#686, #646, #687, #628, #629, #647, #685, #637)。

### TUI / Portal v0.10.4

- **Portal startup 与 replay 清理。** Portal startup timeout cleanup、共享 replay-cache writer、以及 `rehydrateDone` guard 减少了 deadlock 与启动边缘问题 (#530, #521, #519)。
- **自更新与 refresh 路径。** TUI 增加 `/update-tui` 自更新命令，startup 期间 utility refresh 变成显式行为 (#500, #525)。
- **Setup 与 config 加固。** setup credential 的 Esc 行为会正确回到 setup，`config.json` 权限收紧到 `0600`，runtime venv environment-marker check 让 dev/runtime 状态更清楚 (#499, #514, #528)。
- **UI 与文档 polish。** verbose toggle 后 chat 保持贴底，删除 dead setup route，使用 canonical recipe preview resolver，更新 release docs，并在 release commit 中规范化 stars CSV whitespace (#469, #522, #523, #524)。

## 为什么这重要

Summarization 和 rebuilding 是两件成本不同的事。Summarization 是本地记忆决策：保存重要事实，不再把 raw text 当作一等 context 背着走。Rebuild 是 provider-context 决策：付出一次 cache-miss 成本，让 pending summary 现在生效。如果 runtime 把二者混成一个模糊提醒，agent 很容易把 rebuild 当成 cleanup reflex。现在 runtime 命名了状态与阈值，agent 就能等待。

这是这个 release 的核心设计选择。v0.16.1 对 agent 说：pending summary 是正常状态；在 0.75 hint 或 fresh context 值得时再战术性 rebuild；如果 1.0 emergency path 触发，就把它当 emergency path；如果 rebuilt context 仍高于 0.6，就停止循环 rebuild，转向 molt。结果是更少 context 抖动，也更少昂贵的反射动作。

TUI/Portal 侧也沿着同一种品味：从启动、setup、update 路径里移除隐藏陷阱。一个能干净启动、显式更新、用更严格权限保存 config 的驾驶舱，才能承接 runtime 的新纪律。

## 贡献者口径

下面的 public contributor set 来自严格 release window：kernel `v0.16.0..v0.16.1` 与 TUI/Portal `v0.10.3..v0.10.4`。审计使用 commit author、窗口内 PR 的 author/review/comment 证据，以及 GitHub issue author 证据。被拒绝、被关闭、未合并的 PR/issue 作者，只要参与了这个 release window，也要计入公开贡献者；贡献不要求对应工作最终 shipped。AI/模型名不进入公开 contributors。

本 release window 的公开 contributors：`huangzesen`, `BrianLiubr`, `TZZheng`, `ZigongXu`, `BatalloLu`, `wchwawa`, `Thibaultjaigu`, `rawpaper123`, `9s5bz2jvd2-lang`。

## 验证与 release hygiene

Kernel v0.16.1 来自 clean release worktree 的 gates：

- `git diff --check v0.16.0...HEAD` 通过；
- `python -m compileall -q src tests` 通过；
- focused pytest set 通过：`400 passed in 20.36s`；
- `python -m build` 生成 `lingtai-0.16.1.tar.gz` 与 `lingtai-0.16.1-cp312-cp312-macosx_11_0_arm64.whl`；
- `python -m twine check dist/*` 通过；
- PyPI JSON 验证确认 <https://pypi.org/project/lingtai/0.16.1/> 与两个上传文件。

TUI/Portal v0.10.4 来自 clean release worktree 的 gates：

- stars CSV normalization 后，`git diff --check v0.10.3...HEAD` 通过；
- `cd tui && go test -count=1 ./...` 通过；
- `cd portal/web && npm ci && npm run build` 通过（npm audit 仍报告 4 个既有 advisory）；
- `cd portal && go test -count=1 ./...` 通过；
- `cd tui && make clean && make build && ./bin/lingtai-tui version` 通过；
- `cd portal && make clean && make build && ./bin/lingtai-portal version` 通过。

Homebrew release hygiene：

- TUI v0.10.4 tarball SHA256：`cc5622562d98ed21449df62425547af4bfabeaf6642090ea85d2702a88c61d68`；
- Homebrew tap 更新到 v0.10.4，随后清理 formula style，使 `brew audit --formula --strict --online lingtai-ai/lingtai/lingtai-tui` 通过；
- `brew fetch --force --formula lingtai-ai/lingtai/lingtai-tui` 通过，且没有改变本机 dev PATH。

## 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.1>
- TUI/Portal release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.4>
- 运行时包源（PyPI）：<https://pypi.org/project/lingtai/0.16.1/>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>
- Kernel compare：<https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.16.0...v0.16.1>
- TUI compare：<https://github.com/Lingtai-AI/lingtai/compare/v0.10.3...v0.10.4>
- 上一篇 release log：<https://lingtai.ai/zh/releases/20260701-1/>

对一般用户而言，LingTai 的托管项目环境仍是解析 runtime package 的常规方式。PyPI 页面是已发布 runtime package source 与一个有用的验证点，而不是终端用户升级的主要路径。

## 方向

runtime 现在对一个细微问题有了更干净的回答：agent 什么时候应该继续工作，什么时候应该付出 fresh context 的成本？答案不再是「只要有 summary 就 rebuild」。答案是：保存精华，等待阈值或真实需求；当反复 rebuild 只是在掩盖真正压力时，就 molt。
