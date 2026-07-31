---
title: "发布日：LingTai v0.19.0 / v0.12.0 — 一套协议、可见任务、唯一生命周期"
date: 2026-07-30
tags: [tech, devlog]
lang: zh
description: "LingTai Tool Protocol v2 统一面向模型的工具；Task Card 让长任务可见；规范的安装、更新与移除脚本为 POSIX、PowerShell 与公开网站提供唯一生命周期。"
---

> **协同发布** — [Kernel v0.19.0](https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.19.0) 与 [TUI/Portal v0.12.0](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.12.0) 作为一组配对版本发布。kernel 候选提交为 `a15453ff1e59181aec7cf70759b9821e569cecd7`；TUI/Portal 候选提交为 `fdbee4705554369bc4c2800927482a51a5114997`，并固定使用 kernel v0.19.0。

> **TL;DR** — 本次发布让 LingTai 更适合作为长期运行的系统。面向模型的工具统一到 LingTai Tool Protocol v2；Task Card 为长任务提供完整、可见的生命周期；安装、更新与移除脚本获得唯一规范源；渠道、通知、邮件与 TUI 的可靠性改进让失败更有界、更可观察。严格发布窗口横跨 kernel 与 TUI/Portal，共包含 **87 个提交与 78 个已合并 PR**。本次发布窗口共致谢 6 个账号，分为下文的“已合并 PR / 提交作者”与“补充的共同作者 / 问题诊断致谢”两类；另有一份更广的项目历史贡献者账号名单单独列出。

## 发生了什么变化

### 一套面向模型的工具协议，但不抹平真实所有权

LingTai Tool Protocol v2 用明确的 `action` + `input` 信封替代多套各自不同的调用形状。Web、email、system、daemon、Psyche、Telegram、IMAP、Feishu、WeChat、WhatsApp 与 Cloud Mail 现共享 ToolFamily 契约；每个集成仍保留自己的真实传输方式与副作用边界。

这个区别很重要。更小的语法应让工具更容易学习与组合，但不应把 Telegram 消息、文件系统邮件与生命周期操作伪装成具有相同运行语义。本次发布统一模型看到的界面，同时让传输失败、限流与重试状态更加明确。

### Task Card 让长任务从开始到退役都可见

kernel 现拥有声明式 Task Card 生产者，支持 `start`、`inspect`、`retry`、`stop` 与终态 `remove`。Telegram 保留传输层专属投影与自动组合；可编程 frame 仅控制任务状态和 active/inactive 意图。TUI/Portal 新增 `/taskcard`，操作者无需从聊天历史还原进度，即可直接打开当前产物。

它的实践契约很简单：值得跟踪的长任务应在 active 时保持真实；仅停止时保留最后状态；工作完成或放弃时明确移除。

### 安装、更新与移除拥有唯一规范源

`Lingtai-AI/lingtai` 仓库现统一拥有 POSIX 与 PowerShell 的完整生命周期。稳定入口 `install.sh` 与 `install.ps1` 覆盖安装和更新；规范的 fix、verify、dev 与移除子流程位于其后。公开网站只镜像上游精确字节，并在漂移时明确失败，不再维护独立 installer 分叉。

新的移除生命周期刻意保持保守。`remove.sh` 与 `remove.ps1` 只删除 receipt 明确拥有的安装状态，保留用户配置、secrets、presets、projects、auth 与共享工具，并支持第二次幂等执行。用户因此获得一套有文档的生命周期，而不是一个无边界的“清理”命令。

### 渠道、通知、邮件与操作界面以更诚实的方式工作

一轮广泛的可靠性改进修复了长期运行时最容易积累的小问题：

- Telegram 限流传播真实重试契约；WeChat 与 Cloud Mail 重试失败的唤醒投递；Feishu 保持 MCP stdio 仅承载协议；文件系统邮件轮询被切片，不再独占一个 turn。
- 并发 daemon 终态唤醒与合成通知调用保持 schema 合法；实时 SQLite 读取者可以看到当前数据，而不是旧连接视图。
- TUI 邮件会话侧栏获得更清晰的焦点、折叠、鼠标与当前行行为；凭证家族处理得到统一；频繁实时网络刷新不再重复扫描邮件历史。
- Windows latest-main 安装与替换进度更明确。本次发布的 Windows 产物只进行了交叉构建与哈希校验，**未执行，也不声称已经过测试**，符合明确的发布范围。

## 为什么重要

LingTai 不是一个只处理单次请求/响应的程序。它是一个长期存活、接收消息、运行工具、委派任务并积累记忆的网络。这些边界上的小不一致会随时间变得昂贵：随渠道变化的工具语法、永不退役的进度卡、静默漂移的 installer 副本，或看起来像“没有响应”的限流。

本次发布降低了这些长期成本：工具使用一套面向模型的协议；长任务拥有可见生命周期；产品安装拥有一个所有者；失败更接近真正拥有它的层。

## 发布窗口审计

- **Kernel 范围：** `v0.18.2..v0.19.0` — 56 个提交、49 个去重后的已合并 PR
- **TUI/Portal 范围：** `v0.11.8..v0.12.0` — 31 个提交、29 个去重后的已合并 PR
- **合计：** 87 个提交、78 个去重后的已合并 PR

PR 计数依据 squash-merge 标题（形如 `(#N)`）或 `Merge pull request #N`，不计提交正文中偶然出现的 `#N` 引用。

