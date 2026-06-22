---
title: "Release notes：LingTai TUI v0.9.5 与 kernel v0.14.0"
date: 2026-06-22
tags: [tech, devlog]
lang: zh
description: "一次关于「诚实」与「延迟」的 release：kernel 向 Codex 发送真实的 metadata 与操作者自己的账号 header，记录一个 turn 的时间究竟花在哪里，并能从卡住的 turn 中恢复；TUI 启动更快、通知渲染更完整。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI <strong>v0.9.5</strong> 与 LingTai kernel <strong>v0.14.0</strong> 已发布。kernel 让 Codex 集成更诚实、更可观测——准确的请求 metadata、操作者自己的 ChatGPT 账号 header，以及端到端的 LLM 延迟遥测——同时加固了 turn 的恢复能力。TUI 则获得更快的启动路径与更完整、更易读的通知。
</div>

这次 release 的主题，是说真话，并测量代价。

上一轮让 tool-result metadata 变得可见；这一轮把同一面镜子转向运行时自身的行为：它告诉后端关于自己的什么信息，以及一个 turn 的每个阶段实际花了多久。少一点猜测，多一点测量。

## 发生了什么变化

### TUI / Portal v0.9.5

- 启动更快：authoritative session rebuild 被移出启动路径，session cache 现在是并发安全的，延迟重建不会再和 UI 抢资源。
- `/daemons` 改为按需懒加载 run detail；token-ledger 读取改为流式，而不是把整个 JSONL 文件读进内存。
- 通知快照现在渲染完整的 meta envelope 与 markdown block，可滚动，并在重启后保留。
- 初始 mail 视图在首次重建尚未完成时显示 `loading…` 横幅，而不是看起来空白。
- Codex thinking 默认值改为 `xhigh`，并提供 reasoning-effort 预设选项。
- setup 会保留 agent identity 与 legacy init-preset 字段；portal meta 卫生与 repo 忽略规则也做了收紧。

### Kernel v0.14.0

- agent 向 Codex 后端发送诚实的 metadata envelope，并在 Codex 请求上转发操作者自己的 `ChatGPT-Account-ID` header，让归属与账号路由准确。
- 新增 LLM 延迟遥测，记录 provider-wait 与各阶段耗时，让操作者能看清一个 turn 的时间究竟花在哪里。
- 长 tool result 现在会在 agent meta 中以「前 10 条预览列表 + 字符数」呈现；metadata 被收纳到 `_meta` 之下，并从 summarize 的大小计算中排除，因此不再扭曲 context 预算。
- 持久 tool result 会在 heal 之前被重放；被卡住的 worker 毒化的 turn（`WorkerStillRunning`）现在能恢复，而不是整个卡死。
- legacy molt-pressure 配置被忽略；molt pressure 移入 agent meta。

## 为什么这重要

当一个 agent 连续运行数小时，有两个问题决定你是否信任它：*它在向外界声称关于自己的什么*，以及*时间花在了哪里*。这次 release 回答了两者。诚实的 metadata envelope 与转发的账号 header，让 Codex 看到的是「谁在调用」的真相；延迟遥测让一个「慢 turn」从直觉变成可测量的事实。而恢复方面的工作——持久重放、毒化恢复——让单个卡住的 turn 不会拖垮一整段长会话。

## 验证

Kernel v0.14.0 的验证：

- 完整 pytest：2635 passed，4 skipped；
- `python -m build` 产出 sdist 与 macOS arm64 wheel；
- 对两个产物执行 `twine check`（均 PASSED）；
- 从已发布 wheel 做 clean-venv 安装验证（`import lingtai → 0.14.0`）。

TUI/Portal v0.9.5 的验证：

- 对改动区域的针对性 TUI 测试；
- 完整 TUI Go 测试；
- Portal web 安装/构建（vite）；
- Portal Go 测试。

## Release 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.0>
- 运行时包源：<https://pypi.org/project/lingtai/0.14.0/>
- TUI release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.5>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>

对一般用户而言，LingTai 的托管项目环境仍是解析运行时包的常规方式。PyPI 页面是已发布的运行时包源与一个有用的验证点，而不是终端用户升级的主要路径。

## 方向

主题保持稳定：让运行时对自己诚实，并且可测量。延迟现在已被仪表化，下一步是根据它揭示的内容行动——削减慢阶段，让长任务既诚实又可恢复。
