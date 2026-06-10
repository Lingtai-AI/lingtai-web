// Release archive entries. Newest entries go at the top of the `releases` array.
// Detail pages render one language at a time; shared release data carries zh + en fields.

export interface ReleaseFeature {
  /** Short heading without the leading number (e.g. "Daemon backend expansion"). */
  titleEn: string;
  titleZh: string;
  /** One-paragraph lead, set above the bullet list. */
  leadEn: string;
  leadZh: string;
  /** Concrete change bullets. */
  bulletsEn: string[];
  bulletsZh: string[];
  /** "Why it matters" callout. */
  whyEn: string;
  whyZh: string;
}

export interface ReleaseLink {
  label: string;
  href: string;
}

export interface ReleaseValidation {
  /** Human label, e.g. "Daemon-focused tests". */
  label: string;
  /** Result, e.g. "196 passed" or "passed". */
  result: string;
}

export interface Release {
  /** URL slug. */
  id: string;
  /** Version string, e.g. "v0.10.10". */
  version: string;
  /** Display title without language. */
  titleEn: string;
  titleZh: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** PyPI package name. */
  pkg: string;
  /** Git tag. */
  tag: string;
  /** Optional user-facing install/upgrade command, single line. Leave unset when runtime is venv-managed only. */
  install?: string;
  /** Optional runtime/install explanatory note. */
  runtimeNoteEn?: string;
  runtimeNoteZh?: string;
  /** Short summaries shown on archive + lead of detail page. */
  summaryEn: string;
  summaryZh: string;
  features: ReleaseFeature[];
  contributors: string[];
  validation: {
    /** "Final release validation was run from a clean release worktree at commit X." */
    commit?: string;
    items: ReleaseValidation[];
  };
  links: ReleaseLink[];
}