**本次严格窗口内已合并 PR / 提交作者：** [@huangzesen](https://github.com/huangzesen)、[@TZZheng](https://github.com/TZZheng)、[@BatalloLu](https://github.com/BatalloLu)、[@ZacharyHu0](https://github.com/ZacharyHu0)。

**补充的严格发布窗口致谢**，与上面的作者名单分开列出，避免把不是提交作者的人误标为作者：

- [@9s5bz2jvd2-lang](https://github.com/9s5bz2jvd2-lang)（王润远）— 在 kernel 提交 `ec87d382` / [PR #1019](https://github.com/Lingtai-AI/lingtai-kernel/pull/1019) 中被列为 `Co-authored-by`。
- [@ZigongXu](https://github.com/ZigongXu) — 提出 [issue #672](https://github.com/Lingtai-AI/lingtai-kernel/issues/672)，由窗口内 [PR #1094](https://github.com/Lingtai-AI/lingtai-kernel/pull/1094) 修复（`Fixes #672`）；以及提出 [issue #644](https://github.com/Lingtai-AI/lingtai-kernel/issues/644)，其诊断与窗口内 [PR #1099](https://github.com/Lingtai-AI/lingtai-kernel/pull/1099) 的修复一致。

以上两类合计，本次严格发布窗口共致谢 6 个账号。

完整变更清单可在下方两个 compare 页面查看；本文按用户可感知的契约组织工作，而不是重复粘贴 78 个 PR 标题。

## 项目历史贡献者账号（截至本次发布 tag）

上文四位是本次严格发布窗口内的已合并 PR / 提交作者，并非曾经帮助过这个项目的所有人。若统计所有从 kernel `v0.19.0` 或 TUI/Portal `v0.12.0` 可追溯到的、由真实 GitHub 账号（不含 bot）提交的历史，已发布历史共识别出：[@huangzesen](https://github.com/huangzesen)、[@TZZheng](https://github.com/TZZheng)、[@9s5bz2jvd2-lang](https://github.com/9s5bz2jvd2-lang)、[@wchwawa](https://github.com/wchwawa)、[@ZigongXu](https://github.com/ZigongXu)、[@BatalloLu](https://github.com/BatalloLu)、[@batallo](https://github.com/batallo)、[@BrianLiubr](https://github.com/BrianLiubr)、[@ZacharyHu0](https://github.com/ZacharyHu0)、[@rawpaper123](https://github.com/rawpaper123)、[@ktwu01](https://github.com/ktwu01)、[@yzliu03](https://github.com/yzliu03) 与 [@TatsuKo-Tsukimi](https://github.com/TatsuKo-Tsukimi)。

这是“截至本次发布 tag 的 GitHub 可识别贡献者账号”名单，不是对所有参与者的穷尽统计，其范围也比上文严格发布窗口内致谢的 6 个账号更广。不同 GitHub 账号在此保持各自独立列出，我们不会猜测哪些账号可能属于同一个人。例如，@BrianLiubr 提出的 [issue #496](https://github.com/Lingtai-AI/lingtai/issues/496) 由 PR #500 修复，而该 PR 已包含在更早的 `v0.11.8` tag 中，因此这个账号被列在此处，而非上文严格的 v0.12.0 窗口名单内。

## 验证与诚实边界

精确 kernel package workflow [run 30598196925](https://github.com/Lingtai-AI/lingtai-kernel/actions/runs/30598196925) 成功完成，产出 15 个 wheel、1 个 sdist fallback、严格 release manifest 与 `SHA256SUMS`。下载字节、manifest 与 sums 文件中的全部 package 哈希一致；`twine check` 通过；干净的 CPython 3.13.14 原生 wheel 与 CPython 3.14.6 sdist fallback 导入/版本 smoke 均通过。

kernel 文档治理检查验证了 305 份文档。终态 source-checkout 测试记录为 **7,239 passed、27 skipped**，另有 18 个已知 package-data/resource failure 或 error 节点。这 18 个节点是精确旧 baseline 的严格子集，**没有新增节点名称**；它们仍被如实记录为 inherited nonzero debt，而不是被描述成全套测试绿色。

TUI/Portal 原生与交叉构建通过，Portal 测试通过；除两个精确的 inherited cursor-panic 节点外，其余 TUI 测试均通过。两个节点在冻结 base 与发布候选上都复现相同的 `cursor.(*Model).Blink` nil panic。它们是公开保留的旧债，不是本次发布回归，也不被写成 PASS。

按照明确发布指令，本轮不包含 Windows 执行。Windows wheel 与 TUI bundle 路径只进行了交叉构建/哈希校验；没有启动任何 Windows 二进制。

## 安装与软件包

受支持的安装与升级入口仍为：

```bash
curl -fsSL https://lingtai.ai/install.sh | bash
```

Kernel v0.19.0 将同一组冻结的 wheel/sdist 字节发布到 PyPI、GitHub 与 Gitee。TUI/Portal v0.12.0 发布 GitHub 源码 Release、更新 Homebrew 配方，并生成绑定 kernel v0.19.0 的 Windows AMD64 bundle。现有 Homebrew 用户继续受到支持。

## 链接

- [Kernel Release — v0.19.0](https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.19.0)
- [TUI/Portal Release — v0.12.0](https://github.com/Lingtai-AI/lingtai/releases/tag/v0.12.0)
- [Kernel 对比 — v0.18.2...v0.19.0](https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.18.2...v0.19.0)
- [TUI/Portal 对比 — v0.11.8...v0.12.0](https://github.com/Lingtai-AI/lingtai/compare/v0.11.8...v0.12.0)
- [安装 LingTai](https://lingtai.ai/install.sh)
