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

## 发布窗口审计

按照 20260703-1 release log 的结构，这里补齐发布窗口内所有已关闭 issue 与 PR，不只列入最终合并进代码的项目。窗口从上一组 TUI/kernel 发布（v0.10.4 / v0.16.1）开始，到本次成对发布结束。

**发布窗口贡献者/作者：** @huangzesen、@TZZheng、@ZigongXu、@BrianLiubr、@888yzbt888、@9s5bz2jvd2-lang。

**Commit author 审计：** TUI/Portal v0.10.4..v0.10.5 有 45 个 commit：39 个 @huangzesen、2 个 @TZZheng、4 个 @github-actions[bot] 日常 stars 更新。Kernel v0.16.1..v0.16.2 有 51 个 commit：29 个 @9s5bz2jvd2-lang、20 个 @huangzesen、2 个 @TZZheng。贡献者名单列人类作者；bot 只在审计数字中说明。

### TUI/Portal 已关闭 PR（共 20 个：19 个合并，1 个未合并关闭）

- [lingtai#539](https://github.com/Lingtai-AI/lingtai/pull/539) (已合并) — docs: route issue reporting consent through issue-report skill — @huangzesen
- [lingtai#538](https://github.com/Lingtai-AI/lingtai/pull/538) (已合并) — Remove Time Machine — @huangzesen
- [lingtai#541](https://github.com/Lingtai-AI/lingtai/pull/541) (已合并) — docs: add YAML prompt section definitions — @huangzesen
- [lingtai#540](https://github.com/Lingtai-AI/lingtai/pull/540) (已合并) — Make home telemetry asynchronous — @huangzesen
- [lingtai#543](https://github.com/Lingtai-AI/lingtai/pull/543) (已合并) — Revert TUI prompt-section YAML definitions — @huangzesen
- [lingtai#542](https://github.com/Lingtai-AI/lingtai/pull/542) (已合并) — Expand TUI network activity evidence — @TZZheng
- [lingtai#547](https://github.com/Lingtai-AI/lingtai/pull/547) (已合并) — fix(tui): refresh knowledge view entries — @huangzesen
- [lingtai#545](https://github.com/Lingtai-AI/lingtai/pull/545) (已合并) — docs: mention issue report skill in tutorial skills catalog — @huangzesen
- [lingtai#544](https://github.com/Lingtai-AI/lingtai/pull/544) (已合并) — feat(setup): add Codex pool credentials UI — @huangzesen
- [lingtai#550](https://github.com/Lingtai-AI/lingtai/pull/550) (已合并) — fix(setup): label Codex OAuth accounts — @huangzesen
- [lingtai#556](https://github.com/Lingtai-AI/lingtai/pull/556) (已合并) — fix(update): skip TUI updater when already latest — @huangzesen
- [lingtai#557](https://github.com/Lingtai-AI/lingtai/pull/557) (已合并) — fix(preset): preserve load error causes — @huangzesen
- [lingtai#558](https://github.com/Lingtai-AI/lingtai/pull/558) (已合并) — test(tui): cover ctrl+o viewport anchoring — @huangzesen
- [lingtai#559](https://github.com/Lingtai-AI/lingtai/pull/559) (已合并) — fix(firstrun): surface API key save errors — @huangzesen
- [lingtai#555](https://github.com/Lingtai-AI/lingtai/pull/555) (已合并) — Add Ctrl+End chat tail jump — @TZZheng
- [lingtai#554](https://github.com/Lingtai-AI/lingtai/pull/554) (未合并关闭) — fix: skip brew update when TUI is already at latest version — @BrianLiubr
- [lingtai#560](https://github.com/Lingtai-AI/lingtai/pull/560) (已合并) — fix(tui): surface recipe reapply errors before launch — @huangzesen
- [lingtai#575](https://github.com/Lingtai-AI/lingtai/pull/575) (已合并) — fix(tui): show api call group separators — @huangzesen
- [lingtai#584](https://github.com/Lingtai-AI/lingtai/pull/584) (已合并) — fix: make codex account fallback filenames clearer — @huangzesen
- [lingtai#585](https://github.com/Lingtai-AI/lingtai/pull/585) (已合并) — fix: harden migrations, clean, and config writes — @huangzesen

### TUI/Portal 已关闭 issue（共 31 个）

- [lingtai#472](https://github.com/Lingtai-AI/lingtai/issues/472) — Issue-report protocol should support scoped standing authorizations — @ZigongXu
- [lingtai#546](https://github.com/Lingtai-AI/lingtai/issues/546) — /knowledge 命令在 agent 运行时写入 knowledge 后不显示新条目 — @huangzesen
- [lingtai#548](https://github.com/Lingtai-AI/lingtai/issues/548) — feat: system(start, address=xxx) API for parent agents to launch child agents — @888yzbt888
- [lingtai#552](https://github.com/Lingtai-AI/lingtai/issues/552) — bug: `/update-tui` runs `brew update` even when TUI is already at the latest version — @BrianLiubr
- [lingtai#483](https://github.com/Lingtai-AI/lingtai/issues/483) — Preset Load() collapses parse/permission errors into "not found" — @ZigongXu
- [lingtai#495](https://github.com/Lingtai-AI/lingtai/issues/495) — Add TestCtrlOAnchorToBottom regression test for ctrl+o anchor fix (PR #469 follow-up) — @BrianLiubr
- [lingtai#509](https://github.com/Lingtai-AI/lingtai/issues/509) — API key save error silently ignored in first-run wizard — @ZigongXu
- [lingtai#490](https://github.com/Lingtai-AI/lingtai/issues/490) — TUI: recipe re-apply errors are swallowed before agent launch — @ZigongXu
- [lingtai#494](https://github.com/Lingtai-AI/lingtai/issues/494) — TUI: agent init.json venv_path can redirect launcher to arbitrary interpreter — @ZigongXu
- [lingtai#511](https://github.com/Lingtai-AI/lingtai/issues/511) — API key materialized in temp file persists on crash (ctrl+e editor) — @ZigongXu
- [lingtai#513](https://github.com/Lingtai-AI/lingtai/issues/513) — Source installer uses curl|bash without checksum verification — @ZigongXu
- [lingtai#505](https://github.com/Lingtai-AI/lingtai/issues/505) — Batch LOW findings: migration system reliability improvements (3 items) — @ZigongXu
- [lingtai#518](https://github.com/Lingtai-AI/lingtai/issues/518) — Batch: Non-atomic writes and silently ignored errors across preset/ and fs/ packages — @ZigongXu
- [lingtai#485](https://github.com/Lingtai-AI/lingtai/issues/485) — Security: Portal binds 0.0.0.0 with CORS * and no authentication — exposes network topology and geolocation — @ZigongXu
- [lingtai#503](https://github.com/Lingtai-AI/lingtai/issues/503) — Migration system: no concurrency control — TUI and Portal can race on same project's migrations — @ZigongXu
- [lingtai#512](https://github.com/Lingtai-AI/lingtai/issues/512) — Batch LOW: 6 reliability issues in firstrun.go Update() function — @ZigongXu
- [lingtai#537](https://github.com/Lingtai-AI/lingtai/issues/537) — Portal: Batch reliability issues — topology race, TOCTOU, unbounded reads, ipinfo.io trust — @ZigongXu
- [lingtai#517](https://github.com/Lingtai-AI/lingtai/issues/517) — ResolveAddress has no path confinement — absolute paths and ../ escape baseDir — @ZigongXu
- [lingtai#484](https://github.com/Lingtai-AI/lingtai/issues/484) — Security: Postman UDP receiver — unauthenticated remote file write via msgID path traversal — @ZigongXu
- [lingtai#486](https://github.com/Lingtai-AI/lingtai/issues/486) — Security: recipe library_name path traversal can escape project root and poison skills.paths — @ZigongXu
- [lingtai#492](https://github.com/Lingtai-AI/lingtai/issues/492) — TUI: preset.Load accepts path traversal in preset name — @ZigongXu
- [lingtai#515](https://github.com/Lingtai-AI/lingtai/issues/515) — Path traversal via preset.Name in Save/Delete — unsanitized path component — @ZigongXu
- [lingtai#506](https://github.com/Lingtai-AI/lingtai/issues/506) — Security: First-run wizard agent directory name not validated — path traversal via dirInput — @ZigongXu
- [lingtai#532](https://github.com/Lingtai-AI/lingtai/issues/532) — Portal: ResolveAddress path traversal — absolute paths and ../ escape baseDir — @ZigongXu
- [lingtai#533](https://github.com/Lingtai-AI/lingtai/issues/533) — Portal: All file readers follow symlinks — TOCTOU and information disclosure — @ZigongXu
- [lingtai#534](https://github.com/Lingtai-AI/lingtai/issues/534) — Portal: Raw init.json fallback exposes API keys and secrets via API — @ZigongXu
- [lingtai#516](https://github.com/Lingtai-AI/lingtai/issues/516) — copyTree follows symlinks despite documentation claiming it skips them — @ZigongXu
- [lingtai#535](https://github.com/Lingtai-AI/lingtai/issues/535) — Portal: Error responses leak internal filesystem paths — @ZigongXu
- [lingtai#488](https://github.com/Lingtai-AI/lingtai/issues/488) — TUI: clean can delete .lingtai/ while agents are still alive — @ZigongXu
- [lingtai#502](https://github.com/Lingtai-AI/lingtai/issues/502) — Migration system: per-file errors silently swallowed in m028/m030/m035/m039 — partial failures silently bump version — @ZigongXu
- [lingtai#508](https://github.com/Lingtai-AI/lingtai/issues/508) — Non-atomic writes for config.json and .env — crash can corrupt API keys — @ZigongXu

### Kernel 已关闭 PR（共 26 个：20 个合并，6 个未合并关闭）

- [lingtai-kernel#694](https://github.com/Lingtai-AI/lingtai-kernel/pull/694) (未合并关闭) — fix: confine pad/email paths to working directory (#624) — @ZigongXu
- [lingtai-kernel#695](https://github.com/Lingtai-AI/lingtai-kernel/pull/695) (未合并关闭) — daemon: preflight required inputs before scheduling — @9s5bz2jvd2-lang
- [lingtai-kernel#696](https://github.com/Lingtai-AI/lingtai-kernel/pull/696) (已合并) — docs(prompts): add prompt section contracts — @huangzesen
- [lingtai-kernel#697](https://github.com/Lingtai-AI/lingtai-kernel/pull/697) (已合并) — feat(codex): add codex-pool provider — @huangzesen
- [lingtai-kernel#698](https://github.com/Lingtai-AI/lingtai-kernel/pull/698) (已合并) — fix(daemon): allow codex-pool presets — @huangzesen
- [lingtai-kernel#700](https://github.com/Lingtai-AI/lingtai-kernel/pull/700) (已合并) — feat: add Telegram notification persistent context — @huangzesen
- [lingtai-kernel#704](https://github.com/Lingtai-AI/lingtai-kernel/pull/704) (已合并) — feat: annotate Telegram persistent context — @huangzesen
- [lingtai-kernel#705](https://github.com/Lingtai-AI/lingtai-kernel/pull/705) (已合并) — fix: trim telegram transient notification hook — @huangzesen
- [lingtai-kernel#706](https://github.com/Lingtai-AI/lingtai-kernel/pull/706) (已合并) — docs: add LICC notification contract — @huangzesen
- [lingtai-kernel#701](https://github.com/Lingtai-AI/lingtai-kernel/pull/701) (未合并关闭) — fix(daemon): expose Codex auth lane in quota diagnostics — @9s5bz2jvd2-lang
- [lingtai-kernel#707](https://github.com/Lingtai-AI/lingtai-kernel/pull/707) (已合并) — Move email notification context to persistent lane — @huangzesen
- [lingtai-kernel#721](https://github.com/Lingtai-AI/lingtai-kernel/pull/721) (已合并) — fix(notifications): move curated IM context to persistent lane — @huangzesen
- [lingtai-kernel#789](https://github.com/Lingtai-AI/lingtai-kernel/pull/789) (已合并) — docs(skills): document external skill intake — @huangzesen
- [lingtai-kernel#719](https://github.com/Lingtai-AI/lingtai-kernel/pull/719) (未合并关闭) — docs(notifications): document persistent Telegram/email hooks — @huangzesen
- [lingtai-kernel#720](https://github.com/Lingtai-AI/lingtai-kernel/pull/720) (未合并关闭) — fix(notifications): move WhatsApp context to persistent lane — @huangzesen
- [lingtai-kernel#722](https://github.com/Lingtai-AI/lingtai-kernel/pull/722) (未合并关闭) — fix(notifications): move Feishu context to persistent lane — @huangzesen
- [lingtai-kernel#790](https://github.com/Lingtai-AI/lingtai-kernel/pull/790) (已合并) — fix(daemon): propagate parent MCPs to CLI backends — @huangzesen
- [lingtai-kernel#791](https://github.com/Lingtai-AI/lingtai-kernel/pull/791) (已合并) — docs(daemon): add architecture capability contract — @huangzesen
- [lingtai-kernel#792](https://github.com/Lingtai-AI/lingtai-kernel/pull/792) (已合并) — fix(daemon): mount Kimi MCP config natively — @huangzesen
- [lingtai-kernel#793](https://github.com/Lingtai-AI/lingtai-kernel/pull/793) (已合并) — Report high-footprint retention categories — @TZZheng
- [lingtai-kernel#795](https://github.com/Lingtai-AI/lingtai-kernel/pull/795) (已合并) — docs(prompt): prefer a priori tool summaries — @huangzesen
- [lingtai-kernel#799](https://github.com/Lingtai-AI/lingtai-kernel/pull/799) (已合并) — feat(summary): report a-priori compression effect — @huangzesen
- [lingtai-kernel#797](https://github.com/Lingtai-AI/lingtai-kernel/pull/797) (已合并) — feat(tools): split info and manual signpost actions — @huangzesen
- [lingtai-kernel#796](https://github.com/Lingtai-AI/lingtai-kernel/pull/796) (已合并) — feat(tools): allow summaries for daemon and glob — @huangzesen
- [lingtai-kernel#800](https://github.com/Lingtai-AI/lingtai-kernel/pull/800) (已合并) — fix: share timely transient meta serialization — @huangzesen
- [lingtai-kernel#801](https://github.com/Lingtai-AI/lingtai-kernel/pull/801) (已合并) — docs(prompts): add adapt-from-evidence principle — @huangzesen

### Kernel 已关闭 issue（共 15 个）

- [lingtai-kernel#625](https://github.com/Lingtai-AI/lingtai-kernel/issues/625) — Security: Agent can self-escalate to karma/nirvana by editing own init.json — @ZigongXu
- [lingtai-kernel#590](https://github.com/Lingtai-AI/lingtai-kernel/issues/590) — docs(i18n): molt recovery note says 'Check email' while sibling strings use generic 'inbox' — @ZigongXu
- [lingtai-kernel#596](https://github.com/Lingtai-AI/lingtai-kernel/issues/596) — docs(i18n): system.stuck_revive message says 'You called: {tool_calls}' but fills it with error description — @ZigongXu
- [lingtai-kernel#598](https://github.com/Lingtai-AI/lingtai-kernel/issues/598) — enhancement(skills): skills info returns full manual body + health snapshot while knowledge info returns health only — @ZigongXu
- [lingtai-kernel#676](https://github.com/Lingtai-AI/lingtai-kernel/issues/676) — MailService has no resource limits: no cap on message size, attachment count, or attachment size — @ZigongXu
- [lingtai-kernel#677](https://github.com/Lingtai-AI/lingtai-kernel/issues/677) — Batch LOW findings: MailService reliability improvements (7 items) — @ZigongXu
- [lingtai-kernel#614](https://github.com/Lingtai-AI/lingtai-kernel/issues/614) — lingtai-telegram: getUpdates offset advanced before handler — message loss on exception — @ZigongXu
- [lingtai-kernel#615](https://github.com/Lingtai-AI/lingtai-kernel/issues/615) — lingtai-feishu: no WebSocket reconnection logic — single network blip permanently disables inbound — @ZigongXu
- [lingtai-kernel#617](https://github.com/Lingtai-AI/lingtai-kernel/issues/617) — lingtai-imap: watermark stalls permanently on SEARCH→FETCH race (livelock) — @ZigongXu
- [lingtai-kernel#668](https://github.com/Lingtai-AI/lingtai-kernel/issues/668) — Batch: LOW-severity code quality findings from lifecycle.py, meta_block.py, and __init__.py audits — @ZigongXu
- [lingtai-kernel#673](https://github.com/Lingtai-AI/lingtai-kernel/issues/673) — rebuild_sqlite_event_index deletes -wal/-shm and replaces DB without coordinating with concurrent doctor()/query() — @ZigongXu
- [lingtai-kernel#594](https://github.com/Lingtai-AI/lingtai-kernel/issues/594) — Daemon deliverables have no designated output area — files pollute agent working directory root — @ZigongXu
- [lingtai-kernel#595](https://github.com/Lingtai-AI/lingtai-kernel/issues/595) — No rate-limit coordination between parent and concurrent daemons sharing same API key — @ZigongXu
- [lingtai-kernel#622](https://github.com/Lingtai-AI/lingtai-kernel/issues/622) — Unbounded growth: events.jsonl, chat_history_archive.jsonl, and worker_hang artifacts lack rotation/resolution — @ZigongXu
- [lingtai-kernel#623](https://github.com/Lingtai-AI/lingtai-kernel/issues/623) — No per-tool execution timeout: hung MCP/built-in tool blocks agent indefinitely — @ZigongXu

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
