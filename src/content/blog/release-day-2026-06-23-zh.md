---
title: "Release notes：LingTai kernel v0.14.1"
date: 2026-06-23
tags: [tech, devlog]
lang: zh
description: "一次 Codex Responses 稳定性 release：持久 WebSocket 状态、更安全的 cache reset、诚实的 LingTai 身份，以及关于批量 summarize、避免反复打断 Codex cache 的运行时提醒。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai kernel <strong>v0.14.1</strong> 已发布。这次 release 稳定了 ChatGPT Codex Responses 集成：持久 WebSocket 复用、增量 <code>previous_response_id</code> 延续、冻结 tool output、fresh-epoch reset、诚实的 LingTai identity，以及一条更克制的运行时提醒——普通长结果应当攒几条一起 summarize，避免反复打断 Codex cache。
</div>

一句话：LingTai 现在更会保持 Codex 对话的热状态，也更知道什么时候该重新开始。

上一版让集成更可观测；这一版关注每个 Codex turn 背后的状态链：什么时候可以安全延续，什么时候必须完整重建，以及怎样避免自己无意中连续重置它。

## 发生了什么变化

### Codex Responses 的 WebSocket 延续

LingTai 现在为 ChatGPT Codex Responses 保持一条持久 WebSocket 路径。只要本地 history 与远端 baseline 匹配，下一轮就可以发增量请求，而不是完整重放。在 token ledger 里，这会表现为：

- <code>ws_incremental</code>：继续现有远端 <code>previous_response_id</code> 链；
- <code>ws_full</code>：从本地 history 重建完整请求，并开启新的远端状态链。

这个区别很重要，因为 Codex cache 不只是“发送相同 prompt 文本”。它还依赖后端状态链知道上一轮 response 已经包含了什么。

### 更安全的 tool-output 处理

Tool output 现在会按 Codex 请求所使用的 baseline 冻结。这样，之后的本地变更不会悄悄改变一个增量 Codex 请求正在回复的内容。如果发现 mismatch，LingTai 可以退回完整请求，而不是继续建立在陈旧或不一致的远端状态上。

### 可以 fresh epoch，但要克制

LingTai 现在有两种方式开启新的 Codex epoch：

1. 到达配置间隔后的周期性 reset；
2. 本地 <code>system(action="summarize")</code> 成功后的立即 reset。

Fresh epoch 很有用：它可以把旧 metadata 或旧 frozen tool-output state 留在旧远端链里。但它也有代价：下一次 Codex 请求是 <code>ws_full</code>，不是 <code>ws_incremental</code>。如果你把五个长 tool result 一个一个 summarize，就可能连续制造五次破坏 cache 的 fresh epoch。

所以新的 runtime comment 直接把这件事说清楚：对 Codex 而言，不要在几轮之内把普通长结果逐条 summarize。先读完，判断哪些 raw payload 不再需要，再把几个 finished results 一起 summarize。其他 provider 对这个 <code>previous_response_id</code> 边界没有这么敏感。

### 默认身份是诚实的 LingTai

早期协议实验中，我们把 LingTai 请求与官方 Codex CLI 请求形状做过对比。这个实验路径仍保留为本地显式开关，但发布默认值是清楚且诚实的：

- <code>originator: lingtai</code>
- <code>User-Agent: LingTai/&lt;version&gt;</code>

官方 CLI 形状只作为 opt-in comparison switch 存在。这次 release 也同步更新了相关 comments、tests 与 ANATOMY，避免文档继续把旧实验描述成默认行为。

### 运行时与文档清理

这次还包含一些小但重要的清理：

- daemon 终态通知保留更可靠；
- 过大的 tool-result comment metadata 不再走错 context budget 路径；
- OpenAI/Codex ANATOMY citation 被刷新；
- base-agent、email、notification 的 ANATOMY line ranges 被修复；
- 本地 ANATOMY citation checker 通过 599 条引用，0 个问题。

## 验证

Kernel v0.14.1 的验证包括：

- 完整 pytest：<code>2715 passed, 4 skipped in 304.41s</code>；
- Codex adapter-comment 与 identity targeted tests：<code>42 passed</code>；
- <code>python -m build</code>；
- <code>python -m twine check dist/*</code>；
- artifact 检查：wheel 与 sdist 中 <code>__pycache__</code> / <code>.pyc</code> 条目均为 0；
- 自定义全量 ANATOMY citation check：599 checked，0 issues。

## Release 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.1>
- Runtime package source：<https://pypi.org/project/lingtai/0.14.1/>
- Release report：<https://github.com/Lingtai-AI/lingtai-kernel/tree/main/reports/kernel-release-v0.14.1-20260623>

## Artifact SHA-256

- <code>952be6499f75df3f83624276c3b9adb0ade8a8862f3f1f57575e0d9a148f7321</code> — <code>lingtai-0.14.1-cp312-cp312-macosx_11_0_arm64.whl</code>
- <code>9574b9a81f0deb673e71fa090ba925aa3f05f84c2dbf9ccafa040e1381e756a3</code> — <code>lingtai-0.14.1.tar.gz</code>