const v0_8_15_v0_11_3: Release = {
  id: '20260609-1',
  version: 'v0.8.15 / v0.11.3',
  titleEn: 'LingTai TUI/Portal v0.8.15 + Kernel v0.11.3',
  titleZh: '灵台 TUI/Portal v0.8.15 与内核 v0.11.3',
  date: '2026-06-09',
  pkg: 'lingtai-tui + lingtai',
  tag: 'v0.8.15 / v0.11.3',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'This is the published release log for TUI/Portal `v0.8.15` and Kernel/runtime package `lingtai==0.11.3`. Ordinary LingTai projects upgrade through the TUI/Homebrew flow; bare `pip install lingtai` remains a release, diagnostic, or clean-venv validation path rather than the normal user upgrade route.',
  runtimeNoteZh:
    '这是 TUI/Portal `v0.8.15` 与内核/runtime 包 `lingtai==0.11.3` 的正式发布日志。普通 LingTai 项目通过 TUI/Homebrew 路径升级；裸 `pip install lingtai` 仍只适合发布、诊断或 clean-venv 验证，不是正常用户升级路径。',
  summaryEn:
    'This release pairs TUI/Portal v0.8.15 with Kernel v0.11.3 and centers on operating the runtime: more visibility and control from the TUI (a skill-backed, multilingual `/help` command, `/notification` for read-only notification inspection, a daemon browser, daemon counts in kanban, tool-call display controls, adaptive mail input, and `/clear` routed through kernel context clear), and a safer agent runtime under real workloads (the nested secondary tool-call channel is removed and residual stale `secondary` args are ignored/logged, notification sync stops leaking diary-looking synthesized text into visible conversation history, top-level tool calls gain lifecycle tracing plus API-call IDs that group tool batches, with enriched error results, plus a strict relay-compatible avatar schema, repeated-tool-error recovery, OpenAI Responses compact-threshold handling, a stale-notification version guard, refresh recovery from stale processes, MCP stale-stdio restart, and daemon limit / dead-parent cleanup). Knowledge and skill surfaces become more teachable — molt history knowledge entries, a strengthened pre-molt checklist, textbook distillation, a read-only preset-health subskill, optional skill repository remotes, a LICC chat tutorial, and Graphify / cyclic-manifold docs — and research and setup paths get more practical with an authorized-publisher PDF tier, in-house publisher extraction, a Zotero institutional handoff, an academic evidence gate, an install.sh writable-bin fallback, an AED max-attempts setting, and a Codex service-tier preset. Candidate window: 189 files changed, +15,541 / -3,428 lines across 44 first-parent merged PRs (25 TUI/Portal + 19 kernel), plus small direct/doc commits and star-count chores. Final release validation is still to be completed before tag, PyPI, and Homebrew publication.',
  summaryZh:
    '这轮正式发布把 TUI/Portal v0.8.15 与内核 v0.11.3 配对，主题是“把 runtime 真正运行起来”：TUI 侧给出更多可见性与控制（skill-backed 多语言 `/help` 命令、用于只读检查 notification 的 `/notification`、daemon 浏览器、kanban 里的 daemon 计数、tool-call 显示控制、自适应邮件输入、`/clear` 走内核 context clear），内核侧让 agent runtime 在真实负载下更稳（notification sync 不再把像 diary 的 synthesized 文本漏进可见对话历史，移除嵌套 secondary 工具调用通道、残留的 stale `secondary` 参数被忽略并记录，顶层工具调用新增生命周期 tracing 与用于分组工具批次的 API-call ID，并补强错误结果事件，外加严格 relay 兼容的 avatar schema、重复工具错误恢复、OpenAI Responses compact 阈值处理、stale 通知的版本守卫、从 stale 进程恢复 refresh、MCP stale stdio 重启、daemon 上限 / dead-parent 清理）。知识与技能表面更易教学——molt history 知识条目、强化的 molt 前检查清单、textbook distillation、只读 preset-health 子技能、可选技能仓库 remote、LICC chat 教程、Graphify / cyclic manifold 文档；研究与 setup 路径更实用——授权发布商 PDF 层、in-house publisher 抽取、Zotero 机构全文交接、学术证据 gate、install.sh 可写 bin 回退、AED 最大尝试设置、Codex service tier 预设。候选窗口：189 个文件、+15,541 / -3,428 行，跨 44 个 first-parent merged PR（25 个 TUI/Portal + 19 个内核），外加少量直接 / 文档提交与 star-count 杂务。最终发布验证仍待在打 tag、PyPI 与 Homebrew 发布前完成。',
  features: [
    {
      titleEn: 'Operators can see and control the runtime better',
      titleZh: '操作者能更好地看见和控制 runtime',
      leadEn:
        'The most user-visible work in this release is on the TUI itself: commands and surfaces that let an operator inspect what the agent network is doing and steer it without leaving the terminal.',
      leadZh:
        '这轮发布里最贴近用户的改动在 TUI 本身：让操作者无需离开终端，就能看清 agent 网络在做什么并加以引导的命令和界面。',
      bulletsEn: [
        'A `/help` command renders markdown slash-command docs in the TUI; the skill-backed multilingual help assets become the canonical command reference, recipe prompts point at `/help` instead of duplicating command lists, and the viewer now routes key/mouse input correctly so `q`/Esc and scrolling work (#277, #279, #281).',
        'A `/notification` command opens a read-only Markdown viewer over the active agent’s `.notification/*.json`, including an aggregate block plus per-channel entries and `r` reload support (#283).',
        'A TUI daemon browser page lets operators see and navigate running daemons (#275), and the kanban view now shows daemon counts (#207).',
        'Tool-call display controls add truncation (off by default), timestamp settings, and API-call batch grouping so noisy tool output can be tamed and separated by LLM round-trip (#276, #282).',
        'Mail input height adapts to content (#161), and `/clear` is routed through the kernel context clear so the TUI and kernel stay in sync (#222).'
      ],
      bulletsZh: [
        '`/help` 命令在 TUI 内渲染 markdown 形式的斜杠命令文档；skill-backed 多语言 help assets 成为命令权威参考，recipe 提示改为指向 `/help`，不再各自重复命令列表，并且 viewer 现在正确接收键盘 / 鼠标输入，`q`/Esc 与滚动都能正常工作（#277、#279、#281）。',
        '`/notification` 命令用只读 Markdown viewer 展示当前 agent 的 `.notification/*.json`，包括聚合 block 与逐 channel entry，并支持 `r` reload（#283）。',
        '新的 TUI daemon 浏览器页面让操作者查看并浏览运行中的 daemon（#275），kanban 视图现在显示 daemon 计数（#207）。',
        'tool-call 显示控制新增截断（默认关闭）、时间戳设置与按 API call 分组的批次间隔，让吵闹的工具输出可被收拢，并按 LLM 往返分开（#276、#282）。',
        '邮件输入框高度随内容自适应（#161），`/clear` 改走内核 context clear，让 TUI 与内核状态保持一致（#222）。'
      ],
      whyEn:
        'A multi-agent runtime is only operable if a human can quickly see what is running and reduce noise on demand. These changes make the TUI the single place to inspect and steer daemons, mail, and command help.',
      whyZh:
        '多 agent runtime 只有在人能快速看清“在跑什么”、并按需降噪时才真正可操作。这些改动让 TUI 成为查看与引导 daemon、邮件与命令帮助的统一入口。'
    },
    {
      titleEn: 'The agent runtime becomes safer under real workloads',
      titleZh: 'Agent runtime 在真实负载下更安全',
      leadEn:
        'Kernel v0.11.3 concentrates on failure modes that only show up once agents run continuously: stale resources, backend-incompatible payloads, and recursive calls that should never escalate privileges. The nested secondary tool-call channel — first restricted to read-only, then removed outright in this window — is the clearest example; notification sync now uses tool-only synthesized pairs instead of visible diary-looking text; and top-level tool calls now carry lifecycle tracing.',
      leadZh:
        '内核 v0.11.3 集中处理只有在 agent 持续运行后才会暴露的故障：stale 资源、后端不兼容的载荷，以及不该提权的递归调用。嵌套 secondary 工具调用通道——先在本窗口被限制为只读、随后被彻底移除——就是最清楚的例子；notification sync 现在改用 tool-only synthesized pair，不再注入像 diary 的可见文本；顶层工具调用现在也带上了生命周期 tracing。',
      bulletsEn: [
        'The nested secondary tool-call channel was first narrowed to read-only (#236, with strengthened trigger guidance in #234), then removed entirely: the reserved nested `secondary` schema, module, and execution path are gone, residual stale `secondary` args are ignored and logged rather than dispatched, notification/email guidance moves to top-level reads plus direct acknowledgements, and provider-visible `_secondary` metadata is dropped from spill manifests (#241; focused tests 181 passed, full suite 2072 passed / 2 skipped). Notification sync then changed the normal success path to inject only a synthesized `system(action="notification")` tool-call/result pair, keeping summary text log-only so notification summaries no longer look like diary/user text in visible history (#249).',
        'Top-level provider tool calls gain Phase 1 lifecycle tracing in the ToolExecutor: a stable `tool_trace_id` threads events across received / normalized / validation / approval / dispatch / durable-log / model-visible stages and into existing tool logs, enriched tool-error results retain model-visible output, and each LLM round-trip now carries an `api_call_id` through LLM and tool events so the TUI can group tool batches from source-of-truth event data (#242, #246, #247).',
        'The avatar schema is reshaped for strict API relay compatibility (#226), repeated tool errors now pair into a hard stop instead of looping (#202), and tool-loop guard non-dispatch recovery now closes blocked calls explicitly instead of leaving pending tool-call wire state (#217).',
        'OpenAI Responses honors the configured compact threshold (#227); stale notification-channel dismiss is guarded by a version check (#231); refresh recovers from a stale agent process (#224); and stale MCP stdio sessions are restarted instead of left dead (#222, kernel).',
        'Daemon limits are honored (configured max emanations, #225) and dead-parent daemon records are reaped on startup (#233).'
      ],
      bulletsZh: [
        '嵌套 secondary 工具调用通道先被收窄为只读（#236，并在 #234 强化触发指引），随后被彻底移除：保留的嵌套 `secondary` schema、模块与执行路径都被删除，残留的 stale `secondary` 参数被忽略并记录、而不再派发，通知/邮件指引改为顶层读取加直接确认，provider 可见的 `_secondary` 元数据从 spill manifest 中移除（#241；focused 测试 181 通过，完整套件 2072 通过 / 2 跳过）。随后 notification sync 把正常成功路径改为只注入 synthesized `system(action="notification")` tool-call/result pair，summary 文本仅保留在 log 中，避免 notification summary 在可见历史里像 diary/user text（#249）。',
        '顶层 provider 工具调用在 ToolExecutor 中获得 Phase 1 生命周期 tracing：稳定的 `tool_trace_id` 把 received / normalized / validation / approval / dispatch / durable-log / model-visible 各阶段的事件串起来，并写入既有工具日志；工具错误结果保留 model-visible 输出；每次 LLM 往返也会把 `api_call_id` 写入 LLM 与工具事件，让 TUI 可以从源事件数据分组工具批次（#242、#246、#247）。',
        'avatar schema 为严格 API relay 兼容做了重塑（#226），重复工具错误现在配对为硬停止而不是继续循环（#202），tool-loop guard 未派发恢复也会明确关闭被阻止的调用，避免留下 pending tool-call wire state（#217）。',
        'OpenAI Responses 遵循配置的 compact 阈值（#227）；stale 通知通道的 dismiss 由版本检查守卫（#231）；refresh 能从 stale agent 进程恢复（#224）；stale MCP stdio 会话被重启而不是留作死链（#222，内核）。',
        'daemon 上限被遵守（配置的 max emanations，#225），dead-parent 的 daemon 记录在启动时被回收（#233）。'
      ],
      whyEn:
        'Long-running agents accumulate exactly these conditions — dropped sessions, rejected schemas, recursive sends. Closing them reduces silent hangs and privilege surprises, which matters more than any single new feature for an always-on network.',
      whyZh:
        '长期运行的 agent 恰恰会累积这些情况——掉线的会话、被拒的 schema、递归发送。把它们堵上能减少静默卡死与权限意外，对一个常驻网络而言，这比任何单一新功能都重要。'
    },
    {
      titleEn: 'Knowledge and skill surfaces become more teachable',
      titleZh: '知识与技能表面更易教学',
      leadEn:
        'Several changes make the manuals and skills agents read either more durable across molts or more directly useful for a specific task.',
      leadZh:
        '一批改动让 agent 读取的手册与技能要么在 molt 之间更耐久，要么对特定任务更直接有用。',
      bulletsEn: [
        'Molt / session-journal history is documented as knowledge entries under the psyche-manual, with a template asset and a `molt_count` field in entries (#237); session journals themselves are documented as sub-knowledge (kernel #240), and the pre-molt LingTai update checklist plus memory guidance is strengthened (#272).',
        'A new textbook-distillation guide (#273) and a read-only preset-health diagnostic subskill (#265) are added; skill / library pages can expose an optional repository remote (#271).',
        'A tutorial explains the LICC chat command flow (#274), and docs cover the Graphify repo-map (#264) and the cyclic-manifold architecture (#267).',
        'The bash-manual adds a hard rule that long-running agent/coding CLIs (`claude -p`, `codex exec`, `opencode run`, the Cursor agent CLI) must run via bash async + poll rather than synchronous bash, so the agent stays responsive and avoids ACTIVE blockage (kernel #243).'
      ],
      bulletsZh: [
        'molt / session-journal 历史以知识条目形式记录在 psyche-manual 下，配套模板 asset 与条目中的 `molt_count` 字段（#237）；session journal 本身也被记录为 sub-knowledge（内核 #240），molt 前的 LingTai 更新检查清单与记忆指引也被强化（#272）。',
        '新增 textbook-distillation 指南（#273）与只读的 preset-health 诊断子技能（#265）；技能 / library 页面可暴露可选的仓库 remote（#271）。',
        '新增解释 LICC chat 命令流程的教程（#274），文档覆盖 Graphify repo-map（#264）与 cyclic manifold 架构（#267）。',
        'bash-manual 新增硬性规则：长时运行的 agent / coding CLI（`claude -p`、`codex exec`、`opencode run`、Cursor agent CLI）必须走 bash async + 轮询，而不是同步 bash，以保持 agent 响应、避免 ACTIVE 阻塞（内核 #243）。'
      ],
      whyEn:
        'Skills are how a fresh agent learns the system. Recording molt history as structured knowledge and adding focused guides keeps that learning consistent across successors instead of relying on whoever happens to be resident.',
      whyZh:
        '技能是新 agent 学习系统的方式。把 molt 历史记录为结构化知识、并补上聚焦的指南，能让这种学习在继任者之间保持一致，而不是依赖当时恰好在场的那一任。'
    },
    {
      titleEn: 'Research and setup paths become more practical',
      titleZh: '研究与 setup 路径更实用',
      leadEn:
        'The academic-research and first-run paths pick up fixes that matter on real machines and against real publishers.',
      leadZh:
        '学术研究与首次运行路径补上了在真实机器、面对真实发布商时才会用到的修复。',
      bulletsEn: [
        'Academic research gains an authorized publisher PDF tier (#257) and an in-house publisher extractor for publisher metadata (#258), plus a documented Zotero institutional full-text handoff workflow (#266) and an academic evidence verification gate (#269).',
        '`install.sh` falls back to a writable bin directory instead of aborting on non-Homebrew systems (#240), improving community install reliability, and development prerequisites are documented (#260).',
        'Setup / first-run exposes an AED max-attempts setting (#253), and a Codex preset service-tier option is added (#256).'
      ],
      bulletsZh: [
        '学术研究新增授权发布商 PDF 层（#257）与抽取发布商元数据的 in-house publisher extractor（#258），并补上记录在案的 Zotero 机构全文交接流程（#266）与学术证据验证 gate（#269）。',
        '`install.sh` 在非 Homebrew 系统上回退到可写的 bin 目录，而不是直接中止（#240），提升社区安装可靠性；开发前置条件也被写入文档（#260）。',
        'setup / 首次运行暴露 AED 最大尝试设置（#253），并新增 Codex 预设的 service tier 选项（#256）。'
      ],
      whyEn:
        'These are the paths a new user and a research agent hit first. Making installs survive non-standard machines and letting research reach authorized full text removes early friction that otherwise blocks real use.',
      whyZh:
        '这些是新用户和研究 agent 最先碰到的路径。让安装在非标准机器上也能跑通、让研究能取到授权全文，能消除原本会卡住真实使用的早期摩擦。'
    }
  ],
  contributors: ['huangzesen', 'TZZheng', 'ktwu01', 'hao', 'ZacharyHu0', '9s5bz2jvd2-lang', 'antimonyz', 'xczics'],
  validation: {
    commit: 'lingtai@d9a96fb + lingtai-kernel@6ff15dd (published tags)',
    items: [
      { label: 'lingtai v0.8.14..v0.8.15 diff', result: '111 files, +10,190 / -1,662' },
      { label: 'lingtai-kernel v0.11.2..v0.11.3 diff', result: '79 files, +5,352 / -1,767' },
      { label: 'Combined release window', result: '190 files, +15,542 / -3,429 across 44 merged PRs plus the kernel version bump' },
      { label: 'Release status', result: 'published: GitHub tags/releases, PyPI 0.11.3, and Homebrew tap 0.8.15 verified' }
    ]
  },
  links: [
    { label: 'TUI/Portal v0.8.14...v0.8.15 compare', href: 'https://github.com/Lingtai-AI/lingtai/compare/v0.8.14...v0.8.15' },
    { label: 'TUI/Portal release v0.8.15', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.8.15' },
    { label: 'TUI/Portal release commit d9a96fb', href: 'https://github.com/Lingtai-AI/lingtai/commit/d9a96fb14c7f5d797f0a684ed66e90278efc26f3' },
    { label: 'Kernel v0.11.2...v0.11.3 compare', href: 'https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.11.2...v0.11.3' },
    { label: 'Kernel release v0.11.3', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.11.3' },
    { label: 'Kernel release commit 6ff15dd', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/6ff15dd4eaf19e031874d91a9158c11926f1347f' },
    { label: 'PyPI lingtai 0.11.3', href: 'https://pypi.org/project/lingtai/0.11.3/' },
    { label: 'Homebrew tap commit 2e728a6', href: 'https://github.com/lingtai-ai/homebrew-lingtai/commit/2e728a6607edd8754e92f2920d050e866ca9fcd9' },
    { label: 'PR #277 — TUI /help command', href: 'https://github.com/Lingtai-AI/lingtai/pull/277' },
    { label: 'PR #279 — Skill-backed multilingual TUI help', href: 'https://github.com/Lingtai-AI/lingtai/pull/279' },
    { label: 'PR #281 — /help markdown viewer input routing', href: 'https://github.com/Lingtai-AI/lingtai/pull/281' },
    { label: 'PR #276 — Tool call display controls', href: 'https://github.com/Lingtai-AI/lingtai/pull/276' },
    { label: 'PR #282 — Group tool-call display by API call', href: 'https://github.com/Lingtai-AI/lingtai/pull/282' },
    { label: 'PR #283 — TUI /notification command', href: 'https://github.com/Lingtai-AI/lingtai/pull/283' },
    { label: 'PR #161 — Adaptive mail input height', href: 'https://github.com/Lingtai-AI/lingtai/pull/161' },
    { label: 'PR #207 — Show daemon counts in kanban', href: 'https://github.com/Lingtai-AI/lingtai/pull/207' },
    { label: 'PR #222 — Route TUI clear through kernel context clear', href: 'https://github.com/Lingtai-AI/lingtai/pull/222' },
    { label: 'PR #256 — Codex preset service-tier option', href: 'https://github.com/Lingtai-AI/lingtai/pull/256' },
    { label: 'PR #275 — TUI daemon browser', href: 'https://github.com/Lingtai-AI/lingtai/pull/275' },
    { label: 'PR #240 — install.sh writable-bin fallback', href: 'https://github.com/Lingtai-AI/lingtai/pull/240' },
    { label: 'PR #236 — Restrict secondary calls to read-only', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/236' },
    { label: 'PR #237 — Document molt history knowledge entries', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/237' },
    { label: 'Kernel PR #202 — Repeated tool-error hard stop pairing', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/202' },
    { label: 'Kernel PR #217 — Tool-loop guard non-dispatch recovery', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/217' },
    { label: 'Kernel PR #226 — Strict relay-compatible avatar schema', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/226' },
    { label: 'Kernel PR #231 — Guard stale notification dismiss', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/231' },
    { label: 'Kernel PR #233 — Reap dead-parent daemon records', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/233' },
    { label: 'Kernel PR #240 — Document session journals as sub-knowledge', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/240' },
    { label: 'Kernel PR #241 — Remove secondary nested tool-call channel', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/241' },
    { label: 'Kernel PR #242 — Trace tool-call lifecycle events', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/242' },
    { label: 'Kernel PR #243 — Document async bash for agent CLIs', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/243' },
    { label: 'Kernel PR #246 — Enrich tool error result events', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/246' },
    { label: 'Kernel PR #247 — Add API-call IDs to LLM/tool events', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/247' },
    { label: 'Kernel PR #249 — Tool-only synthesized notification sync', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/249' },
    { label: 'Declined PR #228 — filesystem Time Machine proposal', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/228' },
    { label: 'Declined PR #235 — soul flow past-self routing proposal', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/235' },
    { label: 'Issue #174 — textbook distillation request', href: 'https://github.com/Lingtai-AI/lingtai/issues/174' },
    { label: 'Issue #175 — stronger pre-molt identity guidance request', href: 'https://github.com/Lingtai-AI/lingtai/issues/175' },
    { label: 'Issue #177 — cyclic manifold architecture request', href: 'https://github.com/Lingtai-AI/lingtai/issues/177' },
    { label: 'Issue #179 — academic evidence gate request', href: 'https://github.com/Lingtai-AI/lingtai/issues/179' },
    { label: 'Issue #236 — README development prerequisites report', href: 'https://github.com/Lingtai-AI/lingtai/issues/236' },
    { label: 'Issue #238 — closed not-planned rewind proposal', href: 'https://github.com/Lingtai-AI/lingtai/issues/238' },
    { label: 'Issue #239 — install.sh writable-bin fallback report', href: 'https://github.com/Lingtai-AI/lingtai/issues/239' },
    { label: 'Issue #261 — closed duplicate Cloud Mail MCP addon placeholder', href: 'https://github.com/Lingtai-AI/lingtai/issues/261' },
    { label: 'Issue #263 — closed not-planned Ctrl+T agent-switching report', href: 'https://github.com/Lingtai-AI/lingtai/issues/263' },
    { label: 'Kernel Issue #230 — daemon completion notification replacement report', href: 'https://github.com/Lingtai-AI/lingtai-kernel/issues/230' },
    { label: 'Kernel Issue #232 — orphaned daemon record report', href: 'https://github.com/Lingtai-AI/lingtai-kernel/issues/232' }
  ]
};

const v0_8_14_v0_11_2: Release = {
  id: '20260602-1',
  version: 'v0.8.14 / v0.11.2',
  titleEn: 'LingTai TUI/Portal v0.8.14 + Kernel v0.11.2',
  titleZh: '灵台 TUI/Portal v0.8.14 与内核 v0.11.2',
  date: '2026-06-02',
  pkg: 'lingtai-tui + lingtai',
  tag: 'v0.8.14 / v0.11.2',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The kernel/runtime package `lingtai==0.11.2` belongs to the TUI-managed project virtualenv path. Ordinary LingTai projects should upgrade through the TUI/Homebrew flow; bare `pip install` remains a development, diagnostic, or clean-venv validation path rather than the normal user upgrade path.',
  runtimeNoteZh:
    '内核/runtime 包 `lingtai==0.11.2` 属于 TUI 管理的项目 virtualenv 路径。普通 LingTai 项目应通过 TUI/Homebrew 路径升级；裸 `pip install` 只适合开发、诊断或 clean-venv 验证，不是正常用户升级路径。',
  summaryEn:
    'This paired release cleans up the skill and manual surfaces that agents read every day. TUI/Portal v0.8.14 continues the move from large top-level utility documents toward router + reference skill layouts, consolidates research/media helpers under Swiss Knife, and tightens setup/preset reliability. Kernel v0.11.2 mirrors that work inside intrinsic manuals, splits the consequential-molt scaffold into a psyche-manual asset, adds Cursor daemon/backend and validation fixes, and includes a late rescue fix for Codex/gpt-5.5 agents by scrubbing rejected Responses tool schemas and removing the duplicate email scheduler in favor of host cron. Release window: 49 commits, 31 merged PRs, 172 files changed, +10,990 / -5,476 lines.',
  summaryZh:
    '这是一轮把 agent 每天会读、会调用、会恢复的技能和手册表面重新收拾干净的联合发布。TUI/Portal v0.8.14 继续把顶层 utility skill 从“大文档”收束成 router + reference，把研究、媒体和小工具统一收进 Swiss Knife，并修补 setup / preset / 凭据可靠性；内核 v0.11.2 在 intrinsic manuals 里同步推进 nested reference，把 consequential molt 模板沉到 psyche-manual asset，补上 Cursor daemon/backend、validator 与 notification 可靠性，并在发布前加入 Codex/gpt-5.5 救火修复：清洗 Responses API 会拒绝的 tool schema，删除重复的 email scheduler，回到 host cron 路径。这个 release window 合计 49 commits、31 个 merged PR、172 个文件、+10,990 / -5,476 行。',
  features: [
    {
      titleEn: 'Skill library cleanup: routers at the top, references at the leaves',
      titleZh: '技能库清理：顶层是入口，细节沉到 reference',
      leadEn:
        'The most visible work is not a command-line feature, but the shape of the manuals agents load. Long utility skills now expose a smaller routing surface and move heavy details into named references or assets.',
      leadZh:
        '这次最显眼的变化不在命令行，而在 agent 会按需读取的技能层：长文档被拆成轻量入口，真正沉重、易过期、只在特定任务需要的内容进入明确命名的 reference / asset。',
      bulletsEn: [
        '`lingtai-issue-report` now routes to an evidence checklist, report template, and filing flow instead of mixing the whole process into one document.',
        '`listen`, `academic-research`, `vision`, `dj`, and `find-something-to-do` moved under `swiss-knife/reference/`, making the top-level skill catalog read more like entry points than a flat toolbox.',
        'Portal guide, tutorial guide, recipe, dev guide, daily reflection, and web-browsing utilities continue the nested-reference pattern introduced in earlier releases.'
      ],
      bulletsZh: [
        '`lingtai-issue-report` 拆成 evidence checklist、report template、filing flow，不再把取证、写报告和 filing 动作混在一份长文档里。',
        '`listen`、`academic-research`、`vision`、`dj`、`find-something-to-do` 移入 `swiss-knife/reference/`，顶层技能列表更像入口，而不是所有工具的平铺目录。',
        '`lingtai-portal-guide`、`tutorial-guide`、`lingtai-recipe`、`lingtai-dev-guide`、`daily-reflection`、`web-browsing` 等 utility skills 继续沿用 nested reference 模式。'
      ],
      whyEn:
        'Resident prompts should remember where to go, not carry every procedure. Smaller routers make the system prompt lighter, while leaf references keep detailed workflows available when the task actually needs them.',
      whyZh:
        '常驻提示应该记住“去哪里”，而不是背下每一条流程。轻量 router 让系统提示更小，leaf reference 则在任务真正需要时保留完整细节。'
    },
    {
      titleEn: 'Molt and procedures: the full handoff scaffold moves to the right layer',
      titleZh: 'Molt 与 procedures：完整交接模板放回正确层级',
      leadEn:
        'The old `lingtai-molt-template` utility is folded into the kernel-side operating model. The resident procedure now points clearly to `psyche-manual`, and the full nine-section consequential-molt template lives as a packaged asset.',
      leadZh:
        '原本有些奇怪的 `lingtai-molt-template` utility 被收回内核运行模型：常驻 procedures 给出明显入口，完整九段式 consequential molt 模板进入 `psyche-manual` 的 packaged asset。',
      bulletsEn: [
        'Kernel procedures now make the “read psyche-manual before a consequential molt” route explicit.',
        '`psyche-manual` became a lighter router with `assets/molt-template.md` as the full scaffold.',
        'Changed docs replace stale “Codex Cheat Sheet” wording with durable-memory and successor-briefing language.'
      ],
      bulletsZh: [
        'kernel procedures 明确提示：重要 molt 前先读 `psyche-manual`。',
        '`psyche-manual` 变成更轻的 router，完整模板沉到 `assets/molt-template.md`。',
        '改动文件把旧的 “Codex Cheat Sheet” 说法换成 durable memory / successor briefing 语言。'
      ],
      whyEn:
        'A molt summary is not a transcript; it is the next self’s operating brief. Keeping the full scaffold in the intrinsic psyche manual makes that rule available to every agent without bloating the always-on prompt.',
      whyZh:
        'molt summary 不是聊天记录，而是下一任自己的作战简报。把完整模板放进 intrinsic psyche manual，既让所有 agent 可用，又不膨胀常驻提示。'
    },
    {
      titleEn: 'Release-window rescue: Codex/gpt-5.5 tool schema scrub and scheduler removal',
      titleZh: '发布前救火：Codex/gpt-5.5 tool schema 清洗与 scheduler 移除',
      leadEn:
        'The final kernel rescue commit is included in this release because it directly affects whether Codex-backed gpt-5.5 agents can boot and call tools reliably.',
      leadZh:
        '最后合入的 kernel 救火 commit 被纳入本次发布，因为它直接影响 Codex/gpt-5.5 agent 能否稳定启动并调用工具。',
      bulletsEn: [
        'Merge `70e7c02` carries commits `3086312` and `adea979`: tool schemas are scrubbed before being sent to the OpenAI/Codex Responses backend, removing JSON Schema shapes that the backend rejects.',
        'The built-in email recurring-send scheduler was removed from schema/i18n/manager code; recurring work now routes back to host cron / launchd / systemd as documented in `bash-manual`.',
        'The cleanup touched seven kernel files (`+83 / -460`) and the release tests were aligned to assert that the scheduler surface is absent rather than accidentally still advertised.'
      ],
      bulletsZh: [
        'merge `70e7c02` 包含 `3086312` 与 `adea979`：tool schema 在发给 OpenAI/Codex Responses backend 前先做 scrub，去掉后端会拒绝的 JSON Schema 形状。',
        '内置 email recurring-send scheduler 从 schema / i18n / manager 里移除；周期任务回到 `bash-manual` 记录的 host cron / launchd / systemd 路径。',
        '这次清理涉及 7 个内核文件（`+83 / -460`），release 测试也同步改为断言 scheduler surface 不再暴露。'
      ],
      whyEn:
        'The fix reduces a hard availability failure mode: agents should not be blocked before their first real action because the model backend rejects the tool definitions themselves. Removing the duplicate scheduler also leaves one clearer scheduling path.',
      whyZh:
        '这个修复减少了一类硬可用性故障：agent 不应在第一次真正行动前，就因为模型后端拒绝工具定义本身而卡死。删除重复 scheduler 也让定时任务只剩一条更清楚的路径。'
    },
    {
      titleEn: 'Reliability polish across setup, presets, validation, and release hygiene',
      titleZh: 'setup、preset、validation 与 release hygiene 的可靠性修补',
      leadEn:
        'Alongside the documentation and skill refactors, this window includes smaller fixes that make setup, testing, and release verification less surprising.',
      leadZh:
        '除了文档和技能重构，这个窗口还合入了一批让 setup、测试和 release 验证更少惊喜的小修补。',
      bulletsEn: [
        'TUI setup/preset/API-key handling and MiniMax-M3 default updates were validated through Go tests and release builds.',
        'Portal release validation now explicitly builds `portal/web` before portal Go tests so embedded assets exist.',
        'The release gate normalized `docs/stars/stars.csv` line endings so `git diff --check` stays clean.'
      ],
      bulletsZh: [
        'TUI setup / preset / API-key 处理和 MiniMax-M3 默认模型更新通过 Go tests 与 release build 验证。',
        'Portal release validation 明确先 build `portal/web` 再跑 portal Go tests，保证 embedded assets 存在。',
        'release gate 顺手规范化 `docs/stars/stars.csv` 行尾，让 `git diff --check` 保持干净。'
      ],
      whyEn:
        'Small release-gate fixes are easy to dismiss, but they are exactly what keeps the next release from spending time rediscovering the same failure modes.',
      whyZh:
        'release gate 的小修补看起来不起眼，但正是这些细节避免下一次发布重复踩同样的坑。'
    }
  ],
  contributors: ['@huangzesen', '@JieKiYu', '@zhiping0913'],
  validation: {
    commit: 'lingtai@dde319e + lingtai-kernel@62315ec',
    items: [
      { label: 'TUI Go tests', result: 'passed' },
      { label: 'Portal web build + Go tests', result: 'passed' },
      { label: 'TUI/Portal release builds', result: 'passed' },
      { label: 'Kernel focused release tests', result: '276 passed' },
      { label: 'Kernel wheel/sdist + twine check', result: 'passed' },
      { label: 'PyPI visibility', result: 'lingtai 0.11.2 latest' },
      { label: 'Homebrew tap', result: 'updated to v0.8.14' }
    ]
  },
  links: [
    { label: 'TUI/Portal v0.8.14 release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.8.14' },
    { label: 'Kernel v0.11.2 release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.11.2' },
    { label: 'TUI final commit dde319e', href: 'https://github.com/Lingtai-AI/lingtai/commit/dde319eba439eff056a6e7189a5fe5f89f0f30bc' },
    { label: 'Kernel final commit 62315ec', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/62315ec96b81452c35dc352773d5f28dd7981ed4' },
    { label: 'Kernel rescue merge 70e7c02', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/70e7c02200cd8e2c1cfb04fe66364535507114a5' },
    { label: 'Homebrew tap update c0b0d7c', href: 'https://github.com/Lingtai-AI/homebrew-lingtai/commit/c0b0d7c2e8cef0d178afc3d0fd4ddfead88b56da' }
  ]
};

const v0_8_13_v0_11_1: Release = {
  id: '20260531-1',
  version: 'v0.8.13 / v0.11.1',
  titleEn: 'LingTai TUI/Portal v0.8.13 + Kernel v0.11.1',
  titleZh: '灵台 TUI/Portal v0.8.13 与内核 v0.11.1',
  date: '2026-05-31',
  pkg: 'lingtai-tui + lingtai',
  tag: 'v0.8.13 / v0.11.1',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The kernel/runtime package `lingtai==0.11.1` belongs to the TUI-managed project virtualenv path. Ordinary LingTai projects should upgrade through the TUI/Homebrew flow; bare `pip install` remains a development, diagnostic, or clean-venv validation path rather than the normal user upgrade path.',
  runtimeNoteZh:
    '内核/runtime 包 `lingtai==0.11.1` 仍属于 TUI 管理的项目 virtualenv 路径。普通 LingTai 项目应通过 TUI/Homebrew 路径升级；裸 `pip install` 只适合开发、诊断或 clean-venv 验证，不是正常用户升级路径。',
  summaryEn:
    'A release window about making long-running LingTai work easier to resume and easier to inspect. Molt continuation now relies on explicit post-molt notifications rather than fragile next-action guessing, while local traces gain a rebuildable SQLite index and optional historical backfill. Soul flow also becomes more exploratory and voice-aware. The same window brings first-party WhatsApp MCP support, a kernel-owned intrinsic doctor, progressive-disclosure guidance for resident prompts, and product/license documentation polish.',
  summaryZh:
    '这次发布窗口的核心是让 LingTai 的长任务更容易续上、更容易检查。molt 后的继续不再依赖脆弱的 next-action 猜测，而是走更明确的 post-molt notification 路径；本地轨迹也获得了可重建的 SQLite 索引与可选历史 backfill，soul flow 也变得更偏探索、更能使用配置好的 voice prompt。同一窗口还加入了一等 WhatsApp MCP 支持、kernel-owned intrinsic doctor、resident prompt 的 progressive-disclosure 指引，以及产品叙事与 license 文档整理。',
  features: [
    {
      titleEn: 'Molt continuation: less guesswork after shedding context',
      titleZh: 'Molt continuation：上下文脱落后少一点猜测',
      leadEn:
        'Molt is how a LingTai agent survives finite context. This release tightens the continuation path so the post-molt self receives a clearer wake-up signal instead of depending on heuristic prose extraction.',
      leadZh:
        'molt 是 LingTai agent 在有限上下文中继续活下去的方式。这一版把 molt 后续接的路径收紧：molt 后的新 self 收到更明确的唤醒信号，而不是依赖从文本里猜测下一步。',
      bulletsEn: [
        'Post-molt continuation notices are emitted from the actual molt result instead of a guessed `next_action` heuristic.',
        'Post-molt notifications now wake after the context shed, so a successor can pick up the summary, pad, and pending work rather than waiting silently.',
        'Deferral is limited to real molt results, reducing the chance that unrelated notifications are delayed, duplicated, or attached to the wrong turn.',
        'The improvement is most visible during long development sessions: the agent can deliberately shed context, re-open with a handoff, and continue the release, PR, or investigation thread with less manual reorientation.',
      ],
      bulletsZh: [
        'post-molt continuation notice 现在从真实的 molt result 触发，而不是依赖猜出来的 `next_action` heuristic。',
        'molt 后 notification 可以在上下文脱落后唤醒 successor，让它读取 summary、pad 与未完成工作，而不是静默停住。',
        'defer 只发生在真正的 molt result 上，降低无关通知被延迟、重复、或挂到错误 turn 上的概率。',
        '这个改进在长开发会话里最明显：agent 可以有意识地 shed context，带着 handoff 重新打开，然后继续 release、PR 或调查线程，少一点人工重新定位。',
      ],
      whyEn:
        'LingTai treats conversation as temporary but work as durable. Stronger post-molt continuation makes that memory model feel practical, not ceremonial.',
      whyZh:
        'LingTai 把 conversation 视为临时层，把工作状态放进 durable 层。更可靠的 post-molt continuation 让这套记忆模型更像实际生产能力，而不只是仪式。',
    },
    {
      titleEn: 'Soul flow becomes exploratory and voice-aware',
      titleZh: 'Soul flow 变得更偏探索，也更懂 voice',
      leadEn:
        'Two late-window kernel changes make the idle inner voice less like a forced productivity checklist and more like a configurable reflective companion.',
      leadZh:
        '这个窗口后段的两项 kernel 改动，让 idle 时的 inner voice 不再像强制 productivity checklist，而更像可配置的反思伙伴。',
      bulletsEn: [
        'Kernel PR #204 changes the default soul-flow posture toward exploratory reflection rather than narrow task extraction.',
        'Kernel PR #206 routes soul-flow consultations through the configured voice prompt, so custom soul voices affect both current-insight and past-self consultations.',
        'The change fits the same memory model as molt: conversation is temporary, but reflection and handoff should help the next turn notice what the busy self might miss.',
      ],
      bulletsZh: [
        'kernel PR #204 把默认 soul-flow 姿态调成更偏探索式反思，而不是狭窄地提取任务清单。',
        'kernel PR #206 让 soul-flow consultation 走配置好的 voice prompt；自定义 soul voice 会影响 current-insight 与 past-self consultation。',
        '这和 molt 的记忆模型相互呼应：conversation 是临时层，但反思与 handoff 应该帮助下一轮注意到忙碌中的 self 可能漏掉的东西。',
      ],
      whyEn:
        'LingTai’s “inner voice” should be something an agent can cultivate and tune, not a hard-coded narrator with one personality.',
      whyZh:
        'LingTai 的“内在声音”应该是 agent 可以培养和调音的东西，而不是只有一种性格的硬编码旁白。',
    },
    {
      titleEn: 'SQLite trace index: JSONL remains the truth, queries become fast',
      titleZh: 'SQLite 轨迹索引：JSONL 仍是事实源，查询变快',
      leadEn:
        'Local agent traces now have a derived SQLite sidecar that can be rebuilt, inspected, and queried without replacing the append-only JSONL record.',
      leadZh:
        '本地 agent 轨迹现在有了一个派生 SQLite sidecar：可以重建、检查、查询，但不取代 append-only JSONL 事实记录。',
      bulletsEn: [
        'Kernel PR #201 adds `logs/log.sqlite` as a fail-open, rebuildable index for `logs/events.jsonl`, plus `lingtai-agent log rebuild|doctor|query <agent_dir>`.',
        'Read-only SQL query support accepts safe `SELECT` / `WITH ... SELECT` / `EXPLAIN` paths and keeps JSONL as the source of truth.',
        'Kernel PR #203 expands the index to agent chat history, chat archives, daemon events, and daemon chat history through a new `chat_entries` table and source provenance fields.',
        'TUI PR #221 adds an interactive migration that asks whether to backfill historical SQLite logs, warns that large histories can take time, shows progress when confirmed, and makes skipping safe for normal use.',
      ],
      bulletsZh: [
        'kernel PR #201 新增 `logs/log.sqlite`，作为 `logs/events.jsonl` 的 fail-open、可重建索引，并提供 `lingtai-agent log rebuild|doctor|query <agent_dir>`。',
        '只读 SQL 查询支持安全的 `SELECT` / `WITH ... SELECT` / `EXPLAIN` 路径，同时保持 JSONL 是事实源。',
        'kernel PR #203 把索引扩展到 agent chat history、chat archive、daemon events 与 daemon chat history，并新增 `chat_entries` 表和 source provenance 字段。',
        'TUI PR #221 在 migration 中加入交互式历史 backfill：先询问用户，说明大历史可能耗时，确认后显示进度条；跳过也不影响正常使用。',
      ],
      whyEn:
        'Agents generate a lot of local history. Keeping JSONL durable while adding SQL inspection makes debugging, trajectory mining, and future UI views much less painful.',
      whyZh:
        'agent 会生成大量本地历史。保持 JSONL 耐久，同时增加 SQL inspection，让调试、trajectory mining 和未来 UI 视图都少很多痛苦。',
    },
    {
      titleEn: 'WhatsApp joins the first-party MCP channel set',
      titleZh: 'WhatsApp 进入一等 MCP 通道集合',
      leadEn:
        'WhatsApp is now wired like LingTai’s other first-party communication channels: a curated MCP registration, runtime dependency, TUI wiring, and README channel documentation.',
      leadZh:
        'WhatsApp 现在按 LingTai 其它一等通讯通道的方式接入：curated MCP registration、runtime dependency、TUI wiring，以及 README channel 文档。',
      bulletsEn: [
        'The new `lingtai-whatsapp` package provides a WhatsApp Cloud API MCP server and is tagged at `v0.1.0`.',
        'Kernel PR #188 registers the curated `whatsapp` MCP, and PR #189 adds the runtime dependency on `lingtai-whatsapp>=0.1.0`.',
        'TUI PR #216 wires WhatsApp into the MCP setup surface, and PR #220 adds WhatsApp to the documented channel list.',
        'As with other MCP channels, activation still depends on user-provided provider credentials; registration and packaging are now first-party.',
      ],
      bulletsZh: [
        '新的 `lingtai-whatsapp` 包提供 WhatsApp Cloud API MCP server，并已打 `v0.1.0` tag。',
        'kernel PR #188 注册 curated `whatsapp` MCP，PR #189 增加 `lingtai-whatsapp>=0.1.0` runtime dependency。',
        'TUI PR #216 把 WhatsApp 接入 MCP setup surface，PR #220 在 README channel 列表中补上 WhatsApp。',
        '和其它 MCP 通道一样，真正激活仍取决于用户提供 provider credentials；但注册、打包、文档路径已经进入 first-party。',
      ],
      whyEn:
        'LingTai’s human-facing channels become broader without inventing a separate integration model for every platform.',
      whyZh:
        'LingTai 面向人的通道变宽了，同时不需要为每个平台发明一套单独的集成模型。',
    },
    {
      titleEn: 'Diagnostics and resident guidance move toward kernel-owned manuals',
      titleZh: '诊断与常驻指导继续向 kernel-owned manuals 收拢',
      leadEn:
        'This window keeps moving operational knowledge out of scattered UI copies and into intrinsic skills/manuals that agents can load when needed.',
      leadZh:
        '这个窗口继续把操作知识从分散的 UI 文案里收拢到 agent 需要时可加载的 intrinsic skills/manuals。',
      bulletsEn: [
        'Kernel PR #185 adds the intrinsic `lingtai-doctor` skill and expands read-only diagnostics for agent health, stale paths, heartbeat/process disagreements, and MCP/addon path issues.',
        'TUI PR #213 wires `/doctor` to the kernel-owned intrinsic doctor instead of maintaining a separate diagnostic script path in the TUI.',
        'Kernel PR #187 and TUI PR #215 route expanded runtime guidance into `system-manual`, keeping the resident prompt smaller while preserving detailed procedures on demand.',
        'TUI PR #214 adds the standing guidance that substantial human-facing deliverables should prefer standalone HTML when appropriate.',
      ],
      bulletsZh: [
        'kernel PR #185 新增 intrinsic `lingtai-doctor` skill，并扩展只读诊断：agent health、stale paths、heartbeat/process 分歧、MCP/addon path 问题等。',
        'TUI PR #213 让 `/doctor` 复用 kernel-owned intrinsic doctor，而不是在 TUI 里维护另一套诊断脚本路径。',
        'kernel PR #187 与 TUI PR #215 把展开版 runtime guidance 路由到 `system-manual`，让 resident prompt 变小，但详细 procedure 仍可按需加载。',
        'TUI PR #214 增加 standing guidance：重要 human-facing deliverable 在合适时优先做 standalone HTML。',
      ],
      whyEn:
        'Agents should carry durable operating knowledge with them, while the always-on prompt stays small enough to leave room for actual work.',
      whyZh:
        'agent 应该随身携带可持久的操作知识，同时 always-on prompt 要足够小，把空间留给真正的工作。',
    },
    {
      titleEn: 'Product narrative, license alignment, and public documentation polish',
      titleZh: '产品叙事、license 对齐与公开文档整理',
      leadEn:
        'The release also cleans up the public shape of the project: what LingTai is, how it is licensed, and where new users see the supported channels.',
      leadZh:
        '这次发布也整理了项目对外形状：LingTai 是什么、用什么 license、以及新用户从哪里看到支持的通道。',
      bulletsEn: [
        'TUI PR #212 expands the project README, and PR #219 repositions it as a product entry rather than only a developer note.',
        'TUI PR #220 adds WhatsApp to the README communication channel list, matching the new first-party MCP path.',
        'Kernel PR #200 and TUI PR #218 align the repositories on Apache-2.0.',
        'The release window also includes routine star-count maintenance commits in the web-facing project metadata.',
      ],
      bulletsZh: [
        'TUI PR #212 扩展项目 README，PR #219 把 README 重新定位为产品入口，而不只是开发说明。',
        'TUI PR #220 在 README 通讯通道列表中加入 WhatsApp，与新的 first-party MCP 路径对齐。',
        'kernel PR #200 与 TUI PR #218 将仓库 license 对齐到 Apache-2.0。',
        '这个发布窗口也包含面向网站元数据的日常 star-count 维护提交。',
      ],
      whyEn:
        'As LingTai becomes easier to install and easier to extend, the public entry point needs to explain the system in the same language the product now uses.',
      whyZh:
        '当 LingTai 越来越容易安装、也越来越容易扩展时，对外入口也需要用产品当前自己的语言解释这套系统。',
    },
  ],
  contributors: ['huangzesen'],
  validation: {
    commit: 'lingtai v0.8.13 30b2a58 / lingtai-kernel v0.11.1 b2d1bb5',
    items: [
      { label: 'Kernel SQLite log index PR #201', result: 'focused verification passed; merged' },
      { label: 'Kernel chat/daemon SQLite index PR #203', result: 'focused suite passed with 186 tests; merged' },
      { label: 'TUI SQLite backfill migration PR #221', result: 'go test ./... for TUI passed; portal migration package passed' },
      { label: 'Post-molt continuation PR #190', result: 'merged with notification wake and deferral fixes' },
      { label: 'Kernel focused readiness suite', result: '242 passed across SQLite, CLI, post-molt, soul, and notification tests' },
      { label: 'WhatsApp MCP package', result: 'lingtai-whatsapp v0.1.0 tagged and published' },
      { label: 'Kernel v0.11.1 release', result: 'GitHub release, PyPI JSON, and clean venv install verified' },
      { label: 'TUI/Portal v0.8.13 release', result: 'GitHub release, Homebrew tap update, brew upgrade, and binary versions verified' },
    ],
  },
  links: [
    { label: 'Post-molt continuation PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/190' },
    { label: 'Kernel SQLite log index PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/201' },
    { label: 'Kernel chat/daemon SQLite index PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/203' },
    { label: 'TUI SQLite backfill migration PR', href: 'https://github.com/Lingtai-AI/lingtai/pull/221' },
    { label: 'Soul flow exploration defaults PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/204' },
    { label: 'Soul flow voice prompt PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/206' },
    { label: 'WhatsApp MCP package tag', href: 'https://github.com/Lingtai-AI/lingtai-whatsapp/tree/v0.1.0' },
    { label: 'Kernel v0.11.1 GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.11.1' },
    { label: 'Kernel PyPI package', href: 'https://pypi.org/project/lingtai/0.11.1/' },
    { label: 'Kernel release commit', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/b2d1bb59e670c1e17ce3e6519b02674f15d15cc2' },
    { label: 'TUI/Portal v0.8.13 GitHub release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.8.13' },
    { label: 'TUI/Portal main commit', href: 'https://github.com/Lingtai-AI/lingtai/commit/30b2a58e6e5e52d781a319567a764426b9259518' },
    { label: 'Homebrew tap update', href: 'https://github.com/Lingtai-AI/homebrew-lingtai/commit/a1099d7531ee3f7f48e6b01ea9dfc1c1630cdc1a' },
  ],
};

const v0_8_12_v0_11_0: Release = {
  id: '20260529-1',
  version: 'v0.8.12 / v0.11.0',
  titleEn: 'LingTai TUI/Portal v0.8.12 + Kernel v0.11.0',
  titleZh: '灵台 TUI/Portal v0.8.12 与内核 v0.11.0',
  date: '2026-05-29',
  pkg: 'lingtai-tui + lingtai',
  tag: 'v0.8.12 / v0.11.0',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The kernel/runtime package `lingtai==0.11.0` is published on PyPI, but ordinary LingTai projects do not upgrade it with a bare `pip install`. The TUI owns each project runtime through its managed virtualenv and resolves the kernel package there.',
  runtimeNoteZh:
    '内核/runtime 包 `lingtai==0.11.0` 已发布到 PyPI，但普通 LingTai 项目不通过裸 `pip install` 来升级它。TUI 负责创建和维护每个项目的 runtime venv，并在该 venv 中解析内核包。',
  summaryEn:
    'A coordinated release window for the Go TUI/Portal and the Python/Rust kernel. The TUI reaches v0.8.12 with safer first-run recovery, safer Homebrew upgrades, clearer MCP controls, Rust sidecar diagnostics, and dev-runtime protection; the kernel reaches v0.11.0 to mark the Rust-backed rewrite line and ships on PyPI after full release validation.',
  summaryZh:
    '一次横跨 Go 侧 TUI/Portal 与 Python/Rust 内核的联合发布窗口。TUI 发布 v0.8.12，重点是 first-run 恢复、Homebrew 升级安全、MCP 控制面、Rust sidecar 诊断与 dev runtime 保护；内核发布 v0.11.0，用 minor 版本标记 Rust-backed rewrite 这一条线，并在完整 release 验证后发布到 PyPI。',
  features: [
    {
      titleEn: 'TUI/Portal v0.8.12: recovery and upgrade paths are safer',
      titleZh: 'TUI/Portal v0.8.12：恢复与升级路径更安全',
      leadEn:
        'The desktop-facing release closes several sharp edges around first-run setup, OAuth/no-key presets, and in-app Homebrew upgrades.',
      leadZh:
        '桌面侧这一版集中收掉 first-run setup、OAuth/no-key preset、以及 TUI 内 Homebrew 升级路径上的几个尖角。',
      bulletsEn: [
        'First-run and recovery setup now persist `~/.lingtai-tui/config.json`, preventing repeated setup loops for OAuth or no-key presets.',
        'The in-app Homebrew upgrade prompt now detects other running TUI processes, asks for explicit confirmation, sleeps affected agents, stops old TUIs, and asks the user to relaunch instead of self-execing an old Cellar binary.',
        'The release keeps the upgrade UX discoverable while avoiding the dangerous multi-window upgrade case that can leave old and new TUI processes fighting each other.',
      ],
      bulletsZh: [
        'first-run / recovery setup 现在会持久化 `~/.lingtai-tui/config.json`，避免 OAuth 或 no-key preset 反复进入 setup loop。',
        'TUI 内 Homebrew upgrade prompt 现在会检测其它正在运行的 TUI，要求显式确认，先 sleep 受影响 agent、停止旧 TUI，再提示用户重新启动，而不是从旧 Cellar binary 里自我 exec。',
        '升级入口仍然保留，但避开了多窗口升级时新旧 TUI 进程互相踩状态的危险路径。',
      ],
      whyEn:
        'Install and upgrade paths are the first thing new users touch. They must be boringly reliable before the agent network can feel alive.',
      whyZh:
        '安装与升级路径是新用户最先碰到的地方。它们必须足够稳定，后面的 agent network 才有资格显得“活着”。',
    },
    {
      titleEn: 'MCP is now the human-facing control surface',
      titleZh: 'MCP 成为面向人的控制面',
      leadEn:
        'The TUI command surface now says what the system actually is: external integrations are MCP resources and controls, not a separate addon philosophy.',
      leadZh:
        'TUI 命令面现在回到系统真实边界：外部集成是 MCP resources 与 control panel，而不是另一套 addon 哲学。',
      bulletsEn: [
        '`/mcp` replaces `/addon` as the human-facing command and palette entry.',
        'The MCP control panel copy is reframed around MCP resources, status, and configuration instead of platform-specific onboarding hard-coded in the TUI.',
        'Stale `/addon` references were cleaned across command dispatch, i18n, docs, and packaged recipes.',
      ],
      bulletsZh: [
        '`/mcp` 取代 `/addon`，成为面向人的命令与 palette 入口。',
        '控制面文案改为围绕 MCP resources、status、config，而不是把平台 onboarding 硬编码进 TUI。',
        '命令分发、i18n、文档与 packaged recipes 中陈旧的 `/addon` 引用已清理。',
      ],
      whyEn:
        'This keeps the TUI thin: MCP packages own their own knowledge, while the TUI gives humans a clear doorway into that knowledge.',
      whyZh:
        '这让 TUI 保持薄：MCP 包拥有自己的知识，TUI 只给人一个清楚的入口。',
    },
    {
      titleEn: 'Core capabilities and local dev runtimes are protected',
      titleZh: '核心能力与本地开发 runtime 得到保护',
      leadEn:
        'Setup and preset editing now distinguish the immutable runtime floor from optional model/provider capabilities, while dev-mode kernel installs stay editable and local.',
      leadZh:
        'setup 与 preset editor 现在区分不可缺的 runtime floor 和可选模型/提供商能力；dev-mode kernel install 也保持本地 editable。',
      bulletsEn: [
        'Core/default capabilities are always included; editable preset checkboxes focus on optional capabilities such as web search and vision.',
        '`LINGTAI_DEV_ROOT` is the explicit dev-mode contract for keeping runtime virtualenvs pointed at the local `lingtai-kernel` checkout.',
        'Runtime repair no longer silently turns a developer’s editable install back into a PyPI wheel when the project is meant to test local kernel changes.',
      ],
      bulletsZh: [
        'core/default capabilities 总是包含；preset editor 的可编辑勾选项聚焦 web search、vision 等可选能力。',
        '`LINGTAI_DEV_ROOT` 成为明确的 dev-mode contract，用来让 runtime venv 指向本地 `lingtai-kernel` checkout。',
        'runtime repair 不再在开发者本来要测本地 kernel 时，悄悄把 editable install 改回 PyPI wheel。',
      ],
      whyEn:
        'Users get fewer ways to accidentally remove the ground beneath an agent, and developers get a reliable loop for testing kernel changes.',
      whyZh:
        '用户更不容易误删 agent 脚下的地基；开发者也有了可靠的 kernel 本地测试闭环。',
    },
    {
      titleEn: 'Rust sidecar diagnostics land in `/doctor`',
      titleZh: 'Rust sidecar 诊断进入 `/doctor`',
      leadEn:
        'The TUI now exposes the packaged Rust file-search sidecar status and local Rust/Cargo readiness instead of hiding Python fallback behind symptoms.',
      leadZh:
        'TUI 现在会展示 packaged Rust file-search sidecar 的状态和本地 Rust/Cargo 准备情况，而不是把 Python fallback 藏在症状后面。',
      bulletsEn: [
        '`/doctor` reports packaged Rust sidecar status for the file-search path.',
        'It also reports local Cargo/Rust availability, which matters when rebuilding or diagnosing sidecar fallback.',
        'Startup can now prompt when the system falls back to Python because Cargo is missing.',
      ],
      bulletsZh: [
        '`/doctor` 会报告 file-search 路径的 packaged Rust sidecar 状态。',
        '它也会报告本地 Cargo/Rust 是否可用，方便重建或诊断 sidecar fallback。',
        '当系统因为缺少 Cargo 而 fallback 到 Python 时，启动路径可以给出提示。',
      ],
      whyEn:
        'The Rust-backed line should be diagnosable from the product itself, not only from source checkout archaeology.',
      whyZh:
        'Rust-backed 这一条线应该能从产品自己诊断出来，而不是只能靠翻源码与环境考古。',
    },
    {
      titleEn: 'Kernel v0.11.0 marks the Rust-backed runtime line',
      titleZh: '内核 v0.11.0 标记 Rust-backed runtime 线',
      leadEn:
        'The kernel package on PyPI moves to `0.11.0`, not another patch release, because this release window crosses a rewrite boundary for the Rust-backed runtime pieces.',
      leadZh:
        'PyPI 上的 kernel 包升级到 `0.11.0`，而不是继续 patch 版本，因为这个发布窗口跨过了 Rust-backed runtime pieces 的 rewrite 边界。',
      bulletsEn: [
        'The PyPI package `lingtai==0.11.0` was built from `lingtai-kernel` main commit `3b0758f` and published with both wheel and sdist artifacts.',
        'Release-blocking kernel tests were triaged: stale path/wording/timer expectations were updated, then the full suite passed with `1969 passed, 2 skipped` before the version bump release.',
        'A clean virtualenv install from PyPI verified `import lingtai, lingtai_kernel` and distribution version `0.11.0`.',
      ],
      bulletsZh: [
        'PyPI 包 `lingtai==0.11.0` 从 `lingtai-kernel` main commit `3b0758f` 构建发布，包含 wheel 与 sdist。',
        'kernel release-blocking 测试已经完成归因：陈旧 path / wording / timer 期望被更新后，version bump 前 full suite 通过 `1969 passed, 2 skipped`。',
        '从 PyPI clean virtualenv 安装后已验证 `import lingtai, lingtai_kernel` 与发行版版本 `0.11.0`。',
      ],
      whyEn:
        'The version number now matches the architectural weight of the change, and the public package is verified rather than merely tagged.',
      whyZh:
        '版本号与这次架构变化的重量相匹配；公开包也经过验证，而不是只打了 tag。',
    },
    {
      titleEn: 'Packaged guidance and release discipline were tightened',
      titleZh: '随包指导与发布纪律补强',
      leadEn:
        'This window also updated the guidance agents carry with them: GitHub operations, Claude Code token debugging, and release-log expectations.',
      leadZh:
        '这个发布窗口也更新了 agent 随身携带的操作知识：GitHub 操作、Claude Code stale token 调试、以及 release log 约定。',
      bulletsEn: [
        'Shipped guidance now teaches agents to use `GH_TOKEN` or existing `gh auth` for GitHub operations instead of asking humans to paste shell commands.',
        'Swiss-knife Claude Code docs now explain stale `CLAUDE_CODE_OAUTH_TOKEN` sources, safe `env -u` wrappers, shell startup file diagnostics, and inherited environment gotchas.',
        'The release process now records the two-layer convention: concise GitHub Release notes plus a longer human-facing HTML release log.',
      ],
      bulletsZh: [
        '随包 guidance 现在教 agent 使用 `GH_TOKEN` 或已有 `gh auth` 做 GitHub 操作，而不是要求人类粘贴 shell 命令。',
        'swiss-knife Claude Code 文档补充 stale `CLAUDE_CODE_OAUTH_TOKEN` 来源、安全 `env -u` wrapper、shell startup file 诊断、以及已运行 agent 继承旧环境的坑。',
        '发布流程记录了两层 release 约定：简短 GitHub Release notes，加一份更长的人类可读 HTML release log。',
      ],
      whyEn:
        'Operational knowledge should ship with LingTai. Every release should leave the next release easier to do correctly.',
      whyZh:
        '操作知识应该随 LingTai 一起发布；每一次 release 都应该让下一次 release 更容易做对。',
    },
  ],
  contributors: ['huangzesen', 'TZZheng', 'JieKiYu', 'TatsuKo-Tsukimi', 'ZigongXu'],
  validation: {
    commit: 'a8259ea31bf177f624a50ecacd963cd221fe0b26',
    items: [
      { label: 'TUI tests', result: 'go test ./... passed' },
      { label: 'TUI build/version', result: 'build passed; version v0.8.11-22-ga8259ea before tag' },
      { label: 'Portal web build', result: 'npm ci && npm run build passed' },
      { label: 'Portal Go tests', result: 'go test ./... passed' },
      { label: 'Portal build', result: 'make build passed' },
      { label: 'Kernel full pytest before v0.11.0', result: '1969 passed, 2 skipped' },
      { label: 'Kernel package build/check', result: 'build and twine check passed' },
      { label: 'PyPI verification', result: 'lingtai==0.11.0 latest, wheel + sdist present' },
      { label: 'Clean virtualenv install', result: 'import lingtai and lingtai_kernel succeeded' },
    ],
  },
  links: [
    { label: 'TUI/Portal GitHub release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.8.12' },
    { label: 'Kernel GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.11.0' },
    { label: 'Kernel PyPI', href: 'https://pypi.org/project/lingtai/0.11.0/' },
    {
      label: 'TUI/Portal release commit',
      href: 'https://github.com/Lingtai-AI/lingtai/commit/a8259ea31bf177f624a50ecacd963cd221fe0b26',
    },
    {
      label: 'Kernel release commit',
      href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/3b0758fc7afae5d8007fab34fdfa23e86679c4f1',
    },
  ],
};

const v0_10_10: Release = {
  id: '20260526-1',
  version: 'v0.10.10',
  titleEn: 'LingTai Kernel v0.10.10',
  titleZh: '灵台内核 v0.10.10',
  date: '2026-05-26',
  pkg: 'lingtai',
  tag: 'v0.10.10',
  runtimeNoteEn:
    'This is a kernel/runtime package release. In ordinary LingTai use, the TUI manages the project virtualenv and resolves the kernel package there; bare `pip install lingtai` is for development, diagnostics, or clean-venv validation, not the primary user upgrade path.',
  runtimeNoteZh:
    '这是一次内核/runtime 包发布。普通 LingTai 使用中，TUI 管理项目 virtualenv，并在其中解析内核包；裸 `pip install lingtai` 只适合开发、诊断或 clean-venv 验证，不是主要用户升级路径。',
  summaryEn:
    'A kernel release focused on runtime reliability, daemon extensibility, and MCP/addon communication polish. It adds an OpenCode daemon backend, improves configurable/asynchronous CLI daemon behavior, fixes several long-session recovery and wake-up issues, and improves cross-platform file reads, intrinsic tool manuals, and external communication addons.',
  summaryZh:
    '一次偏“运行时可靠性 + daemon 扩展 + MCP/addon 体验”的内核发布。新增 OpenCode daemon 后端，增强 CLI daemon 的可配置性与异步交互，修复多处长会话恢复/唤醒问题，并补齐跨平台文件读取、内置工具手册、外部通讯 addon 的一组实际体验问题。',
  features: [
    {
      titleEn: 'Daemon backend expansion: OpenCode is now a runnable backend',
      titleZh: 'Daemon 后端扩展：OpenCode 成为可用执行后端',
      leadEn:
        'This release adds `backend="opencode"`, allowing LingTai daemons to run work through OpenCode as an ephemeral parallel execution backend.',
      leadZh:
        '这一版让 LingTai daemon 不再只依赖内置 agent / Claude Code / Codex 路径，而是新增 `backend="opencode"`，可以把 OpenCode 作为一次性并行神识来执行任务。',
      bulletsEn: [
        '`daemon(action="emanate", backend="opencode", ...)` is now part of the daemon backend schema.',
        'The backend invokes `opencode run --format json` and parses JSON events for output, errors, and session ids.',
        'When a resumable OpenCode session id is available, `daemon(action="ask")` resumes with `opencode run --session <id>`.',
        'Session-id extraction is defensive: ordinary event/message ids are no longer mistaken for OpenCode session ids.',
      ],
      bulletsZh: [
        '`daemon(action="emanate", backend="opencode", ...)` 现在是正式 schema 枚举的一部分。',
        '实现会调用 `opencode run --format json`，并从 JSON event stream 中提取输出、错误与 session id。',
        '如果 OpenCode 返回可恢复的 session id，后续 `daemon(action="ask")` 可以用 `opencode run --session <id>` 继续同一上下文。',
        'session id 提取做了防御：不会再把普通 event/message 的裸 `id` 误判成 OpenCode session。',
      ],
      whyEn:
        'LingTai can integrate multi-provider coding agents more easily instead of tying all external execution to a single CLI.',
      whyZh:
        'LingTai 可以更容易接入多供应商 coding agent，而不是把所有外部执行能力绑定到单一 CLI。',
    },
    {
      titleEn: 'Configurable CLI daemons and smoother follow-up interaction',
      titleZh: 'Daemon CLI 可配置性与交互体验增强',
      leadEn:
        'CLI daemon backends now support safe `backend_options` passthrough and avoid blocking the parent agent during follow-up asks.',
      leadZh:
        'CLI daemon 后端现在支持安全透传 `backend_options`，并修复了 CLI daemon follow-up 阻塞父 agent 的问题。',
      bulletsEn: [
        '`backend_options` can be passed to CLI backends such as Claude Code, Codex, and OpenCode for model, agent, permission, or backend-specific flags.',
        'Options are converted safely: booleans become flags, strings/numbers become `--flag value`, lists expand, and unsafe keys or nested objects are rejected.',
        'CLI daemon `ask` now runs in the background instead of blocking the parent agent.',
        'The parent can keep responding to humans or handling tool results while an external CLI daemon continues running.',
      ],
      bulletsZh: [
        '`backend_options` 可以传给 Claude Code / Codex / OpenCode 这类 CLI 后端，用于指定模型、agent、权限或 backend 自己支持的 flag。',
        '参数会经过安全转换：布尔值变成 flag，字符串/数字变成 `--flag value`，列表会展开；不安全 key 与嵌套对象会被拒绝。',
        'CLI daemon 的 `ask` 现在进入后台执行，不会让父 agent 卡在一个长时间命令上。',
        '这让 agent 可以边等待外部 CLI daemon 跑完，边继续响应人类或处理其他工具结果。',
      ],
      whyEn:
        'Daemons behave more like a real asynchronous execution layer — configurable without freezing the primary agent.',
      whyZh:
        'daemon 更像一个真正的异步执行层，既可控又不会拖住主 agent。',
    },
    {
      titleEn: 'Agent recovery and long-session stability fixes',
      titleZh: 'Agent 恢复与长会话稳定性修复',
      leadEn:
        'This release fixes several failure modes that could make agents go silent, fail recovery, or repeatedly wake under complex sessions.',
      leadZh:
        '这一版修了多处会让 agent 在复杂会话中静默、恢复失败或重复唤醒的问题。',
      bulletsEn: [
        'Fixed poll-backoff correlation using the wrong tool result id, preventing agents from appearing idle after repeated inbound reads.',
        'Fixed OpenAI/Codex Responses recovery when history contained a `function_call` without a matching `function_call_output`.',
        'Fixed a livelock where MCP notifications could repeatedly fail to wake an ASLEEP agent.',
        'Fixed refresh-time env-file reload behavior so refreshed agents pick up the intended configuration.',
      ],
      bulletsZh: [
        '修复 poll backoff 相关逻辑使用错误 tool result id 的问题，避免多次 inbound 读取后 agent 进入“看似 idle 但不继续处理”的状态。',
        '修复 OpenAI/Codex Responses 恢复历史中出现 `function_call` 但缺失 `function_call_output` 时触发 400 的问题。',
        '修复 ASLEEP 状态下 MCP notification wake 反复失败形成 livelock 的问题。',
        '修复 refresh 时 env-file reload 覆盖/不生效的问题，让刷新后的 agent 更可靠地继承配置。',
      ],
      whyEn:
        'These are runtime reliability foundations; the longer the task and the richer the tool chain, the more visible the improvement.',
      whyZh:
        '这些不是单点功能，而是运行时可靠性的底座；越长的任务、越复杂的工具链，收益越明显。',
    },
    {
      titleEn: 'File reading, cross-platform behavior, and intrinsic tool manuals',
      titleZh: '文件读取、跨平台与内置工具手册',
      leadEn: 'Text reading now pins UTF-8, and built-in file tools now have first-class manual guidance.',
      leadZh: '文本读取现在固定 UTF-8，并补齐了内置文件工具的正式 manual。',
      bulletsEn: [
        'Fixed UnicodeDecodeError risks on Windows or non-UTF-8 locale hosts by reading text as UTF-8.',
        'Added an intrinsic file manual skill for core file tools such as `read`, `write`, `edit`, `glob`, and `grep`.',
        'This brings intrinsic tools closer to the same “read the manual before operating” discipline used for MCP/addon tools.',
      ],
      bulletsZh: [
        '修复 Windows / 非 UTF-8 locale 环境下文本读取可能按系统默认编码解码、导致 UnicodeDecodeError 的问题。',
        '新增 intrinsic file manual skill，为 `read` / `write` / `edit` / `glob` / `grep` 这类基础工具提供正式使用说明。',
        '这也让内置工具与 MCP/addon 工具在“先读 manual、再操作”的纪律上更一致。',
      ],
      whyEn:
        'Fewer cross-platform read/startup crashes and less chance of agents misusing core file operations.',
      whyZh:
        '减少跨平台启动/读取崩溃，也降低 agent 误用基础文件工具的概率。',
    },
    {
      titleEn: 'MCP/addon communication polish',
      titleZh: 'MCP / addon 通讯体验补齐',
      leadEn:
        'In the same release window, IMAP, Feishu, WeChat, Telegram and related addons received practical communication improvements.',
      leadZh:
        '同一发布窗口中，IMAP、Feishu、WeChat、Telegram 等 addon 的实际通讯体验也有一组补齐。',
      bulletsEn: [
        'IMAP: stale socket handling no longer requires restarting the MCP; tool calls can use bounded reconnect.',
        'IMAP: bare search tokens now fall back to `TEXT` search more compatibly for services like Gmail.',
        'Feishu: fixed orphan typing indicators after p2p send failures, deduplicated replayed incoming events, and aligned conversation context with Telegram.',
        'WeChat: aligned conversation context with Telegram so agents see fuller conversation history.',
        'Telegram / Feishu: added Cleanup / Footprint audit guidance — read-only reports first, destructive cleanup only with user consent.',
      ],
      bulletsZh: [
        'IMAP：修复 stale socket 后必须重启 MCP 的问题；断线后 tool call 可走 bounded reconnect。',
        'IMAP：bare search token 更合理地 fallback 到 `TEXT` 搜索，兼容 Gmail 等服务。',
        'Feishu：修复 p2p 发送失败后 typing indicator 残留；对 replayed incoming events 做 dedupe；conversation context 对齐 Telegram。',
        'WeChat：conversation context 对齐 Telegram，让 agent 看到更完整的对话上下文。',
        'Telegram / Feishu：补 Cleanup / Footprint 审计说明，强调“只读报告优先，破坏性清理必须经用户同意”。',
      ],
      whyEn:
        'External communication addons become more reliable long-lived entry points rather than fragile connections needing manual repair.',
      whyZh:
        '外部通讯 addon 更像可靠的长期入口，而不是需要频繁手动修复的脆弱连接。',
    },
    {
      titleEn: 'TUI state visibility and community contributions',
      titleZh: 'TUI 可视状态与社区贡献',
      leadEn:
        'This release log also includes same-window TUI and community-facing contributions, especially TZZheng’s network activity badge.',
      leadZh:
        '这次 release log 也把同窗口的 TUI/社区贡献列入上下文，尤其是 TZZheng 的 network activity badge。',
      bulletsEn: [
        'The project-level network activity badge can show active / daemon-active / idle / asleep / suspended states.',
        'It addresses the gap where a single agent mind state is not enough to understand whether the whole project network is busy.',
        'The same window also includes local mailbox time display, API-key edit locking, and secondary human update guidance refinements.',
      ],
      bulletsZh: [
        '项目层网络活动 badge 可以显示 active / daemon-active / idle / asleep / suspended 等状态。',
        '它解决的是“只看单 agent mind state 不足以判断整个项目网络是否忙碌”的问题。',
        '同窗口还包括本地邮箱时间显示、API key edit 锁定、secondary human update guidance 等体验修补。',
      ],
      whyEn:
        'LingTai’s collaborative network state is more visible, and community contributions are represented in the official release narrative.',
      whyZh:
        'LingTai 的协作网络状态更可见，社区贡献也被纳入正式 release 叙事。',
    },
  ],
  contributors: ['huangzesen', 'TZZheng', 'TatsuKo-Tsukimi', 'ZigongXu'],
  validation: {
    commit: '3a3e2f063dd82be11f31a576a87648b9e0e50297',
    items: [
      { label: 'python -m compileall -q src', result: 'passed' },
      { label: 'Daemon-focused tests', result: '196 passed' },
      { label: 'File/read-focused tests', result: '31 passed' },
      { label: 'Recovery-focused tests', result: '20 passed' },
      { label: 'python -m build', result: 'passed' },
      { label: 'python -m twine check dist/*', result: 'passed' },
      { label: 'Artifact metadata', result: 'Name: lingtai, Version: 0.10.10' },
      { label: 'Wheel and sdist', result: 'pycache_count=0' },
      { label: 'PyPI JSON verification', result: 'both uploaded files present' },
      { label: 'Clean virtualenv install', result: 'lingtai==0.10.10 succeeded' },
    ],
  },
  links: [
    { label: 'PyPI', href: 'https://pypi.org/project/lingtai/0.10.10/' },
    { label: 'GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.10.10' },
    {
      label: 'Main commit',
      href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/3a3e2f063dd82be11f31a576a87648b9e0e50297',
    },
  ],
};

export const releases: Release[] = [v0_8_15_v0_11_3, v0_8_14_v0_11_2, v0_8_13_v0_11_1, v0_8_12_v0_11_0, v0_10_10];

export function getRelease(id: string): Release | undefined {
  return releases.find((r) => r.id === id);
}
