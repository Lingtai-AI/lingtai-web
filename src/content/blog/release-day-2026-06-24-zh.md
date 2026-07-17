---
title: "Release notes：LingTai TUI v0.9.6 与 kernel v0.14.2"
date: 2026-06-24
tags: [tech, devlog]
lang: zh
description: "一次关于「多账号」的 release：agent 与 preset 可以各自以自己的 Codex OAuth 身份登录，座舱把原始调用日志变成 tool-call 与 API-call 趋势报告，/doctor 变得可滚动，加载文案改为双语，默认 context 上限降到 250k，并修复了 daemon/bash 的 run-directory 边界情况。"
---

<div class="callout">
  <strong>TL;DR.</strong> LingTai TUI <strong>v0.9.6</strong> 与 LingTai kernel <strong>v0.14.2</strong> 已发布。主角是多账号 Codex：每个 agent 或 preset 都能指向自己的 OAuth token 文件，并配有对应的 setup UI。座舱也学会了报告调用花在哪里——tool-call 与 API-call 趋势、看板视图里的 cache-miss 细节——并获得可滚动的 <code>/doctor</code>、双语加载文案，以及更保守的 250k 默认 context 上限。kernel 修复了两处让长任务 daemon 误报自身状态的 run-directory 边界情况。
</div>

这次 release 的主题，是同时运行不止一个身份，看清不止一个数字。

上一轮让运行时对「自己是谁」和「一个 turn 花多久」保持诚实；这一轮让一支 fleet 可以同时是好几个「谁」——不同 agent 以不同 Codex 账号登录——并把调用日志变成你真正能读懂的东西。

## 发生了什么变化

### TUI / Portal v0.9.6

- 多 OAuth Codex：setup 新增 UI 与 preset 支持，让你选择某个 preset 使用哪个 Codex 身份，而不是手动改 token 路径（#415）。
- swiss-knife 趋势报告：新增脚本与 skill 产出 tool-call 与 API-call 趋势报告，脚本与 skill 的措辞保持一致（#414）。
- `/doctor` 变得可滚动并带分节标题，让冗长的诊断输出可以导航，而不是一整面文字墙（#413）。
- 加载文案改为双语且支持 i18n，让座舱在预热时也用操作者的语言说话（#412）。
- 默认 context/token 上限降到 250k——开箱即用时是更保守的工作预算，仍可按 setup 调高（#411）。
- 看板调用视图现在显示 cache-miss 细节，让「这个 turn 付了全价而不是命中 cache」出现在操作者本就会看的地方（#410）。

### Kernel v0.14.2

- 按 agent、按 preset 的 Codex OAuth token 文件：新增的 `manifest.llm.codex_auth_path` 让每个 agent 或 preset 指向自己的 Codex OAuth token，从而让多个 ChatGPT 账号并行运行；默认仍回退到共享路径（#484）。
- daemon 历史检查现在能在 refresh 或 molt 之后正确解析 run directory，使得跨 context 凝蜕的历史回看不再失效（#483）。
- bash 调用里空的 `working_dir` 现在被视为未设置，并回退到默认 agent 目录，而不是在一个含糊的路径上运行（#480）。

在这些功能之外，本窗口同样包含 release hygiene：kernel 更新命令改为 confirm-gated，一个具破坏性的全局 preset-split migration 被中和，使其不再能重写操作者的 preset，TUI release 版本比较现在被显式分类，release star CSV 也做了归一化。

## 为什么这重要

当一支 fleet 混用多个账号时，每个 agent 都需要以自己的身份认证；共用一个 token 会让归属与限流瞬间变成所有人的共同问题。按 preset 的 Codex 认证，把「这个 agent 用哪个账号」变成一个有意为之、可检查的选择。而看不见就无法调优——让 tool-call 趋势与 cache miss 变得可读，是削减它们的第一步。daemon 与 bash 的修复，瞄准的正是长会话最容易「丢失自己在哪里」的时刻：凝蜕之后，或某个字段被留空时。

## 验证

Kernel v0.14.2 的验证：

- 对 `src` 与 `tests` 执行 `python -m compileall`（通过）；
- 针对 daemon、bash、notification、preset、deep-refresh、tool-executor、openai、codex、provider、auth 等面的聚焦与扩展 pytest：513 passed；
- `python -m build` 产出 sdist 与 wheel，并对两者执行 `twine check`（均 PASSED）；
- PyPI 确认 `info.version = 0.14.2`。

TUI/Portal v0.9.6 的验证：

- 对 v0.9.5 执行 `git diff --check`（干净）；
- 完整 TUI Go 测试，以及 `make clean && make build`；
- Portal web `npm ci && npm run build`（npm audit 警告已记录，构建与测试通过）；
- 完整 Portal Go 测试，以及 `make clean && make build`；
- tag v0.9.6 的 Homebrew Release workflow 成功。

## Release 链接

- Kernel release：<https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.2>
- 运行时包源：<https://pypi.org/project/lingtai/0.14.2/>
- TUI release：<https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.6>
- Homebrew tap：<https://github.com/Lingtai-AI/homebrew-lingtai>

对一般用户而言，LingTai 的托管项目环境仍是解析运行时包的常规方式。PyPI 页面是已发布的运行时包源与一个有用的验证点，而不是终端用户升级的主要路径。

## 方向

主题保持稳定：让运行时诚实、可测量，现在又多了一项——可复数化。手握多个 Codex 身份与可读的调用趋势之后，下一步是根据它们揭示的内容行动——把工作路由到正确的账号，并削减那些 miss 掉 cache 的调用。
