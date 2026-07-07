---
title: "发布日：Kernel v0.16.2 与 TUI/Portal v0.10.5"
date: 2026-07-07
tags: [tech, devlog]
lang: zh
description: "一次成对的 LingTai 补丁发布：更安全的迁移、受保护的 clean、原子配置写入，以及更清晰的 kernel 摘要/manual 契约。"
---

> **TL;DR** — 这次发布的目标是让长期运行的 LingTai 项目更不容易被破坏，也更容易被复盘。TUI/Portal v0.10.5 加固迁移、`lingtai clean` 和全局配置写入；Kernel v0.16.2 改进摘要/manual 契约、daemon/MCP 传播与持久消息上下文。普通用户升级仍以 Homebrew/TUI 路径为主；PyPI 0.16.2 是项目虚拟环境 runtime 包的来源与校验点。

## 发生了什么变化

### TUI/Portal v0.10.5

TUI 侧收口了 community issue sweep 中的三个可靠性问题：

- schema 关键迁移现在会明确失败，而不是在半应用状态下推进已存迁移版本；
- `lingtai clean` 在发现存活/可恢复 agent，或者 agent 探测本身失败时，会拒绝删除 `.lingtai/`，除非操作者显式使用 `--force`；
- 全局 `config.json`、`tui_config.json` 与 `.env` 写入改为 sibling-temp、fsync、rename、清理与权限保留的原子流程。

同时还包含一组面向操作者的细节改善：Codex 账号标签、pool 凭证 UI、first-run 与 recipe 错误暴露、preset load 原因保留、updater 已是最新版反馈、API call 分组、knowledge 条目刷新、异步 home telemetry、网络活动证据、Ctrl+End 跳到尾部覆盖，以及移除 Time Machine 自动启动路径。

### Kernel v0.16.2

kernel 侧继续补强长期运行 agent 所需的委托、摘要与通信契约：

- daemon / glob 结果纳入摘要流，并补上更清晰的 a-priori compression metadata 与文档；
- info/manual signpost action 拆开，让 runtime health 与 bundled manual 不再混在一起；
- prompt section contract、adapt-from-evidence 指引、retention-footprint report 与及时 transient `_meta` 过滤，减少陈旧或嘈杂上下文；
- Kimi native MCP config、父级 MCP 向 CLI backend 传播、Codex pool provider/preset 支持与外部 skill intake 文档，让委托任务更可复现；
- Telegram 持久通知/回复上下文与 LICC notification contract，降低跨消息面丢上下文的概率。

## 为什么重要

发布流程本身就是 LingTai 应该能承受的长任务：多仓库验证、委托草稿、平台发布、公开文案与最后校验。这个补丁发布修的也是同一类形状：状态变化要原子，清理要受保护，摘要要能保留证据而不把所有原始日志拖进后续上下文。

## 验证与发布卫生

验证从 clean worktree 执行。

- TUI diff check 通过；`docs/stars/stars.csv` 的 CRLF caveat 按 release workflow 保留不改。
- TUI targeted tests 通过；full TUI suite 在重跑已知 flaky `TestPortalURLTimeoutKillsChild` 后通过。
- Portal web build 与 Go tests 通过。
- TUI 与 Portal release build 均从候选 commit 构建成功。
- Kernel diff check、compileall 与 full pytest 通过（`3798 passed, 4 skipped`）。
- Kernel wheel/sdist build 与 `twine check` 通过。
- PyPI 上传成功：<https://pypi.org/project/lingtai/0.16.2/>。
- Homebrew formula v0.10.5 已发布，SHA256 为 `7510d443f59d8d571d8f4ab6431c10103fbc5fead03903fb6851f543c15b94ed`；Ruby 语法检查与 strict formula audit 通过。

## 链接

- TUI/Portal v0.10.5：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.5>
- Kernel v0.16.2：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.16.2>
- PyPI：<https://pypi.org/project/lingtai/0.16.2/>
- Homebrew formula：<https://github.com/Lingtai-AI/homebrew-lingtai/blob/main/lingtai-tui.rb>
