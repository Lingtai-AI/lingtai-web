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






const v0_15_2_kernel: Release = {
  id: '20260627-2',
  version: 'Kernel v0.15.2',
  titleEn: 'LingTai kernel v0.15.2: roomier result reads and leaner runtime guidance',
  titleZh: 'LingTai kernel v0.15.2：更宽的结果阅读，与更轻的运行时指引',
  date: '2026-06-27',
  pkg: 'lingtai',
  tag: 'kernel v0.15.2',
  runtimeNoteEn:
    'This is a kernel-only patch release. The `lingtai` PyPI package is the runtime package source used by LingTai-managed environments; existing projects should follow their normal TUI-managed refresh or setup path instead of treating a bare global pip command as the everyday upgrade story.',
  runtimeNoteZh:
    '这是一次 kernel-only patch release。`lingtai` PyPI package 是 LingTai-managed environment 使用的 runtime package source；已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作日常升级故事。',
  summaryEn:
    'A compact kernel patch after v0.15.1: Codex summarize/cache behavior now waits for the real reconstruction boundary before resetting websocket continuation, summarize/molt guidance is clearer about local compaction versus provider context, `_meta` exposes current-session token efficiency while shedding duplicated notification prose, and `read` now defaults to a 100k-character page budget while retaining the 200k hard cap for short-lived long-result inspection.',
  summaryZh:
    '这是 v0.15.1 之后的一次紧凑 kernel patch：Codex summarize/cache 行为现在等到真正的重建边界再重置 websocket continuation；summarize/molt 指引更清楚地区分本地压缩与 provider 上下文；`_meta` 暴露 current-session token efficiency，同时移除重复的 notification 文案；`read` 默认页预算提高到 100k 字符，并保留 200k hard cap，用于短时查看长结果。',
  features: [
    {
      titleEn: 'Summarize waits for the reconstruction boundary',
      titleZh: 'summarize 等到重建边界再切换',
      leadEn:
        'The Codex path no longer treats every local summarize as an immediate websocket fresh-epoch event. It waits for the runtime point where provider context is actually rebuilt.',
      leadZh:
        'Codex 路径不再把每次本地 summarize 都当成 websocket fresh-epoch 事件，而是等到运行时真正重建 provider 上下文的边界。',
      bulletsEn: [
        'Codex summarize epoch resets are delayed until provider-side reconstruction is required (#534).',
        'Summarize/molt guidance now explains that local result compaction is immediate, while provider reconstruction is delayed and task-boundary molt is the stronger completed-work boundary (#535).',
      ],
      bulletsZh: [
        'Codex summarize epoch reset 推迟到确实需要 provider-side reconstruction 时才发生（#534）。',
        'summarize/molt 指引现在说明：本地工具结果压缩立即生效，但 provider 重建会延迟；任务边界的 molt 是更强的已完成工作边界（#535）。',
      ],
      whyEn:
        'Keeping the incremental Codex websocket chain alive until the real reconstruction point protects cache continuity without hiding the moment when a full context reset becomes necessary.',
      whyZh:
        '在真正重建之前保持 Codex websocket incremental 链路，可以保护缓存连续性，同时不隐藏必须完整重建上下文的时刻。',
    },
    {
      titleEn: 'Token efficiency is visible without repeating guidance',
      titleZh: 'token efficiency 可见，但不重复塞满指引',
      leadEn:
        'The runtime now gives agents the compact numbers they need to reason about current-session token economy while moving static instruction text back into resident guidance.',
      leadZh:
        '运行时现在给 agent 提供判断 current-session token economy 所需的紧凑数字，同时把静态说明文字移回常驻 guidance。',
      bulletsEn: [
        '`_meta.agent_meta.token_efficiency` exposes API calls, input/cached tokens, cache rate, average input tokens, and current context size/window (#537).',
        'Notification guidance is now a `meta_guidance.notification_handling` hook with source names, per-channel duplicate guidance is removed, and tool-result char leaders are capped to the top five (#538).',
        'The post-reconstruction reminder now points at `0.6 * context_window` as the summarize-then-molt threshold instead of carrying a separate guiding-average field (#538).',
      ],
      bulletsZh: [
        '`_meta.agent_meta.token_efficiency` 暴露 API calls、input/cached tokens、cache rate、average input tokens，以及当前 context size/window（#537）。',
        'notification guidance 现在是带 source 名称的 `meta_guidance.notification_handling` hook，移除 per-channel 重复 guidance，并把 tool-result char leaders 收到 top five（#538）。',
        '重建后的提醒现在指向 `0.6 * context_window` 作为 summarize-then-molt 阈值，不再携带单独的 guiding-average 字段（#538）。',
      ],
      whyEn:
        'A long-running agent needs the live budget numbers, not repeated static prose. This patch keeps the signal and cuts the duplicated context weight.',
      whyZh:
        '长时间运行的 agent 需要实时预算数字，而不是重复的静态长文。这次 patch 保留信号，削掉重复上下文重量。',
    },
    {
      titleEn: 'A 100k read default with a 200k hard ceiling',
      titleZh: 'read 默认 100k，hard cap 保持 200k',
      leadEn:
        'With summarize and molt carrying the cleanup path, short-lived long-result inspection can be roomier by default.',
      leadZh:
        '有 summarize 与 molt 负责后续清理后，短时间查看长结果可以默认更宽一些。',
      bulletsEn: [
        '`read` now defaults to a 100k-character per-call page budget while keeping the 200k runtime hard cap.',
        'The read manual, English/Chinese/Wen tool descriptions, continuation tests, and stale tool-result-cap comments were aligned with the new budget.',
        'Release validation covered the full kernel suite, build, `twine check`, archive inspection, PyPI upload, GitHub release, and no-cache pip index verification.',
      ],
      bulletsZh: [
        '`read` 的默认每次调用页预算提高到 100k 字符，同时保持 200k runtime hard cap。',
        'read manual、英文/中文/文言工具描述、continuation 测试，以及陈旧的 tool-result-cap 注释都已对齐新预算。',
        'release 验证覆盖完整 kernel suite、build、`twine check`、archive inspection、PyPI 上传、GitHub release 与 no-cache pip index verification。',
      ],
      whyEn:
        'The everyday page size should match the new operating model: inspect enough context to decide, then summarize or molt deliberately instead of losing useful evidence to an overly tight cap.',
      whyZh:
        '日常页大小应当匹配新的运行模型：先看到足够上下文做判断，再主动 summarize 或 molt，而不是让过紧的 cap 提前丢掉有用证据。',
    },
  ],
  contributors: ['huangzesen'],
  validation: {
    commit: '603e5d854ed7b3752ab59c63cbcd09069e6494ea',
    items: [
      { label: 'Kernel release PR', result: '#539 merged at 603e5d854ed7b3752ab59c63cbcd09069e6494ea' },
      { label: 'git diff --check', result: 'passed' },
      { label: 'Kernel full pytest', result: '3040 passed, 4 skipped with PYTHONPATH=src' },
      { label: 'Focused read/cap tests', result: '20 passed' },
      { label: 'Build and twine check', result: 'sdist + macOS-arm64 wheel built; both PASSED twine check' },
      { label: 'Archive inspection', result: 'no __pycache__ or .pyc files in wheel or sdist' },
      { label: 'Artifact hashes', result: 'wheel 2854c7aa…36aa4; sdist 5bd4976b…93ae' },
      { label: 'PyPI verification', result: 'JSON and pip index --no-cache-dir both show lingtai 0.15.2' },
      { label: 'GitHub release', result: 'v0.15.2 published at merge commit 603e5d8' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.2' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.15.2/' },
    { label: 'Release report', href: 'https://github.com/Lingtai-AI/lingtai-kernel/tree/main/reports/kernel-release-v0.15.2-20260627' },
    { label: 'Release PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/539' },
    { label: 'Compare', href: 'https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.15.1...v0.15.2' },
  ],
};

const v0_15_1_kernel_v0_10_1_tui: Release = {
  id: '20260627-1',
  version: 'Kernel v0.15.1 · TUI/Portal v0.10.1',
  titleEn: 'LingTai release day: self-updating TUI, Claude Code provider, and steadier runtime state',
  titleZh: 'LingTai release day：自我更新的 TUI、Claude Code provider，与更稳的 runtime 状态',
  date: '2026-06-27',
  pkg: 'lingtai + lingtai-tui',
  tag: 'kernel v0.15.1 · TUI/Portal v0.10.1',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The Homebrew command updates the TUI/Portal surface. A source / user-local TUI can now also update itself in place (manual command or startup prompt) without Homebrew. The kernel package `lingtai` v0.15.1 is the runtime package source used by LingTai-managed environments; existing projects should follow their normal TUI-managed refresh or setup path rather than treating a bare global pip command as the user upgrade story. This entry was prepared from clean release-worktree gates; the GitHub Releases, PyPI upload, and Homebrew tap bump for v0.10.1 / v0.15.1 are published.',
  runtimeNoteZh:
    '上面的 Homebrew 命令用于更新 TUI/Portal。source / user-local 的 TUI 现在也可以原地自我更新（手动命令或启动提示），无需 Homebrew。Kernel package `lingtai` v0.15.1 是 LingTai-managed environment 使用的 runtime package source；已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作普通用户升级故事。本条目由干净的 release-worktree gate 准备；v0.10.1 / v0.15.1 的 GitHub Releases、PyPI 上传与 Homebrew tap bump 已发布。',
  summaryEn:
    'A paired patch release that finishes the self-update story the previous window started for Homebrew: the source / user-local TUI can now update itself — manually and on startup — for installs that are not Homebrew-managed. The kernel adds a `claude-code` LLM provider, an MCP manual sidecar contract with bundled manuals for curated MCPs, shared filesystem/JSON/JSONL helpers and a session-recovery refactor that de-risk kernel state writes, and honest spill/refresh failure visibility — plus cockpit, doctor, and mail polish.',
  summaryZh:
    '一组配套的 patch release，补完上一轮为 Homebrew 开头的「自我更新」故事：source / user-local 的 TUI 现在可以自我更新——手动地、也在启动时——面向非 Homebrew 管理的安装。kernel 新增 `claude-code` LLM provider、一份为 curated MCP 提供捆绑手册的 MCP manual sidecar 契约、降低 kernel 状态写入风险的共享文件系统/JSON/JSONL helper 与一次 session-recovery 重构，以及对 spill/refresh 失败更诚实的可见性——外加座舱、doctor 与 mail 的打磨。',
  features: [
    {
      titleEn: 'The source / user-local TUI updates itself (#404 complete)',
      titleZh: 'source / user-local 的 TUI 自我更新（#404 补完）',
      leadEn:
        'v0.10.0 shipped the Homebrew updater backend; v0.10.1 completes issue #404 for installs that are not Homebrew-managed, so the TUI can keep itself current however it was installed.',
      leadZh:
        'v0.10.0 发布了 Homebrew 更新后端；v0.10.1 为非 Homebrew 管理的安装补完 issue #404，让 TUI 无论怎样安装都能保持最新。',
      bulletsEn: [
        'A manual TUI self-update command (#416) and a source-install self-update backend (#417) bring update-in-place to source / user-local installs.',
        'A startup update prompt (#418) offers the update when the on-disk source drifts behind the published TUI, so an operator is told when they are behind.',
        'These build on the v0.10.0 foundation — Homebrew updater backend, doctor install-method detection, and source-install metadata — now extended to non-Homebrew installs.',
      ],
      bulletsZh: [
        '一个手动 TUI self-update 命令（#416）与一个 source 安装的 self-update 后端（#417），把原地更新带给 source / user-local 安装。',
        '一个启动更新提示（#418），在磁盘源码落后于已发布 TUI 时提供更新，让操作者在落后时被告知。',
        '这些建立在 v0.10.0 的基础之上——Homebrew 更新后端、doctor 安装方式检测与 source 安装元数据——现在扩展到非 Homebrew 安装。',
      ],
      whyEn:
        'A self-update path that only works for Homebrew leaves source and user-local users stranded on stale binaries; finishing #404 means the TUI stays current and honest about its own version regardless of how it was installed.',
      whyZh:
        '一条只对 Homebrew 有效的 self-update 路径，会把 source 与 user-local 用户搁浅在陈旧二进制上；补完 #404 意味着 TUI 无论怎样安装都保持最新，并对自己的版本保持诚实。',
    },
    {
      titleEn: 'A `claude-code` provider for the kernel (#525)',
      titleZh: '给 kernel 的 `claude-code` provider（#525）',
      leadEn:
        'The kernel gains a new `claude-code` LLM provider that drives a Claude subscription through the `claude` CLI, widening how an operator can back the runtime without changing the cockpit they already use.',
      leadZh:
        'kernel 新增一个 `claude-code` LLM provider，经由 `claude` CLI 驱动一个 Claude 订阅，拓宽操作者在不改动既有座舱的前提下支撑运行时的方式。',
      bulletsEn: [
        'The `claude-code` provider drives the `claude` CLI on a Claude subscription as an LLM provider (#525).',
        'It was originally proposed in closed PR #299 and merged this window — the originating contributor is credited.',
      ],
      bulletsZh: [
        '`claude-code` provider 把 Claude 订阅上的 `claude` CLI 当作 LLM provider 来驱动（#525）。',
        '它最初由已 closed 的 PR #299 提出，并在本窗口合并——原始贡献者已致谢。',
      ],
      whyEn:
        'More provider choices behind the same runtime mean an operator can back a fleet the way their account and budget allow, without re-learning the cockpit.',
      whyZh:
        '同一个运行时背后更多的 provider 选择，意味着操作者可以按自己的账户与预算来支撑 fleet，而无需重新学习座舱。',
    },
    {
      titleEn: 'MCP manual sidecars and bundled curated manuals',
      titleZh: 'MCP manual sidecar 与捆绑的 curated 手册',
      leadEn:
        'The kernel documents a manual sidecar contract for MCP addons and ships bundled manuals for curated MCPs, so an MCP can carry usage guidance the runtime can surface.',
      leadZh:
        'kernel 为 MCP addon 记录了一份 manual sidecar 契约，并为 curated MCP 附带捆绑手册，让一个 MCP 能携带运行时可呈现的使用引导。',
      bulletsEn: [
        'The MCP manual sidecar anatomy and a minimal sidecar contract are documented (#529, #530).',
        'Bundled manuals ship for curated MCPs (#528), and a Telegram media guidance manual is added (#526).',
      ],
      bulletsZh: [
        'MCP manual sidecar 的结构与一份最小 sidecar 契约被记录在案（#529、#530）。',
        '为 curated MCP 附带捆绑手册（#528），并新增一份 Telegram 媒体引导手册（#526）。',
      ],
      whyEn:
        'An MCP that carries its own manual lets the runtime answer "how do I use this addon" from a documented source instead of guesswork, which matters most for media and messaging surfaces.',
      whyZh:
        '一个自带手册的 MCP，让运行时能从有据可查的来源回答「我该怎么用这个 addon」，而不是靠猜——这对媒体与消息类接口尤其重要。',
    },
    {
      titleEn: 'Safer kernel state writes and a recovery refactor',
      titleZh: '更安全的 kernel 状态写入与一次 recovery 重构',
      leadEn:
        'Two kernel refactors reduce the number of hand-rolled, slightly-different state writes that a long-running fleet can corrupt: shared filesystem helpers, and a session-recovery / tool-execution consolidation.',
      leadZh:
        '两次 kernel 重构减少了那些手写的、各自略有差异、可能被长任务 fleet 写坏的状态写入：共享的文件系统 helper，以及 session-recovery / 工具执行的合并。',
      bulletsEn: [
        'Shared `_fsutil` filesystem / JSON / JSONL helpers consolidate how the kernel reads and writes state (#510, #522), with migration references documented.',
        'Session-recovery and ToolExecutor helpers are consolidated in `turn.py`, renaming `_post_send_housekeeping` to `_turn_boundary_housekeeping` (#511, #523).',
      ],
      bulletsZh: [
        '共享的 `_fsutil` 文件系统 / JSON / JSONL helper 统一了 kernel 读写状态的方式（#510、#522），并记录了迁移引用。',
        'session-recovery 与 ToolExecutor helper 在 `turn.py` 中合并，把 `_post_send_housekeeping` 重命名为 `_turn_boundary_housekeeping`（#511、#523）。',
      ],
      whyEn:
        'Every slightly-different state-write path is a place a fleet can corrupt a file under load; routing them through shared, tested helpers makes the runtime steadier across long unattended sessions.',
      whyZh:
        '每一条略有差异的状态写入路径，都是 fleet 在负载下写坏文件的潜在地点；把它们经由共享且经过测试的 helper，让运行时在长时间无人值守的会话里更稳。',
    },
    {
      titleEn: 'Spill and refresh told truthfully',
      titleZh: '把 spill 与 refresh 如实说清',
      leadEn:
        'Failures that used to pass silently now surface: an expired spill artifact says so, a permanent refresh failure is visible, and headless runtime liveness can be proven.',
      leadZh:
        '过去会悄悄通过的失败现在会浮现：过期的 spill 工件会说明、refresh 的永久失败可见，且 headless 运行时存活性可被证明。',
      bulletsEn: [
        'Expired-spill artifacts now carry messaging instead of failing opaquely (#192, #291), and a permanent refresh failure is made visible (#292).',
        'A headless runtime liveness proof confirms an unattended runtime is actually alive (#351).',
        'Codex pre-molt summarize guidance is made clearer (#531).',
      ],
      bulletsZh: [
        '过期的 spill 工件现在带消息，而不是不透明地失败（#192、#291），refresh 的永久失败被变得可见（#292）。',
        '一份 headless 运行时存活性证明，确认一个无人值守的运行时确实活着（#351）。',
        'Codex pre-molt summarize 引导被变得更清晰（#531）。',
      ],
      whyEn:
        'A spill or refresh that fails silently is exactly the kind of fault a long autonomy run discovers too late; surfacing them lets an operator act before the failure compounds.',
      whyZh:
        '一个悄悄失败的 spill 或 refresh，正是长时间自治运行会发现得太晚的那类故障；把它们浮现出来，让操作者能在失败累积之前行动。',
    },
    {
      titleEn: 'Cockpit and doctor polish',
      titleZh: '座舱与 doctor 打磨',
      leadEn:
        'Around the headline work, the cockpit and doctor got a focused polish pass, and a headless agent-readiness reliability fix landed alongside.',
      leadZh:
        '围绕主线工作，座舱与 doctor 经过一轮聚焦的打磨，并随之落地一个 headless agent 就绪可靠性修复。',
      bulletsEn: [
        'Cockpit: a live agent-activity indicator on the mail view footer (#422), mail view copy mode (#402), and the live `/viz` ghost-avatar visibility fix (#354).',
        'Doctor: a saved redacted report bundle with a privacy notice and export hint, install-method detection, and a diagnostic-section layout clarification (#406, #407, #409, #449, #450).',
        'Reliability: wait for headless agent readiness before proceeding (#365), plus dev-guide release-workflow docs and README install-method output (#448).',
      ],
      bulletsZh: [
        '座舱：mail 视图底栏的实时 agent 活动指示（#422）、mail 视图复制模式（#402），以及实时 `/viz` ghost-avatar 可见性修复（#354）。',
        'doctor：保存一份脱敏的报告 bundle，带隐私提示与导出提示、安装方式检测，以及诊断分区布局澄清（#406、#407、#409、#449、#450）。',
        '可靠性：在继续之前等待 headless agent 就绪（#365），外加 dev-guide 的 release-workflow 文档与 README 安装方式输出（#448）。',
      ],
      whyEn:
        'A patch window is the right place to clear small cockpit and doctor papercuts; an operator who can see agent activity, copy from the mail view, and read a clean diagnostic report trusts the surface more in a long session.',
      whyZh:
        '一个 patch 窗口正是清理座舱与 doctor 小毛刺的好时机；一个能看到 agent 活动、能从 mail 视图复制、能读到干净诊断报告的操作者，会在长会话里更信任这个界面。',
    },
    {
      titleEn: 'Release hygiene, validation, and contributors',
      titleZh: 'release hygiene、验证与贡献者',
      leadEn:
        'The paired patch versions — TUI/Portal v0.10.1 and kernel v0.15.1 — were validated from clean release worktrees before the publish step.',
      leadZh:
        '这对 patch 版本——TUI/Portal v0.10.1 与 kernel v0.15.1——在 publish 步骤之前从干净的 release worktree 完成验证。',
      bulletsEn: [
        'Kernel gates at the v0.15.1 bump commit `2d23801` (on base `834ce8b`): `compileall` clean; full `pytest` 3034 passing, 4 skipped, 0 genuine failures (three subprocess-import failures proven to be local PYTHONPATH / non-installed-package artifacts, green on re-check with `PYTHONPATH=src`); `python -m build` produced sdist + wheel; `twine check` PASSED on both.',
        'TUI/Portal gates at candidate head `418e470` (build version injected via `make ... VERSION=v0.10.1`, no source bump): `git diff --check` against v0.10.0 clean; full Portal Go tests passed; `portal/web npm ci && npm run build` passed; `make build` produced the TUI and Portal binaries.',
        'Noted, non-blocking: two `internal/config` install-detection tests failed only on the maintainer machine because local `/usr/local`/`/opt/homebrew` dev symlinks resolve out of the Homebrew prefix — classified as host / test-isolation sensitivity, with the underlying classifier verified to return `homebrew` on a clean path; the `portal/web` npm-audit advisories affect dev-only tooling, not the embedded static assets the Go binary ships; the locally built kernel wheel is macOS-arm64 platform-tagged, so the portable sdist is the artifact for PyPI.',
        'Contributors in this window: @huangzesen (lead, scope and validation owner), @TZZheng (the source self-update epic and the kernel filesystem/recovery refactors), @wchwawa (the live mail-view agent activity indicator), @rawpaper123 (headless readiness and liveness reliability fixes), @LuuOW (review of the `/viz` ghost-avatar fix), @zechenzhangAGI (originated the `claude-code` provider in a closed kernel PR before the shipped implementation landed through #525), and @9s5bz2jvd2-lang (closed/unmerged `/kanban` main/daemon API-call split PR #367, reviewed and thanked inside the release window).',
      ],
      bulletsZh: [
        '在 v0.15.1 bump commit `2d23801`（基于 `834ce8b`）上的 kernel gate：`compileall` 通过；完整 `pytest` 3034 passing、4 skipped、0 真实失败（三个 subprocess-import 失败被证明是本地 PYTHONPATH / 包未安装的工件，用 `PYTHONPATH=src` 复查转绿）；`python -m build` 产出 sdist + wheel；`twine check` 两者均 PASSED。',
        '在候选 head `418e470`（构建版本经由 `make ... VERSION=v0.10.1` 注入，无源码 bump）上的 TUI/Portal gate：对比 v0.10.0 的 `git diff --check` 干净；完整 Portal Go 测试通过；`portal/web npm ci && npm run build` 通过；`make build` 产出 TUI 与 Portal 二进制。',
        '记录在案、不阻塞发布：两个 `internal/config` 安装检测测试只在维护者机器上失败，因为本地 `/usr/local`/`/opt/homebrew` dev 符号链接被解析到 Homebrew prefix 之外——归类为 host / 测试隔离敏感性，底层分类器已验证在干净路径上返回 `homebrew`；`portal/web` 的 npm-audit 警告只影响 dev-only 工具链，不影响 Go 二进制实际打包的静态资产；本地构建的 kernel wheel 带 macOS-arm64 平台标签，因此 PyPI 的工件是可移植的 sdist。',
        '本窗口贡献者：@huangzesen（lead，scope 与验证负责人）、@TZZheng（source self-update epic 与 kernel 的文件系统/recovery 重构）、@wchwawa（mail 视图实时 agent 活动指示）、@rawpaper123（headless 就绪与存活性可靠性修复）、@LuuOW（`/viz` ghost-avatar 修复的 review）、@zechenzhangAGI（在 closed kernel PR 中提出 `claude-code` provider，后由 #525 落地），以及 @9s5bz2jvd2-lang（closed/unmerged `/kanban` main/daemon API-call 拆分 PR #367，在窗口内完成 review 与致谢后关闭）。',
      ],
      whyEn:
        'A patch still deserves full gate evidence and an honest contributor list; recording that the publish artifacts and tags are cut from these exact validated commits is part of shipping responsibly.',
      whyZh:
        '一次 patch 同样值得有完整的 gate 证据与诚实的贡献者列表；记录「publish 工件与 tag 正是从这些经过验证的 commit 切出」，是负责任地发布的一部分。',
    },
  ],
  contributors: ['huangzesen', 'TZZheng', 'wchwawa', 'rawpaper123', 'LuuOW', 'zechenzhangAGI', '9s5bz2jvd2-lang'],
  validation: {
    commit:
      '2d2380186ace612770b91d4c93260318618020bf (kernel v0.15.1 bump, base 834ce8b) / 418e4706277bbf12e4366ad81696284cd6160012 (TUI/Portal v0.10.1 build target)',
    items: [
      { label: 'Kernel compileall', result: 'src + tests compiled clean' },
      { label: 'Kernel full pytest', result: '3034 passing, 4 skipped, 0 genuine failures (3 subprocess-import failures proven local-env artifacts, green on re-check with PYTHONPATH=src)' },
      { label: 'Kernel build and twine check', result: 'sdist + wheel built; both PASSED' },
      { label: 'Kernel version bump', result: 'single pyproject.toml line, 0.15.0 → 0.15.1' },
      { label: 'TUI diff-check', result: 'clean against v0.10.0' },
      { label: 'TUI Go tests/build', result: 'go test passed (2 install-detection tests failed only on host dev-symlinks, non-blocking); make build → lingtai-tui v0.10.1' },
      { label: 'Portal web npm ci/build', result: 'passed (dev-only npm audit advisories noted, not in shipped static assets)' },
      { label: 'Portal Go tests/build', result: 'go test passed; make build → lingtai-portal v0.10.1' },
      { label: 'PyPI artifact policy', result: 'portable sdist is the PyPI artifact; local wheel is macOS-arm64 platform-tagged' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.1' },
    { label: 'TUI/Portal release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.1' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.15.1/' },
    { label: 'Homebrew tap', href: 'https://github.com/Lingtai-AI/homebrew-lingtai' },
    { label: 'Companion blog', href: 'https://lingtai.ai/en/blog/release-day-2026-06-27/' },
  ],
};

const v0_15_0_kernel_v0_10_0_tui: Release = {
  id: '20260626-1',
  version: 'Kernel v0.15.0 · TUI/Portal v0.10.0',
  titleEn: 'LingTai release day: a cockpit that shows where the tokens go',
  titleZh: 'LingTai release day：让座舱看清 token 花在哪里',
  date: '2026-06-26',
  pkg: 'lingtai + lingtai-tui',
  tag: 'kernel v0.15.0 · TUI/Portal v0.10.0',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The Homebrew command updates the TUI/Portal surface once tag v0.10.0 is published. The kernel package `lingtai` v0.15.0 is the runtime package source used by LingTai-managed environments; existing projects should follow their normal TUI-managed refresh or setup path rather than treating a bare global pip command as the user upgrade story. This entry was prepared from clean release-worktree gates; the GitHub Releases, PyPI upload, and Homebrew tap bump for v0.10.0 / v0.15.0 are cut as part of the publish step.',
  runtimeNoteZh:
    '上面的 Homebrew 命令在 tag v0.10.0 发布后用于更新 TUI/Portal。Kernel package `lingtai` v0.15.0 是 LingTai-managed environment 使用的 runtime package source；已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作普通用户升级故事。本条目由干净的 release-worktree gate 准备；v0.10.0 / v0.15.0 的 GitHub Releases、PyPI 上传与 Homebrew tap bump 在 publish 步骤中完成。',
  summaryEn:
    'A paired kernel and TUI/Portal release built around one idea: make the cockpit honest about where a session spends its tokens. The TUI grows home and session token telemetry — a context-percentage bar and per-round usage — followed by a focused copy and layout pass, bilingual status hints, less noisy replay, richer session/kanban observability, and faster SQLite-indexed session loading. The kernel makes bash results report inner failures, routes refresh-watcher events through the secret redactor, indexes the token ledger in SQLite with an explicit reporting scope, writes a per-run daemon artifact manifest, nudges agents when on-disk source drifts from the running runtime, and tunes Codex summarize guidance after framing it as an investment ratio.',
  summaryZh:
    '这是一组配套的 kernel 与 TUI/Portal 发布，围绕一个想法：让座舱对「一个会话把 token 花在哪里」保持诚实。TUI 新增了 home 与 session 的 token 遥测——context 百分比条与按轮用量——随后是一轮聚焦的文案与布局打磨、双语状态提示、更安静的回放、更丰富的 session/kanban 可观测性，以及更快的 SQLite 索引会话加载。kernel 让 bash 结果报告内层失败，把 refresh-watcher 事件经由密钥脱敏器写出，用 SQLite 索引 token ledger 并带显式的报告 scope，为每次 daemon run 写出 artifact manifest，在磁盘源码与运行时漂移时提醒 agent，并在把 Codex summarize 引导表述为一个投资比率之后微调了它的阈值。',
  features: [
    {
      titleEn: 'A cockpit that shows where the tokens go',
      titleZh: '看清 token 花在哪里的座舱',
      leadEn:
        'TUI/Portal v0.10.0 brings token and context telemetry into the places operators already look — the home view and the per-round API-call footer — instead of hiding it behind a metadata dump.',
      leadZh:
        'TUI/Portal v0.10.0 把 token 与 context 遥测带到操作者本就会看的地方——home 视图与按轮的 API-call 底栏——而不是藏在一段 metadata 转储后面。',
      bulletsEn: [
        'API-call group footers now show current-round token usage — input, cache miss, output, and cache rate — so the price of a turn is visible right where the call is (#441).',
        'The home view bottom row shows current-session token telemetry plus a compact context-percentage bar, so a session\'s budget is legible at a glance (#441).',
        'Ctrl+O replay hides the bulky `_meta` envelope by default and points to `/notification` when full metadata is actually wanted (#440).',
      ],
      bulletsZh: [
        'API-call 分组底栏现在显示当前轮的 token 用量——input、cache miss、output 与 cache rate——让一个 turn 的代价就出现在调用旁边（#441）。',
        'home 视图底部一行显示当前会话的 token 遥测与一个紧凑的 context 百分比条，让一个会话的预算一眼可读（#441）。',
        'Ctrl+O 回放默认隐藏臃肿的 `_meta` 信封，并在真正需要完整 metadata 时指向 `/notification`（#440）。',
      ],
      whyEn:
        'You cannot trim what you cannot see; putting per-round token cost and session context in the default view is the first step toward an operator noticing a session that is quietly burning budget.',
      whyZh:
        '看不见就无法削减；把按轮 token 代价与会话 context 放进默认视图，是让操作者注意到「某个会话正在悄悄烧预算」的第一步。',
    },
    {
      titleEn: 'Telemetry copy and layout, made legible (#442–#447)',
      titleZh: '把遥测文案与布局打磨清楚（#442–#447）',
      leadEn:
        'New telemetry is only useful if it reads cleanly, so the home telemetry work was followed by a focused copy-and-layout pass that kept the footer, fixed the layout, and made the status hints bilingual and correct.',
      leadZh:
        '新遥测只有读起来干净才有用，因此 home 遥测之后跟着一轮聚焦的文案与布局打磨：保留底栏、修正布局，并让状态提示双语且正确。',
      bulletsEn: [
        'The footer is preserved while session telemetry is shown (#442), and session telemetry no longer requires Ctrl+O to appear (#443).',
        'The home telemetry context row layout is fixed (#444), and the home status hint and zh telemetry copy are cleaned up (#445).',
        'The home status hint is corrected to say "expand" (#446) and then localized so it speaks the operator\'s language (#447, the TUI candidate head).',
      ],
      bulletsZh: [
        '在显示 session 遥测时保留底栏（#442），且 session 遥测不再需要 Ctrl+O 才出现（#443）。',
        '修正 home 遥测的 context 行布局（#444），并清理 home 状态提示与中文遥测文案（#445）。',
        'home 状态提示改正为「expand」（#446），随后被本地化，让它用操作者的语言说话（#447，即 TUI 候选 head）。',
      ],
      whyEn:
        'A telemetry row that overflows, hides the footer, or shows an English-only hint to a Chinese operator undoes the value of the data; this pass is what turns a feature into something readable by default.',
      whyZh:
        '一个会溢出、会盖住底栏、或对中文操作者只显示英文提示的遥测行，会抵消数据本身的价值；这一轮打磨，正是把一个功能变成「默认可读」的关键。',
    },
    {
      titleEn: 'Richer session observability and faster loading',
      titleZh: '更丰富的会话可观测性与更快的加载',
      leadEn:
        'Beyond the home row, session and kanban detail panels carry more cached per-session stats, keyed to molt windows so a refresh stops drifting, and session events now load from a SQLite index instead of re-scanning files.',
      leadZh:
        '除了 home 行之外，session 与 kanban 详情面板携带更多缓存的按会话统计，并以 molt 窗口为键，使 refresh 不再漂移；会话事件现在从 SQLite 索引加载，而不是重新扫描文件。',
      bulletsEn: [
        'Session/kanban detail panels show richer cached per-session stats — API call stats, expanded token breakdowns, and agent paths — keyed to molt windows so refreshes stop drifting (#428, #430, #432, #433, #438, #439).',
        'Session events load from the SQLite index instead of re-scanning event files, so opening a long session is faster (#435).',
        'The markdown viewer renders YAML front matter (`name` / `description` / `version`) instead of silently stripping it (#426).',
      ],
      bulletsZh: [
        'session/kanban 详情面板显示更丰富的缓存按会话统计——API 调用统计、展开的 token 拆分与 agent 路径——并以 molt 窗口为键，使 refresh 不再漂移（#428、#430、#432、#433、#438、#439）。',
        '会话事件从 SQLite 索引加载，而不是重新扫描事件文件，因此打开一个长会话更快（#435）。',
        'markdown 查看器渲染 YAML front matter（`name` / `description` / `version`），而不是悄悄把它剥掉（#426）。',
      ],
      whyEn:
        'Observability that drifts on every refresh or pays a full re-scan to open a session is observability operators stop trusting; pinning stats to molt windows and reading from the index keeps it both correct and fast.',
      whyZh:
        '每次 refresh 都漂移、或每次打开会话都要重新全扫的可观测性，会让操作者逐渐不再信任它；把统计钉在 molt 窗口、从索引读取，让它既正确又快。',
    },
    {
      titleEn: 'Bash results and the token ledger tell the truth',
      titleZh: 'bash 结果与 token ledger 说真话',
      leadEn:
        'Kernel v0.15.0 makes two of the runtime\'s most-trusted signals harder to misread: a completed bash command now reports whether its inner command actually succeeded, and the token ledger is indexed with an explicit reporting scope.',
      leadZh:
        'Kernel v0.15.0 让运行时最被信任的两个信号更难被误读：完成的 bash 命令现在会报告它的内层命令是否真的成功，token ledger 也带着显式的报告 scope 被索引。',
      bulletsEn: [
        'Completed bash commands carry additive, model-visible `ok` / `command_status` / `warning` fields, so a nonzero inner exit or a Python traceback no longer hides under `status: ok`; the `status` field keeps its old meaning for compatibility.',
        'The token ledger is indexed in SQLite, and `sum_token_ledger` gains an explicit `scope` — `main_agent` excludes daemon rows, `all` includes them — with parent/child double-count semantics documented and tested.',
        'Tool-result top-list metadata is trimmed and the latest agent-meta payload is slimmed, so the model spends fewer tokens on its own bookkeeping (#490, #516).',
      ],
      bulletsZh: [
        '完成的 bash 命令携带附加的、模型可见的 `ok` / `command_status` / `warning` 字段，使得非零内层退出或 Python traceback 不再藏在 `status: ok` 之下；`status` 字段为兼容保留旧含义。',
        'token ledger 在 SQLite 中被索引，`sum_token_ledger` 新增显式 `scope`——`main_agent` 排除 daemon 行，`all` 包含它们——并记录与测试了 parent/child 重复计数语义。',
        'tool-result 顶部列表 metadata 被精简，最新的 agent-meta 负载被瘦身，让模型在自己的记账上花更少 token（#490、#516）。',
      ],
      whyEn:
        'An agent that reads `status: ok` as success when the inner command failed, or that cannot say whether a token total includes its daemons, makes confidently wrong decisions; these changes make the signal match reality.',
      whyZh:
        '一个把 `status: ok` 当成成功（而内层命令其实失败了），或说不清一个 token 总数是否包含它的 daemon 的 agent，会自信地做出错误决定；这些改动让信号与现实一致。',
    },
    {
      titleEn: 'Secret redaction, source drift, and daemon artifacts',
      titleZh: '密钥脱敏、源码漂移与 daemon 工件',
      leadEn:
        'Several kernel changes harden the seams where a long-running fleet is most exposed: a separate-process event log that could leak secrets, source that silently drifts from the running runtime, and daemon runs that were expensive to inspect.',
      leadZh:
        '若干 kernel 改动加固了长任务 fleet 最暴露的接缝：一个可能泄露密钥的独立进程事件日志、悄悄与运行时漂移的源码，以及检查代价高昂的 daemon run。',
      bulletsEn: [
        'The relaunch/refresh watcher subprocess now routes `events.jsonl` writes through the kernel redactor (key-aware, fail-open with a diagnosable `redaction_unavailable` marker), closing a separate-process gap where stderr tails, cmdlines, or errors could persist secret-shaped values.',
        'Startup runtime fingerprints (git HEAD + source digest) land in `.status.json`; agents emit `source_drift` nudges when on-disk source diverges from the running runtime, and `lingtai-doctor` reports them — skipped in dev runtimes (closes #178).',
        'Each daemon run writes a metadata-only `artifacts.json`, so `daemon(action="check")` can surface path, size, mtime, and role without scanning the run directory, with safe fallback for older runs.',
      ],
      bulletsZh: [
        'relaunch/refresh watcher 子进程现在把 `events.jsonl` 写入经由 kernel 脱敏器（key-aware、fail-open，并带可诊断的 `redaction_unavailable` 标记），堵住了一个独立进程里 stderr 尾部、命令行或错误可能持久化密钥状值的缺口。',
        '启动时的运行时指纹（git HEAD + 源码摘要）写入 `.status.json`；当磁盘源码与运行时分叉时，agent 发出 `source_drift` 提醒，`lingtai-doctor` 也会报告——在 dev 运行时跳过（关闭 #178）。',
        '每次 daemon run 写出一个仅含 metadata 的 `artifacts.json`，使 `daemon(action="check")` 无需扫描 run directory 即可呈现 path、size、mtime 与 role，并为旧 run 提供安全回退。',
      ],
      whyEn:
        'These are exactly the failure modes a fleet hits only after hours of unattended work — a secret persisted by a side process, an agent acting on stale source, a daemon too costly to audit; fixing them keeps long autonomy trustworthy.',
      whyZh:
        '这些正是 fleet 在数小时无人值守后才会撞上的失败模式——被旁路进程持久化的密钥、在陈旧源码上动手的 agent、贵到无法审计的 daemon；修好它们，让长时间自治保持可信。',
    },
    {
      titleEn: 'Codex summarize guidance, framed as an investment ratio',
      titleZh: '把 Codex summarize 引导表述为一个投资比率',
      leadEn:
        'The Codex adapter\'s summarize guidance was reframed from stale wait/countdown fields into an investment ratio, and then its thresholds were tuned — the newest functional change in this release window.',
      leadZh:
        'Codex adapter 的 summarize 引导从陈旧的 wait/countdown 字段，被重新表述为一个投资比率，随后它的阈值被微调——这是本发布窗口里最新的功能改动。',
      bulletsEn: [
        '`_meta.agent_meta.adapter_comment` now reports full / incremental counts, a `full_to_incremental_ratio`, a target of `1:10`, and dynamic `summarize_economy` maintenance hints instead of stale wait/countdown fields (#518).',
        'The summarize guidance thresholds were then tuned so the hint fires at the right moment rather than over- or under-prompting (#519) — the newest functional change before the version bump.',
        'Supporting Codex work decouples continuation from transport, makes session identity molt-aware, rotates and allows overriding the endpoint pool at molt boundaries, and surfaces the WebSocket cache ledger (#486, #495, #498, #502, #504, #517).',
      ],
      bulletsZh: [
        '`_meta.agent_meta.adapter_comment` 现在报告 full / incremental 计数、一个 `full_to_incremental_ratio`、`1:10` 的目标，以及动态的 `summarize_economy` 维护提示，而不是陈旧的 wait/countdown 字段（#518）。',
        '随后微调了 summarize 引导阈值，让提示在正确的时机触发，而不是过度或不足地催促（#519）——版本 bump 之前最新的功能改动。',
        '配套的 Codex 工作把 continuation 与 transport 解耦，让 session identity 感知 molt，在 molt 边界轮换并允许覆盖 endpoint pool，并暴露 WebSocket cache ledger（#486、#495、#498、#502、#504、#517）。',
      ],
      whyEn:
        'Summarization is a tax on every long session; framing it as a maintainable ratio with tuned thresholds turns a vague "summarize soon" nag into guidance an agent can actually budget against.',
      whyZh:
        'summarize 是每个长会话都要交的税；把它表述为一个可维护的比率并调好阈值，能把含糊的「快 summarize」唠叨变成 agent 真正能据以做预算的引导。',
    },
    {
      titleEn: 'Release hygiene, validation, and contributors',
      titleZh: 'release hygiene、验证与贡献者',
      leadEn:
        'The paired versions were re-targeted to TUI/Portal v0.10.0 and kernel v0.15.0 (kernel bump PR #521) and validated from clean release worktrees before any publish step.',
      leadZh:
        '这对版本被重新定位为 TUI/Portal v0.10.0 与 kernel v0.15.0（kernel bump PR #521），并在任何 publish 步骤之前从干净的 release worktree 完成验证。',
      bulletsEn: [
        'Kernel gates at the v0.15.0 bump commit `c365eec` (on base `0797e93`): `compileall` clean; full `pytest` 2935 passed, 4 skipped; `python -m build` produced sdist + wheel; `twine check` PASSED on both.',
        'TUI/Portal gates at candidate head `37be28b` (= origin/main, build version injected via `make ... VERSION=v0.10.0`, no source bump): `git diff --check` clean apart from the known generated `docs/stars/stars.csv` CRLF caveat; full TUI and Portal Go tests passed; `portal/web npm ci && npm run build` passed; `make build` produced `lingtai-tui v0.10.0` and `lingtai-portal v0.10.0`.',
        'Noted, non-blocking: the `portal/web` npm-audit advisories affect dev-only tooling, not the embedded `web/dist` the Go binary ships; the locally built kernel wheel is macOS-arm64 platform-tagged, so the portable sdist is the artifact for PyPI unless per-platform wheels are intended.',
        'Contributors in this window: @huangzesen (lead, scope and validation owner), @ktwu01 (TUI preset refactor), @9s5bz2jvd2-lang (TUI beginner work-manual rewrite), and @TZZheng (kernel runtime source-drift nudge and MCP inbox latency diagnostics).',
        'Issue reporters whose reports drove shipped/completed work this window: @lin-du (kernel #301 → shipped as PR #488 "Expose Telegram rich formatting options", plus #300 completed) and @888yzbt888 (TUI #401 preset bugs; Bug 1 fixed by in-window kernel PR #479, closed COMPLETED).',
        'Thanks also to @BrianLiubr (TUI #429/#431) and @xczics (TUI #437) for in-window bug reports still under triage — noted here, not yet shipped fixes.',
      ],
      bulletsZh: [
        '在 v0.15.0 bump commit `c365eec`（基于 `0797e93`）上的 kernel gate：`compileall` 通过；完整 `pytest` 2935 passed、4 skipped；`python -m build` 产出 sdist + wheel；`twine check` 两者均 PASSED。',
        '在候选 head `37be28b`（= origin/main，构建版本经由 `make ... VERSION=v0.10.0` 注入，无源码 bump）上的 TUI/Portal gate：除已知生成文件 `docs/stars/stars.csv` 的 CRLF 注脚外 `git diff --check` 干净；完整 TUI 与 Portal Go 测试通过；`portal/web npm ci && npm run build` 通过；`make build` 产出 `lingtai-tui v0.10.0` 与 `lingtai-portal v0.10.0`。',
        '记录在案、不阻塞发布：`portal/web` 的 npm-audit 警告只影响 dev-only 工具链，不影响 Go 二进制实际打包的 `web/dist`；本地构建的 kernel wheel 带 macOS-arm64 平台标签，因此除非有意发布按平台的 wheel，PyPI 的工件应为可移植的 sdist。',
        '本窗口贡献者：@huangzesen（lead，scope 与验证负责人）、@ktwu01（TUI preset 重构）、@9s5bz2jvd2-lang（TUI 新手工作手册重写）、@TZZheng（kernel 运行时 source-drift 提醒与 MCP inbox 延迟诊断）。',
        '本窗口因 issue 报告而推动落地/完成的报告者：@lin-du（kernel #301 → 以 PR #488「Expose Telegram rich formatting options」落地，另有 #300 completed）与 @888yzbt888（TUI #401 preset bug；Bug 1 由窗口内 kernel PR #479 修复，issue 标记 COMPLETED）。',
        '同样感谢 @BrianLiubr（TUI #429/#431）与 @xczics（TUI #437）在窗口内提交的 bug 报告——这些仍在 triage 中，此处仅作致谢记录，尚非已发布的修复。',
      ],
      whyEn:
        'A version bump still deserves full gate evidence and an honest contributor list; recording that the publish artifacts and tags are cut from these exact validated commits is part of shipping responsibly.',
      whyZh:
        '一次版本 bump 同样值得有完整的 gate 证据与诚实的贡献者列表；记录「publish 工件与 tag 正是从这些经过验证的 commit 切出」，是负责任地发布的一部分。',
    },
  ],
  contributors: ['huangzesen', 'ktwu01', '9s5bz2jvd2-lang', 'TZZheng', 'lin-du', '888yzbt888'],
  validation: {
    commit: 'c365eec927eb8f0b9d557ced3f127cf4759b8153 (kernel v0.15.0 bump) / 37be28b09b3a9d16b3c9daccb408698b56a38f30 (TUI/Portal v0.10.0 build target)',
    items: [
      { label: 'Kernel compileall', result: 'src + tests compiled clean' },
      { label: 'Kernel full pytest', result: '2935 passed, 4 skipped' },
      { label: 'Kernel build and twine check', result: 'sdist + wheel built; both PASSED' },
      { label: 'Kernel diff-check', result: 'only delta vs origin/main is the pyproject.toml version bump to 0.15.0' },
      { label: 'TUI diff-check', result: 'clean apart from known generated docs/stars/stars.csv CRLF caveat' },
      { label: 'TUI Go tests/build', result: 'go test passed; make build → lingtai-tui v0.10.0' },
      { label: 'Portal web npm ci/build', result: 'passed (dev-only npm audit advisories noted, not blocking)' },
      { label: 'Portal Go tests/build', result: 'go test passed; make build → lingtai-portal v0.10.0' },
      { label: 'PyPI artifact policy', result: 'portable sdist is the PyPI artifact; local wheel is macOS-arm64 platform-tagged' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.15.0' },
    { label: 'TUI/Portal release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.10.0' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.15.0/' },
    { label: 'Homebrew tap', href: 'https://github.com/Lingtai-AI/homebrew-lingtai' },
    { label: 'Companion blog', href: 'https://lingtai.ai/en/blog/release-day-2026-06-26/' },
  ],
};

const v0_14_2_kernel_v0_9_6_tui: Release = {
  id: '20260624-1',
  version: 'Kernel v0.14.2 · TUI/Portal v0.9.6',
  titleEn: 'LingTai release day: multi-account Codex, trend reports, and a calmer cockpit',
  titleZh: 'LingTai release day：多账号 Codex、趋势报告，与更安静的座舱',
  date: '2026-06-24',
  pkg: 'lingtai + lingtai-tui',
  tag: 'kernel v0.14.2 · TUI/Portal v0.9.6',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The Homebrew command updates the TUI/Portal surface. The kernel package `lingtai` v0.14.2 is published on PyPI as the runtime package source used by LingTai-managed environments; existing projects should follow their normal TUI-managed refresh or setup path rather than treating a bare global pip command as the user upgrade story.',
  runtimeNoteZh:
    '上面的 Homebrew 命令用于更新 TUI/Portal。Kernel package `lingtai` v0.14.2 已发布到 PyPI，作为 LingTai-managed environment 使用的 runtime package source；已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作普通用户升级故事。',
  summaryEn:
    'A paired kernel and TUI/Portal release centered on running several Codex identities side by side and seeing how a fleet actually spends its calls: per-agent and per-preset Codex OAuth token files, a multi-OAuth setup UI, swiss-knife tool-call and API-call trend reports, a scrollable `/doctor`, bilingual loading strings, a lower default context cap, cache-miss detail in the kanban call view, and the daemon and bash fixes that keep long-running work honest.',
  summaryZh:
    '这是一组围绕「让多个 Codex 身份并行运行」与「看清一支 fleet 的调用究竟花在哪里」的 kernel 与 TUI/Portal 配套发布：按 agent、按 preset 的 Codex OAuth token 文件，多 OAuth 的 setup UI，swiss-knife 的 tool-call / API-call 趋势报告，可滚动的 `/doctor`，双语加载文案，更低的默认 context 上限，看板调用视图里的 cache-miss 细节，以及让长任务保持诚实的 daemon 与 bash 修复。',
  features: [
    {
      titleEn: 'Many Codex identities, one fleet',
      titleZh: '多个 Codex 身份，一支 fleet',
      leadEn:
        'Kernel v0.14.2 and TUI/Portal v0.9.6 let different agents and presets sign in to Codex as different OAuth identities instead of sharing one global token.',
      leadZh:
        'Kernel v0.14.2 与 TUI/Portal v0.9.6 让不同 agent、不同 preset 以不同的 Codex OAuth 身份登录，而不是共用一个全局 token。',
      bulletsEn: [
        'A new `manifest.llm.codex_auth_path` lets each agent or preset point at its own Codex OAuth token file, so multiple ChatGPT accounts can run side by side (kernel #484).',
        'TUI/Portal setup gained multi-OAuth UI and preset support, so picking which Codex identity a preset uses is a first-class choice rather than a manual file edit (TUI #415).',
        'The default falls back to the shared token path, so existing single-account setups keep working untouched.',
      ],
      bulletsZh: [
        '新增的 `manifest.llm.codex_auth_path` 让每个 agent 或 preset 指向自己的 Codex OAuth token 文件，从而让多个 ChatGPT 账号并行运行（kernel #484）。',
        'TUI/Portal setup 新增多 OAuth 的 UI 与 preset 支持，让「某个 preset 用哪个 Codex 身份」成为一等选择，而不是手动改文件（TUI #415）。',
        '默认仍回退到共享 token 路径，因此已有的单账号配置无需改动即可继续工作。',
      ],
      whyEn:
        'A fleet that mixes accounts needs each agent to authenticate as itself; one shared token makes attribution and rate limits everyone\'s problem at once.',
      whyZh:
        '当一支 fleet 混用多个账号时，每个 agent 都需要以自己的身份认证；共用一个 token 会让归属与限流瞬间变成所有人的共同问题。',
    },
    {
      titleEn: 'Seeing where the calls go',
      titleZh: '看清调用花在哪里',
      leadEn:
        'TUI/Portal v0.9.6 turns raw call logs into trend reports, so a fleet\'s tool-call and API-call behavior becomes something operators can read at a glance.',
      leadZh:
        'TUI/Portal v0.9.6 把原始调用日志变成趋势报告，让一支 fleet 的 tool-call 与 API-call 行为变得能一眼读懂。',
      bulletsEn: [
        'A new swiss-knife script and skill produce tool-call and API-call trend reports, with wording aligned across the script and the skill (#414).',
        'The kanban call view now shows cache-miss detail, so a turn that paid full price instead of hitting cache is visible where operators already look (#410).',
        '`/doctor` is scrollable and has section headers, so a long diagnostic readout is navigable instead of a single wall of text (#413).',
      ],
      bulletsZh: [
        '新增的 swiss-knife 脚本与 skill 产出 tool-call 与 API-call 趋势报告，脚本与 skill 的措辞保持一致（#414）。',
        '看板调用视图现在显示 cache-miss 细节，让「这个 turn 付了全价而不是命中 cache」出现在操作者本就会看的地方（#410）。',
        '`/doctor` 变得可滚动并带分节标题，让冗长的诊断输出可以导航，而不是一整面文字墙（#413）。',
      ],
      whyEn:
        'You cannot tune what you cannot see; making call trends and cache misses legible is the first step toward trimming them.',
      whyZh:
        '看不见就无法调优；让调用趋势与 cache miss 变得可读，是削减它们的第一步。',
    },
    {
      titleEn: 'A calmer, more legible cockpit',
      titleZh: '更安静、更易读的座舱',
      leadEn:
        'Several smaller TUI changes lower the noise floor and make the default cockpit kinder to readers of more than one language.',
      leadZh:
        '几处较小的 TUI 改动降低了噪声底线，也让默认座舱对不止一种语言的读者更友好。',
      bulletsEn: [
        'Loading strings are bilingual and i18n-aware, so the cockpit speaks the operator\'s language while it warms up (#412).',
        'The default context/token cap was lowered to 250k, a more conservative working budget out of the box (#411).',
        'These defaults can still be raised per setup; the change is about what an unconfigured cockpit does, not a hard ceiling.',
      ],
      bulletsZh: [
        '加载文案改为双语且支持 i18n，让座舱在预热时也用操作者的语言说话（#412）。',
        '默认 context/token 上限降到 250k，开箱即用时是更保守的工作预算（#411）。',
        '这些默认值仍可按 setup 调高；这次改的是「未配置的座舱默认怎么做」，而不是一个硬上限。',
      ],
      whyEn:
        'Defaults are what most sessions actually run with, so a saner default cap and language-aware text matter more than any single advanced toggle.',
      whyZh:
        '默认值才是大多数会话实际跑的配置，因此更合理的默认上限与感知语言的文案，比任何单个高级开关都更重要。',
    },
    {
      titleEn: 'Daemon and bash fixes that keep long work honest',
      titleZh: '让长任务保持诚实的 daemon 与 bash 修复',
      leadEn:
        'Kernel v0.14.2 repairs two run-directory and working-directory edge cases that previously made long-running daemon work misreport its own state.',
      leadZh:
        'Kernel v0.14.2 修复了两处 run-directory 与 working-directory 的边界情况，它们此前会让长时间运行的 daemon 工作误报自己的状态。',
      bulletsEn: [
        'A daemon historical check now resolves run directories correctly after a refresh or molt, so prior-run inspection no longer breaks across a context shed (#483).',
        'An empty `working_dir` in a bash call is now treated as unset and falls back to the default agent directory, instead of running against an ambiguous path (#480).',
        'Both fixes target the moments — post-molt, empty-field — where a long session is most likely to lose track of where it is.',
      ],
      bulletsZh: [
        'daemon 历史检查现在能在 refresh 或 molt 之后正确解析 run directory，使得跨 context 凝蜕的历史回看不再失效（#483）。',
        'bash 调用里空的 `working_dir` 现在被视为未设置，并回退到默认 agent 目录，而不是在一个含糊的路径上运行（#480）。',
        '这两处修复都瞄准最容易让长会话「丢失自己在哪里」的时刻——凝蜕之后、字段为空时。',
      ],
      whyEn:
        'A long-running agent that loses track of its run directory or working directory will quietly act on the wrong place; these fixes keep it honest about where it is.',
      whyZh:
        '一个丢失了自己 run directory 或 working directory 的长任务 agent，会悄悄地在错误的位置动手；这两处修复让它对「自己在哪里」保持诚实。',
    },
    {
      titleEn: 'Release hygiene, validation, and contributors',
      titleZh: 'release hygiene、验证与贡献者',
      leadEn:
        'The window also carried release-hygiene work and was validated from clean release worktrees before publication.',
      leadZh:
        '本窗口同样包含 release-hygiene 工作，并在发布前从干净的 release worktree 完成验证。',
      bulletsEn: [
        'The kernel update command is confirm-gated, and a destructive global preset-split migration was neutralized so it can no longer rewrite operator presets.',
        'TUI release version comparisons are now classified explicitly (@TZZheng), and the release star CSV was normalized as release hygiene.',
        'Kernel gates: `compileall` clean; focused/expanded pytest over daemon/bash/notification/preset/deep-refresh/tool-executor/openai/codex/provider/auth surfaces `513 passed`; `python -m build` plus `twine check` PASSED; PyPI reports `info.version=0.14.2`.',
        'TUI/Portal gates: `git diff --check` clean; TUI and Portal Go tests passed; `portal/web npm ci && npm run build` passed; TUI and Portal `make clean && make build` passed; Homebrew Release workflow succeeded for tag v0.9.6.',
      ],
      bulletsZh: [
        'kernel 更新命令改为 confirm-gated，并中和了一个具破坏性的全局 preset-split migration，使其不再能重写操作者的 preset。',
        'TUI release 版本比较现在被显式分类（@TZZheng），release star CSV 也作为 release hygiene 做了归一化。',
        'Kernel 验证：`compileall` 通过；针对 daemon/bash/notification/preset/deep-refresh/tool-executor/openai/codex/provider/auth 面的聚焦/扩展 pytest `513 passed`；`python -m build` 与 `twine check` 均 PASSED；PyPI 报告 `info.version=0.14.2`。',
        'TUI/Portal 验证：`git diff --check` 干净；TUI 与 Portal Go 测试通过；`portal/web npm ci && npm run build` 通过；TUI 与 Portal `make clean && make build` 通过；tag v0.9.6 的 Homebrew Release workflow 成功。',
      ],
      whyEn:
        'A small version bump still deserves confirm-gated mutations, neutralized destructive migrations, and full gate evidence before it ships.',
      whyZh:
        '一次小版本 bump 同样值得在发布前有 confirm-gated 的变更、被中和的破坏性 migration，以及完整的 gate 证据。',
    },
  ],
  contributors: ['huangzesen', 'TZZheng'],
  validation: {
    commit: '009f1aa84eb6926f88001ad284d435181e758fa5 / 3460ece328c60b80a2a6a8c5431c96f1cb25e210',
    items: [
      { label: 'Kernel compileall', result: 'src + tests compiled clean' },
      { label: 'Kernel focused/expanded pytest', result: '513 passed' },
      { label: 'Kernel build and twine check', result: 'wheel + sdist built; both PASSED' },
      { label: 'PyPI verification', result: 'info.version = 0.14.2' },
      { label: 'TUI diff-check', result: 'git diff --check clean (v0.9.5...HEAD)' },
      { label: 'TUI Go tests/build', result: 'go test + make clean && make build passed' },
      { label: 'Portal web npm ci/build', result: 'passed (npm audit warnings noted, not blocking)' },
      { label: 'Portal Go tests/build', result: 'go test + make clean && make build passed' },
      { label: 'Homebrew tap', result: 'Release workflow auto-bumped lingtai-tui to 0.9.6 (sha256 c944…2aca)' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.2' },
    { label: 'TUI/Portal release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.6' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.14.2/' },
    { label: 'Homebrew tap', href: 'https://github.com/Lingtai-AI/homebrew-lingtai' },
    { label: 'Companion blog', href: 'https://lingtai.ai/en/blog/release-day-2026-06-24/' },
  ],
};

const v0_14_1_kernel: Release = {
  id: '20260623-1',
  version: 'Kernel v0.14.1',
  titleEn: 'LingTai kernel v0.14.1: Codex Responses state, cache discipline, and honest identity',
  titleZh: 'LingTai kernel v0.14.1：Codex Responses 状态、cache 纪律与诚实身份',
  date: '2026-06-23',
  pkg: 'lingtai',
  tag: 'kernel v0.14.1',
  runtimeNoteEn:
    'The kernel package `lingtai` v0.14.1 is published on PyPI as the runtime package source used by LingTai-managed environments. Existing LingTai projects should follow their normal TUI-managed refresh or setup path rather than treating a bare global pip command as the user upgrade story.',
  runtimeNoteZh:
    'Kernel package `lingtai` v0.14.1 已发布到 PyPI，作为 LingTai-managed environment 使用的 runtime package source。已有 LingTai 项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作普通用户升级故事。',
  summaryEn:
    'A Codex-focused runtime release: persistent Responses WebSocket continuation, safer tool-output baselines, explicit fresh-epoch reset, concise summarize/cache guidance, honest LingTai request identity, and refreshed kernel ANATOMY citations.',
  summaryZh:
    '一次聚焦 Codex 的 runtime release：持久 Responses WebSocket 延续、更安全的 tool-output baseline、显式 fresh-epoch reset、简洁的 summarize/cache 提醒、诚实的 LingTai 请求身份，以及刷新后的 kernel ANATOMY 引用。',
  features: [
    {
      titleEn: 'Codex Responses can continue incrementally',
      titleZh: 'Codex Responses 可以增量延续',
      leadEn:
        'LingTai now preserves the WebSocket-side state needed to continue a Codex Responses turn through `previous_response_id` when the local history still matches the remote baseline.',
      leadZh:
        '当本地 history 仍与远端 baseline 匹配时，LingTai 现在会保留 WebSocket 侧状态，并通过 `previous_response_id` 延续 Codex Responses turn。',
      bulletsEn: [
        '`ws_incremental` means LingTai continued the existing remote `previous_response_id` chain instead of replaying the full request.',
        '`ws_full` means LingTai rebuilt a complete request from local history and started a fresh remote state chain.',
        'The runtime keeps fallback paths so prefix mismatch, missing baseline, or explicit reset can safely choose a full request.',
      ],
      bulletsZh: [
        '`ws_incremental` 表示 LingTai 继续使用现有远端 `previous_response_id` 链，而不是完整重放请求。',
        '`ws_full` 表示 LingTai 从本地 history 重建完整请求，并开启新的远端状态链。',
        '运行时保留 fallback 路径，因此 prefix mismatch、缺少 baseline 或显式 reset 时可以安全选择完整请求。',
      ],
      whyEn:
        'Codex cache affinity depends on the remote Responses state chain, not only on repeating the same prompt bytes.',
      whyZh:
        'Codex cache affinity 依赖远端 Responses 状态链，而不只是重复发送相同 prompt 字节。',
    },
    {
      titleEn: 'Tool-output baselines and fresh epochs are explicit',
      titleZh: 'Tool-output baseline 与 fresh epoch 变得显式',
      leadEn:
        'Tool outputs are frozen against the request baseline, and LingTai can intentionally leave stale remote metadata behind by starting a fresh epoch.',
      leadZh:
        'Tool output 会按请求 baseline 冻结；LingTai 也可以通过 fresh epoch 主动把旧远端 metadata 留在旧链里。',
      bulletsEn: [
        'Frozen tool-output cache prevents later local mutation from changing what an incremental Codex request is replying to.',
        'Periodic epoch reset defaults to 20 turns and sends one complete request rebuilt from current local `chat_history`.',
        'A successful local `system(action="summarize")` also triggers a fresh Codex epoch on the next request.',
      ],
      bulletsZh: [
        '冻结 tool-output cache 可以避免后续本地变更悄悄改变增量 Codex 请求正在回复的内容。',
        '周期性 epoch reset 默认 20 turns，并从当前本地 `chat_history` 重建一次完整请求。',
        '本地 `system(action="summarize")` 成功后，也会让下一次 Codex 请求进入 fresh epoch。',
      ],
      whyEn:
        'A fresh epoch is the safe way to discard stale remote-state baggage without deleting LingTai local history.',
      whyZh:
        'Fresh epoch 是丢弃旧远端状态包袱的安全方式，同时不会删除 LingTai 本地 history。',
    },
    {
      titleEn: 'Summarize guidance now protects Codex cache',
      titleZh: 'Summarize guidance 现在会保护 Codex cache',
      leadEn:
        'Jason noticed that repeated one-by-one summarize calls were repeatedly breaking the Codex cache chain; the runtime comment now makes that cost visible.',
      leadZh:
        'Jason 指出逐条连续 summarize 会反复打断 Codex cache 链；运行时 comment 现在会把这个代价显式说出来。',
      bulletsEn: [
        'For Codex, each summarize forces the next request to start as `ws_full` instead of continuing as `ws_incremental`.',
        'The adapter comment strongly discourages consecutive summarize calls within about five turns.',
        'Ordinary long tool results should be read first and summarized together once their raw payloads are no longer needed.',
      ],
      bulletsZh: [
        '对 Codex 而言，每次 summarize 都会让下一次请求从 `ws_full` fresh epoch 开始，而不是继续 `ws_incremental`。',
        'adapter comment 明确不建议在大约 5 turns 内连续 summarize。',
        '普通长 tool result 应先读完，确认 raw payload 不再需要后再批量 summarize。',
      ],
      whyEn:
        'Other providers are less sensitive here, but Codex uses `previous_response_id` state, so unnecessary fresh epochs are real cache misses.',
      whyZh:
        '其他 provider 对这里不那么敏感，但 Codex 使用 `previous_response_id` 状态，因此不必要的 fresh epoch 就是真实的 cache miss。',
    },
    {
      titleEn: 'Default Codex identity is honest LingTai',
      titleZh: '默认 Codex 身份是诚实的 LingTai',
      leadEn:
        'The release removes stale comments that described the old official-CLI-shaped experiment as the default.',
      leadZh:
        '这次 release 清理了把旧 official-CLI-shaped 实验误写成默认行为的陈旧注释。',
      bulletsEn: [
        'Default requests use `originator=lingtai` and `User-Agent=LingTai/<version>`.',
        'The official Codex CLI-shaped identity remains only as an explicit local comparison switch.',
        'Comments, tests, and `src/lingtai/llm/openai/ANATOMY.md` were updated to match the shipped behavior.',
      ],
      bulletsZh: [
        '默认请求使用 `originator=lingtai` 与 `User-Agent=LingTai/<version>`。',
        '官方 Codex CLI 形状的 identity 只保留为显式本地对比开关。',
        'comments、tests 与 `src/lingtai/llm/openai/ANATOMY.md` 已同步为发布行为。',
      ],
      whyEn:
        'Protocol experiments are valuable, but the shipped runtime should be clear about who it is.',
      whyZh:
        '协议实验很有价值，但发布出的 runtime 应清楚说明自己是谁。',
    },
    {
      titleEn: 'Validation and release hygiene',
      titleZh: '验证与 release hygiene',
      leadEn:
        'The release also repairs stale kernel ANATOMY citations and records exact artifact hashes from the published files.',
      leadZh:
        '这次 release 也修复了陈旧的 kernel ANATOMY 引用，并记录发布文件的精确 artifact hashes。',
      bulletsEn: [
        'Full kernel pytest passed: `2715 passed, 4 skipped in 304.41s`.',
        'Targeted Codex identity/comment tests passed: `42 passed`.',
        'Custom all-ANATOMY citation check passed: `599` citations checked, `0` issues.',
        'Wheel and sdist passed `twine check`, contained no `__pycache__` / `.pyc`, and were verified on PyPI after upload.',
      ],
      bulletsZh: [
        '完整 kernel pytest 通过：`2715 passed, 4 skipped in 304.41s`。',
        'Codex identity/comment targeted tests 通过：`42 passed`。',
        '自定义全量 ANATOMY citation check 通过：`599` citations checked，`0` issues。',
        'wheel 与 sdist 通过 `twine check`，不含 `__pycache__` / `.pyc`，上传后也在 PyPI 上完成校验。',
      ],
      whyEn:
        'This was a small version bump, but the state-machine behavior deserved full validation and durable release evidence.',
      whyZh:
        '这是一次小版本 bump，但状态机行为值得完整验证与可追溯的 release evidence。',
    },
  ],
  contributors: ['huangzesen'],
  validation: {
    commit: 'd47473b225991b78dd8ff792d8991c95694bf657',
    items: [
      { label: 'Kernel full pytest', result: '2715 passed, 4 skipped in 304.41s' },
      { label: 'Target Codex identity/comment tests', result: '42 passed' },
      { label: 'ANATOMY citation checker', result: '599 checked, 0 issues' },
      { label: 'Build and twine check', result: 'wheel + sdist built; both PASSED' },
      { label: 'Artifact inspection', result: '0 __pycache__ / .pyc entries' },
      { label: 'PyPI verification', result: '0.14.1 published with matching SHA-256 hashes' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.1' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.14.1/' },
    { label: 'Release report', href: 'https://github.com/Lingtai-AI/lingtai-kernel/tree/main/reports/kernel-release-v0.14.1-20260623' },
  ],
};

const v0_14_0_kernel_v0_9_5_tui: Release = {
  id: '20260622-1',
  version: 'Kernel v0.14.0 · TUI/Portal v0.9.5',
  titleEn: 'LingTai release day: honest backends, measured latency, and a faster cockpit',
  titleZh: 'LingTai release day：诚实的 backend、可测量的延迟，与更快的座舱',
  date: '2026-06-22',
  pkg: 'lingtai + lingtai-tui',
  tag: 'kernel v0.14.0 · TUI/Portal v0.9.5',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The Homebrew command updates the TUI/Portal surface. The kernel package `lingtai` v0.14.0 is published on PyPI as the runtime package source used by LingTai-managed environments; existing projects should follow their normal TUI-managed refresh or setup path rather than treating a bare global pip command as the user upgrade story. This entry covers the full window since the last published release log (kernel v0.13.0 / TUI v0.9.3), spanning the v0.13.1 and v0.9.4 point releases as well.',
  runtimeNoteZh:
    '上面的 Homebrew 命令用于更新 TUI/Portal。Kernel package `lingtai` v0.14.0 已发布到 PyPI，作为 LingTai-managed environment 使用的 runtime package source；已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作普通用户升级故事。本条记录覆盖自上一篇发布日志（kernel v0.13.0 / TUI v0.9.3）以来的完整窗口，也包含 v0.13.1 与 v0.9.4 这两次点版本发布。',
  summaryEn:
    'A paired kernel and TUI/Portal release window centered on truth and measurement: the kernel sends an honest metadata envelope and the operator\'s own ChatGPT account header to Codex, records end-to-end LLM latency, surfaces long tool results in agent meta, and recovers from wedged turns; the TUI starts faster, renders fuller notification snapshots, and streams the token ledger.',
  summaryZh:
    '这是一组围绕「诚实」与「测量」的 kernel 与 TUI/Portal 配套发布窗口：kernel 向 Codex 发送诚实的 metadata envelope 与操作者自己的 ChatGPT 账号 header，记录端到端 LLM 延迟，在 agent meta 中呈现长工具结果，并能从卡住的 turn 中恢复；TUI 启动更快、通知快照渲染更完整，并以流式方式读取 token ledger。',
  features: [
    {
      titleEn: 'Honest Codex metadata and forwarded account identity',
      titleZh: '诚实的 Codex metadata 与转发的账号身份',
      leadEn:
        'Kernel v0.14.0 makes what the runtime tells the Codex backend about itself accurate rather than approximate.',
      leadZh:
        'Kernel v0.14.0 让运行时向 Codex backend 声称的关于自己的信息变得准确，而不是近似。',
      bulletsEn: [
        'Agents send an honest metadata envelope to the Codex backend so backend-side provenance reflects reality (#461).',
        'The operator\'s own `ChatGPT-Account-ID` header is forwarded on Codex requests, so attribution and account routing are correct (#454).',
        'Codex thinking config and the ChatGPT account-id path were repaired across the window (#457).',
      ],
      bulletsZh: [
        'agent 向 Codex backend 发送诚实的 metadata envelope，让 backend 侧来源反映真实情况（#461）。',
        '在 Codex request 上转发操作者自己的 `ChatGPT-Account-ID` header，让归属与账号路由正确（#454）。',
        '在本窗口内修复了 Codex thinking 配置与 ChatGPT account-id 路径（#457）。',
      ],
      whyEn:
        'Backend trust and cache affinity should rest on the truth about who is calling, not on guesswork or a stand-in identity.',
      whyZh:
        'backend 的信任与 cache affinity 应建立在「谁在调用」的真相上，而不是猜测或替身身份。',
    },
    {
      titleEn: 'Measured latency and tool-result visibility',
      titleZh: '可测量的延迟与工具结果可见性',
      leadEn:
        'A slow turn becomes a measurable fact, and long tool results become visible without flooding the context budget.',
      leadZh:
        '一个「慢 turn」变成可测量的事实；长工具结果变得可见，同时不会撑爆 context 预算。',
      bulletsEn: [
        'New LLM latency telemetry records provider-wait and per-phase timings (#366).',
        'Long tool results are surfaced in agent meta with a top-10 preview list and char counts (#451, #452, #453, #465).',
        'Tool-result metadata is nested under `_meta` and excluded from summarize sizing so it no longer distorts the context budget.',
      ],
      bulletsZh: [
        '新增 LLM 延迟遥测，记录 provider-wait 与各阶段耗时（#366）。',
        '长工具结果在 agent meta 中以「前 10 条预览列表 + 字符数」呈现（#451、#452、#453、#465）。',
        '工具结果 metadata 被收纳到 `_meta` 之下，并从 summarize 的大小计算中排除，因此不再扭曲 context 预算。',
      ],
      whyEn:
        'Operators can see where a turn\'s time goes and what evidence exists, without paying for it in working context.',
      whyZh:
        '操作者可以看清一个 turn 的时间花在哪里、存在哪些证据，而不必为此付出工作上下文的代价。',
    },
    {
      titleEn: 'Turn recovery and calmer molt discipline',
      titleZh: 'turn 恢复与更稳的凝蜕纪律',
      leadEn:
        'The window hardens recovery so a single stuck turn cannot take down a long session, and retires legacy molt-pressure config.',
      leadZh:
        '本窗口加固了恢复能力，让单个卡住的 turn 不会拖垮长会话，并淘汰了 legacy molt-pressure 配置。',
      bulletsEn: [
        'Durable tool results are replayed before heal, hardening post-tool continuation recovery (#297).',
        'Turns poisoned by a stuck worker (`WorkerStillRunning`) now recover instead of wedging (#463).',
        'Legacy molt-pressure configuration is ignored; molt pressure moved into agent meta (#464, #467).',
      ],
      bulletsZh: [
        '持久 tool result 会在 heal 之前被重放，加固 post-tool continuation 的恢复（#297）。',
        '被卡住的 worker 毒化的 turn（`WorkerStillRunning`）现在能恢复，而不是整个卡死（#463）。',
        'legacy molt-pressure 配置被忽略；molt pressure 移入 agent meta（#464、#467）。',
      ],
      whyEn:
        'Long-running agents need to survive a single bad turn and shed context on intent, not on a configured pressure number.',
      whyZh:
        '长时间运行的 agent 需要能熬过单个坏 turn，并按意图凝蜕，而不是被某个配置的压力数值牵着走。',
    },
    {
      titleEn: 'A faster cockpit with fuller notifications',
      titleZh: '更快的座舱与更完整的通知',
      leadEn:
        'TUI/Portal v0.9.5 trims the launch path and makes notifications more readable while work is in motion.',
      leadZh:
        'TUI/Portal v0.9.5 削减了启动路径，并在系统运行时让通知更易读。',
      bulletsEn: [
        'The authoritative session rebuild is deferred off the launch path and the session cache is concurrency-safe, so startup is faster (#397).',
        'Notification snapshots render their full meta envelope and markdown blocks, are scrollable, and persist (#391, #392, #393).',
        '`/daemons` lazy-loads run detail, token-ledger reads stream, and the initial mail view shows a loading banner (#395, #390, #398).',
      ],
      bulletsZh: [
        'authoritative session rebuild 被移出启动路径，session cache 并发安全，因此启动更快（#397）。',
        '通知快照渲染完整 meta envelope 与 markdown block，可滚动并持久化（#391、#392、#393）。',
        '`/daemons` 懒加载 run detail，token-ledger 流式读取，初始 mail 视图显示 loading 横幅（#395、#390、#398）。',
      ],
      whyEn:
        'Less time waiting on launch, and more of what an agent saw visible exactly where operators look.',
      whyZh:
        '启动时少等待，agent 看到的更多内容也恰好出现在操作者会查看的地方。',
    },
    {
      titleEn: 'Contributors and the fate of every proposal',
      titleZh: '贡献者，以及每个提案的命运',
      leadEn:
        'A release window is more than its merged commits. Below is everyone who opened a pull request or a substantive issue in this window — including work that was not merged but still shaped the result.',
      leadZh:
        '一个发布窗口不只由合并的提交构成。下面列出在这个窗口里提过 pull request 或实质性 issue 的每个人 —— 包括那些没有合并、但依然影响了结果的工作。',
      bulletsEn: [
        '@huangzesen (maintainer) — authored the bulk of the window (86 merged PRs across both repos) covering Codex honesty, latency telemetry, tool-result metadata, summarize/molt discipline, and the release itself; two PRs (#369, #340) were closed unmerged after being superseded.',
        '@TZZheng — merged durable tool-result replay (#297), LLM latency telemetry (#366), the dev-guide cache-hit-rate skill (#396), and a duplicate-process fix (#459); the earlier Codex reasoning-effort preset PR (#280) was closed unmerged, then the idea landed via #394.',
        '@BatalloLu — fixed setup so it preserves agent identity / legacy preset fields (#372, merged).',
        '@9s5bz2jvd2-lang (Wang Runyuan) — proposed structured daemon task capsules (#388) and terminal async daemon dispatch (#390), both closed unmerged, plus an open daemon-first policy PR (#389); the accompanying runtime issues (#409 molt keep_last, #422 large-result cleanup latency, #423 post-molt codename retrieval) are included because they framed problems this and future windows act on.',
      ],
      bulletsZh: [
        '@huangzesen（maintainer）—— 完成了窗口的绝大部分（两个 repo 共 86 个合并 PR），涵盖 Codex 诚实化、延迟遥测、工具结果 metadata、summarize/凝蜕纪律，以及 release 本身；另有两个 PR（#369、#340）在被取代后关闭未合并。',
        '@TZZheng —— 合并了持久工具结果重放（#297）、LLM 延迟遥测（#366）、dev-guide cache-hit-rate skill（#396）与重复进程修复（#459）；更早的 Codex reasoning-effort preset PR（#280）被关闭未合并，该想法随后由 #394 落地。',
        '@BatalloLu —— 修复 setup 使其保留 agent identity / legacy preset 字段（#372，已合并）。',
        '@9s5bz2jvd2-lang（Wang Runyuan）—— 提出结构化 daemon task capsule（#388）与终端异步 daemon dispatch（#390），两者均关闭未合并，另有一个开放的 daemon-first 策略 PR（#389）；相关运行时 issue（#409 molt keep_last、#422 large-result 清理延迟、#423 凝蜕后 codename 检索）被纳入，因为它们界定了本窗口及未来窗口要处理的问题。',
      ],
      whyEn:
        'Recording closed-unmerged PRs and the issues behind them keeps the contributor history honest: ideas often arrive before the merge that implements them.',
      whyZh:
        '记录关闭未合并的 PR 以及它们背后的 issue，能让贡献历史保持诚实：想法往往先于实现它的那次合并到来。',
    },
  ],
  contributors: ['huangzesen', 'TZZheng', 'BatalloLu', '9s5bz2jvd2-lang'],
  validation: {
    commit: '48afb27cc99cfdf55e0e09fc843aed0556383019 / 7f13621da5e3f93d2924571849410608973fc889',
    items: [
      { label: 'Kernel full pytest', result: '2635 passed, 4 skipped' },
      { label: 'Kernel build and twine check', result: 'wheel + sdist built; both PASSED' },
      { label: 'Kernel clean-venv install', result: 'published wheel installed; import lingtai → 0.14.0' },
      { label: 'TUI Go tests/build', result: 'passed (12 packages)' },
      { label: 'Portal web npm ci/build', result: 'passed (vite)' },
      { label: 'Portal Go tests/build', result: 'passed (3 packages)' },
      { label: 'Homebrew tap', result: 'CI auto-bumped lingtai-tui to 0.9.5' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.14.0' },
    { label: 'TUI/Portal release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.5' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.14.0/' },
    { label: 'Homebrew tap', href: 'https://github.com/Lingtai-AI/homebrew-lingtai' },
    { label: 'Companion blog', href: 'https://lingtai.ai/en/blog/release-day-2026-06-22/' },
  ],
};

const v0_13_0_kernel_v0_9_3_tui: Release = {
  id: '20260620-2',
  version: 'Kernel v0.13.0 · TUI/Portal v0.9.3',
  titleEn: 'LingTai release day: context hygiene, notification history, and honest backends',
  titleZh: 'LingTai release day：上下文卫生、通知历史与更诚实的 backend',
  date: '2026-06-20',
  pkg: 'lingtai + lingtai-tui',
  tag: 'kernel v0.13.0 · TUI/Portal v0.9.3',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'The Homebrew command updates the TUI/Portal surface. The kernel package `lingtai` v0.13.0 is published on PyPI as the runtime package source used by LingTai-managed environments; existing projects should follow their normal TUI-managed refresh or setup path rather than treating a bare global pip command as the user upgrade story.',
  runtimeNoteZh:
    '上面的 Homebrew 命令用于更新 TUI/Portal。Kernel package `lingtai` v0.13.0 已发布到 PyPI，作为 LingTai-managed environment 使用的 runtime package source；已有项目仍应按 TUI 管理的 refresh / setup 路径更新，不应把全局裸 pip 命令当作普通用户升级故事。',
  summaryEn:
    'A paired kernel and TUI/Portal release that makes long-running agents quieter, more inspectable, and easier to recover: progressive disclosure for large tool results, a dedicated notification tool, mandatory session journals before deliberate molts, persisted notification-block history, Codex header fixes, and operator views with timezone and daemon token context.',
  summaryZh:
    '这是一组 kernel 与 TUI/Portal 配套 release：让长时间运行的 agent 更安静、更可审计，也更容易恢复。核心变化包括大型工具结果的渐进披露、独立 notification tool、凝蜕前强制 session journal、持久化 notification-block 历史、Codex header 修复，以及带本地时区和 daemon token context 的操作界面。',
  features: [
    {
      titleEn: 'Progressive disclosure for large tool results',
      titleZh: '大型工具结果的渐进披露',
      leadEn:
        'Kernel v0.13.0 makes result hygiene a first-class runtime habit instead of an optional cleanup chore.',
      leadZh:
        'Kernel v0.13.0 把结果卫生变成运行时的一等习惯，而不是事后可做可不做的清理。',
      bulletsEn: [
        'Tool results now carry consistent `_tool_result_metadata` with call id, tool name, character count, threshold, and summarization guidance.',
        '`system.summarize` can replace a context-visible blob with an agent-authored index while the original stays available in the event log.',
        'Large-result reminders can be acknowledged without deleting the underlying tool result.',
      ],
      bulletsZh: [
        '工具结果现在带稳定的 `_tool_result_metadata`，包含 call id、tool 名、字符数、阈值和摘要提示。',
        '`system.summarize` 可以把上下文里的大块原始输出替换为 agent 自写的索引式摘要，同时原始结果仍留在 event log。',
        'large-result reminder 可以被 acknowledge，而不会删除底层 tool result。',
      ],
      whyEn:
        'Agents can keep conclusions, evidence, risks, and next steps in working context without dragging every raw build log or trace forward.',
      whyZh:
        'agent 可以把结论、证据、风险和下一步留在工作上下文中，而不必把每段原始 build log 或 trace 都拖着走。',
    },
    {
      titleEn: 'Notification handling becomes explicit and inspectable',
      titleZh: '通知处理变得明确且可检查',
      leadEn:
        'Notification operations now live in the dedicated `notification` capability, and TUI/Portal v0.9.3 can show historical notification blocks.',
      leadZh:
        '通知操作现在归独立的 `notification` capability 管；TUI/Portal v0.9.3 也能展示历史 notification block。',
      bulletsEn: [
        'The old `system.notification` / `system.dismiss` aliases are removed; lifecycle and notification surfaces are no longer mixed.',
        'The kernel persists actual canonical notification-block snapshots for later inspection.',
        '`/notification` can load from the sqlite event log and display those persisted snapshots.',
      ],
      bulletsZh: [
        '旧的 `system.notification` / `system.dismiss` alias 已移除；生命周期操作和通知面不再混在一起。',
        'kernel 会持久化真实的 canonical notification-block snapshot，供事后检查。',
        '`/notification` 可以从 sqlite event log 读取并展示这些持久化 snapshot。',
      ],
      whyEn:
        'When an operator asks what an agent saw, the TUI can show the actual notification object instead of reconstructing it from memory.',
      whyZh:
        '当操作者问 agent 当时看到了什么时，TUI 可以展示真实 notification object，而不是靠记忆重建。',
    },
    {
      titleEn: 'Safer context shedding and Codex backend affinity',
      titleZh: '更安全的凝蜕与更稳的 Codex backend affinity',
      leadEn:
        'The release tightens the handoff before an agent sheds context and makes the Codex backend path less ambiguous.',
      leadZh:
        '这次 release 收紧了 agent 丢弃上下文前的交接，也让 Codex backend 路径更少歧义。',
      bulletsEn: [
        'Agent-initiated `psyche.context.molt` calls must provide a valid `session_journal_path`.',
        'The Codex backend now sends underscore `session_id` / `thread_id` headers to match the Codex CLI path.',
        'Codex requests also include honest LingTai client-identity metadata for clearer backend-side provenance.',
      ],
      bulletsZh: [
        'agent 主动调用 `psyche.context.molt` 时，必须提供合法的 `session_journal_path`。',
        'Codex backend 现在发送下划线形式的 `session_id` / `thread_id` header，以匹配 Codex CLI 路径。',
        'Codex request 也会携带诚实的 LingTai client-identity metadata，让 backend 侧来源更清楚。',
      ],
      whyEn:
        'A molt should leave a durable handoff, and backend cache-affinity should not depend on guesswork about header spelling or client origin.',
      whyZh:
        '凝蜕应当留下 durable handoff；backend cache-affinity 也不应靠猜 header 拼写或 client 来源。',
    },
    {
      titleEn: 'Operator views gain local time and daemon cost context',
      titleZh: '操作者视图补上本地时间与 daemon cost context',
      leadEn:
        'TUI/Portal v0.9.3 makes the runtime easier to read while work is still in motion.',
      leadZh:
        'TUI/Portal v0.9.3 让运行中的系统更容易被读懂。',
      bulletsEn: [
        '`/kanban` timestamps now show local timezone context.',
        'The daemons view shows timezone context and CLI token usage where available.',
        'A migration version collision in the TUI metadata/state schema was fixed.',
      ],
      bulletsZh: [
        '`/kanban` 时间戳现在显示本地时区。',
        'daemons 视图会在可用时显示时区上下文和 CLI token usage。',
        '修复了 TUI metadata/state schema 的 migration version collision。',
      ],
      whyEn:
        'Small visibility improvements reduce the gap between what agents are doing and what operators can confidently verify.',
      whyZh:
        '这些小的可见性改进，会缩短 agent 正在做什么与操作者能确信验证什么之间的距离。',
    },
  ],
  contributors: ['huangzesen'],
  validation: {
    commit: '0ba1584fce182463f7de3a6d1e3aa3a196eb2855 / 73d2e3ba72bd59ec8b729dd3b317d14d9ecd5ea8',
    items: [
      { label: 'Kernel full pytest', result: '2536 passed, 4 skipped' },
      { label: 'Kernel build and twine check', result: 'passed; PyPI JSON and pip download verified' },
      { label: 'TUI Go tests/build', result: 'passed' },
      { label: 'Portal web npm ci/build', result: 'passed' },
      { label: 'Portal Go tests/build', result: 'passed' },
      { label: 'Homebrew tap', result: 'brew update, info, audit, and fetch verified v0.9.3' },
      { label: 'Web release note', result: 'npm run build passed; production URLs returned HTTP 200' },
    ],
  },
  links: [
    { label: 'Kernel release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.13.0' },
    { label: 'TUI/Portal release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.3' },
    { label: 'PyPI kernel package', href: 'https://pypi.org/project/lingtai/0.13.0/' },
    { label: 'Homebrew tap audit fix', href: 'https://github.com/Lingtai-AI/homebrew-lingtai/pull/4' },
    { label: 'Companion blog', href: 'https://lingtai.ai/en/blog/release-day-2026-06-20/' },
  ],
};

const v0_12_4_kernel: Release = {
  id: '20260620-1',
  version: 'v0.12.4',
  titleEn: 'LingTai kernel v0.12.4',
  titleZh: '灵台内核 v0.12.4',
  date: '2026-06-20',
  pkg: 'lingtai',
  tag: 'v0.12.4',
  install: 'python -m pip install --upgrade lingtai==0.12.4',
  runtimeNoteEn:
    'This is a kernel-only release for the LingTai runtime package. There are no TUI/Portal or recipe changes in this window. Projects managed by the TUI continue to receive kernel updates through their usual runtime environment, while bare pip install remains the release, diagnostic, and clean-venv validation path. The whole release is about one thing: giving the Codex provider path a stable, well-scoped cache identity for root agents and daemon runs.',
  runtimeNoteZh:
    '这是一次仅面向灵台内核/runtime 包的发布，本轮不含 TUI/Portal 与 recipe 变更。由 TUI 管理的项目仍通过既有 runtime 环境获得内核更新，裸 pip install 仍是发布、诊断与 clean-venv 验证路径。整轮发布只围绕一件事：为 Codex provider 路径上的 root agent 与 daemon run 提供稳定且作用域清晰的缓存身份。',
  summaryEn:
    'A tightly scoped kernel release after v0.12.3 focused entirely on Codex cache identity. Root agents now derive a stable 8-character sha256-prefix hash from the resolved agent/init.json path and present it byte-identically as the Codex session-id, thread-id, and prompt_cache_key, so repeated turns from the same agent look like one continuous conversation to the provider. LingTai-backend daemon runs stop reusing one parent/global identity: each run gets its own daemon-scoped LLMService and a Codex anchor derived from its resolved per-run daemon.json path, and preset daemons keep a dedicated service whose Codex presets also receive daemon anchors. The net effect is a practical improvement in Codex prompt-cache hit opportunity without crossing isolation boundaries between independent runs.',
  summaryZh:
    '这是 v0.12.3 之后一次范围极窄的内核发布，全部聚焦于 Codex 缓存身份。root agent 现在从 resolved agent/init.json 路径派生一个稳定的 8 位 sha256 前缀哈希，并将其逐字节一致地用作 Codex session-id、thread-id 与 prompt_cache_key，使同一 agent 的多轮对话在 provider 眼中像一段连续会话。LingTai 后端 daemon run 不再共用一个父级/全局身份：每次 run 获得自己 daemon 作用域的 LLMService，以及从其 resolved per-run daemon.json 路径派生的 Codex anchor；preset daemon 保留专用 service，其 Codex preset 同样获得 daemon anchor。整体效果是在不跨越独立 run 隔离边界的前提下，实际提升 Codex prompt-cache 的命中机会。',
  features: [
    {
      titleEn: 'Root agent cache identity is stable and aligned',
      titleZh: 'root agent 缓存身份稳定且对齐',
      leadEn:
        'A root agent now has a single, deterministic cache identity that it presents to Codex across every turn of its life, instead of values that drifted or were generated fresh per request.',
      leadZh:
        'root agent 现在拥有单一、确定性的缓存身份，并在其整个生命周期的每一轮都向 Codex 呈现该身份，而不是逐请求漂移或重新生成。',
      bulletsEn: [
        'The kernel derives a stable 8-character hash as the first 8 hex characters of the sha256 of the resolved agent/init.json path; resolving the path first means the same agent maps to the same hash regardless of how it was addressed.',
        'That single hash is used byte-identically as the Codex session-id, the thread-id, and the prompt_cache_key, so all three routing/cache surfaces agree for the same logical agent.',
        'Because the identity is derived from a resolved on-disk path rather than per-call state, it is stable across restarts, reconnects, and repeated turns within the same agent.',
      ],
      bulletsZh: [
        '内核取 resolved agent/init.json 路径的 sha256，截取前 8 个十六进制字符作为稳定哈希；先做路径解析意味着同一 agent 无论以何种方式被寻址都映射到同一哈希。',
        '该哈希被逐字节一致地用作 Codex session-id、thread-id 与 prompt_cache_key，使同一逻辑 agent 的三个路由/缓存面彼此一致。',
        '由于身份来自 resolved 磁盘路径而非逐调用状态，它在重启、重连与同一 agent 的多轮之间保持稳定。',
      ],
      whyEn:
        'Codex prompt caching rewards a stable, repeated conversation identity. When session-id, thread-id, and prompt_cache_key all agree and persist, the provider can recognize that a new turn continues an existing context, so the shared prefix is served from cache instead of re-billed and re-encoded.',
      whyZh:
        'Codex prompt 缓存奖励稳定、重复的会话身份。当 session-id、thread-id 与 prompt_cache_key 三者一致并持续存在时，provider 能识别出新一轮是在延续既有上下文，于是共享前缀从缓存命中，而不是重新计费、重新编码。',
    },
    {
      titleEn: 'Daemon runs get their own scoped cache anchors',
      titleZh: 'daemon run 获得自己作用域的缓存 anchor',
      leadEn:
        'LingTai-backend daemon runs no longer borrow the parent or a single global identity. Each run is given a daemon-scoped service and a per-run Codex anchor, so daemons are both cacheable and isolated.',
      leadZh:
        'LingTai 后端 daemon run 不再借用父级或单一全局身份。每次 run 获得 daemon 作用域的 service 与 per-run 的 Codex anchor，使 daemon 既可缓存又彼此隔离。',
      bulletsEn: [
        'Each LingTai-backend daemon run now runs through its own daemon-scoped LLMService rather than sharing the parent agent service.',
        'The Codex anchor for a run is derived from the resolved per-run daemon.json path, using the same resolved-path hashing scheme as the root-agent identity, so each run has a distinct but stable anchor.',
        'Preset daemons keep their own dedicated service, and the Codex presets they use now also receive daemon anchors, so preset-driven daemon work shares the same identity discipline as ad-hoc runs.',
      ],
      bulletsZh: [
        '每个 LingTai 后端 daemon run 现在通过自己 daemon 作用域的 LLMService 运行，而不是共用父 agent service。',
        '某次 run 的 Codex anchor 从 resolved per-run daemon.json 路径派生，采用与 root agent 身份相同的 resolved-path 哈希方案，使每次 run 拥有各自独立但稳定的 anchor。',
        'preset daemon 保留自己专用的 service，它们使用的 Codex preset 现在同样获得 daemon anchor，使 preset 驱动的 daemon 工作与临时 run 共享同一身份纪律。',
      ],
      whyEn:
        'Daemons are how a LingTai agent offloads isolated work. If every daemon reused one parent/global identity, independent runs would collide in the same cache namespace and poison each other; if each generated an unstable identity, none would ever hit cache. Per-run resolved-path anchors give each daemon a stable identity of its own while keeping independent runs cleanly separated.',
      whyZh:
        'daemon 是 LingTai agent 卸载隔离工作的方式。如果每个 daemon 都复用一个父级/全局身份，独立 run 会在同一缓存命名空间里相互碰撞、彼此污染；如果各自生成不稳定身份，则谁都无法命中缓存。per-run 的 resolved-path anchor 让每个 daemon 拥有自己稳定的身份，同时让独立 run 保持干净隔离。',
    },
    {
      titleEn: 'Why the cache rate rises, and why hits did not happen before',
      titleZh: '为什么缓存命中率上升，以及此前为何未命中',
      leadEn:
        'This release is small in code but specific in mechanism. It is worth stating plainly what changed in cache behavior and why the previous arrangement left hits on the table.',
      leadZh:
        '本轮代码量小，但机制具体。值得明确说明缓存行为到底改了什么，以及此前的安排为何把命中白白浪费掉。',
      bulletsEn: [
        'After: repeated turns from the same root agent present one stable, aligned routing/cache identity to Codex, so the provider treats them as a continuing conversation and serves the shared prefix from cache.',
        'After: daemon runs no longer all reuse a single parent/global identity nor generate unstable per-call identities; within one run, session-id, thread-id, and prompt_cache_key align.',
        'Before: session-id, thread-id, and prompt_cache_key were not stable or aligned enough for root agents and daemon runs, so equivalent prompts looked unrelated to Codex and missed the cache.',
        'Before: daemon runs could share a parent service/cache identity or collide and poison each other, so prompts that should have reused a prefix either crossed isolation boundaries or invalidated each other.',
      ],
      bulletsZh: [
        '改动后：同一 root agent 的多轮向 Codex 呈现单一、稳定、对齐的路由/缓存身份，provider 将其视为延续的会话，并从缓存提供共享前缀。',
        '改动后：daemon run 不再全部复用单一父级/全局身份，也不再生成逐调用的不稳定身份；在一次 run 内，session-id、thread-id 与 prompt_cache_key 对齐。',
        '改动前：root agent 与 daemon run 的 session-id、thread-id 与 prompt_cache_key 不够稳定或不够对齐，等价 prompt 在 Codex 看来彼此无关，因而错过缓存。',
        '改动前：daemon run 可能共用父级 service/缓存身份，或相互碰撞、彼此污染，于是本应复用前缀的 prompt 要么越过隔离边界，要么使彼此失效。',
      ],
      whyEn:
        'Prompt caching is a recognition problem: the provider only reuses work when it can recognize that two requests share a logical conversation. The previous identity scheme made that recognition unreliable for exactly the two units that repeat the most — root agents and daemon runs. Fixing identity at those two boundaries is where the hit-rate improvement comes from.',
      whyZh:
        'prompt 缓存本质是一个识别问题：只有当 provider 能识别两次请求属于同一逻辑会话时，才会复用已有工作。此前的身份方案恰恰让最常重复的两个单元——root agent 与 daemon run——的识别变得不可靠。在这两个边界上把身份固定下来，正是命中率提升的来源。',
    },
    {
      titleEn: 'How this compares to OpenClaw, Hermes, and Codex CLI',
      titleZh: '与 OpenClaw、Hermes、Codex CLI 的对比',
      leadEn:
        'This is an architectural comparison, not a benchmark claim. The shared lesson across external CLI/proxy systems is that cache reuse follows whoever owns a stable conversation identity; v0.12.4 makes LingTai own that identity at the agent and run level.',
      leadZh:
        '这是架构层面的对比，而非基准测试结论。外部 CLI/proxy 系统的共同经验是：缓存复用跟随谁持有稳定的会话身份；v0.12.4 让 LingTai 在 agent 与 run 级别持有该身份。',
      bulletsEn: [
        'External coding CLIs and provider proxies (Codex CLI, and CLI/proxy systems in the same family as OpenClaw and Hermes) tend to preserve a stable CLI-side session/thread/conversation identity across turns, which is what lets the provider reuse the cached prefix.',
        'Before v0.12.4, LingTai did not consistently present such a stable identity for its own repeated units, so it could not benefit from the same provider-side reuse even when the prompts were effectively continuations.',
        'v0.12.4 gives LingTai its own stable agent/run anchors derived from resolved paths, so Codex sees the same logical unit consistently across turns — the same property that makes CLI-side sessions cache well.',
        'The difference from a single long-lived CLI session is isolation: LingTai still keeps independent daemons separate via per-run anchors, so it gains the reuse benefit without merging unrelated runs into one shared identity.',
      ],
      bulletsZh: [
        '外部 coding CLI 与 provider proxy（Codex CLI，以及与 OpenClaw、Hermes 同类的 CLI/proxy 系统）通常在多轮之间保持稳定的 CLI 侧 session/thread/conversation 身份，这正是 provider 得以复用缓存前缀的原因。',
        '在 v0.12.4 之前，LingTai 没有为自己重复的单元一致地呈现这样的稳定身份，因此即便 prompt 实质上是延续，也无法享受同样的 provider 侧复用。',
        'v0.12.4 让 LingTai 拥有从 resolved 路径派生的、属于自己的稳定 agent/run anchor，于是 Codex 在多轮之间一致地看到同一逻辑单元——这正是 CLI 侧 session 能良好缓存的同一性质。',
        '与单一长生命周期 CLI session 的区别在于隔离：LingTai 仍通过 per-run anchor 将独立 daemon 分开，因此在获得复用收益的同时，不会把无关 run 合并成一个共享身份。',
      ],
      whyEn:
        'The point of the comparison is to be honest about where the gain comes from. LingTai is not inventing a new caching trick; it is adopting the same stable-identity discipline that well-behaved CLIs already rely on, and applying it at the agent and daemon-run boundaries that are specific to a LingTai network.',
      whyZh:
        '这组对比的目的是诚实地说明收益来源。LingTai 并没有发明新的缓存技巧；它采用的是良好 CLI 早已依赖的同一套稳定身份纪律，并把它应用到 LingTai 网络特有的 agent 与 daemon-run 边界上。',
    },
  ],
  contributors: [
    'huangzesen',
    'Jason H',
  ],
  validation: {
    commit: 'c6f03785c1d911ce3c549f59aa6fa331c44e8d5e',
    items: [
      { label: 'Kernel pytest release suite', result: '2273 passed / 4 skipped' },
      { label: 'Kernel build', result: '`python -m build` produced sdist + macOS arm64 wheel for lingtai 0.12.4' },
      { label: 'Twine package check', result: '`python -m twine check dist/*` passed' },
      { label: 'Clean-venv validation', result: 'fresh venv install and import of lingtai 0.12.4 passed' },
      { label: 'Release tag', result: 'v0.12.4 at commit c6f03785c1d911ce3c549f59aa6fa331c44e8d5e' },
      { label: 'PyPI visibility', result: 'lingtai 0.12.4 published and visible on PyPI' },
    ],
  },
  links: [
    { label: 'Kernel GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.12.4' },
    { label: 'PyPI', href: 'https://pypi.org/project/lingtai/0.12.4/' },
    { label: 'Compare v0.12.3...v0.12.4', href: 'https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.12.3...v0.12.4' },
    { label: 'Release commit', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/c6f03785c1d911ce3c549f59aa6fa331c44e8d5e' },
  ],
};

const v0_12_3_kernel: Release = {
  id: '20260614-1',
  version: 'v0.12.3',
  titleEn: 'LingTai kernel v0.12.3',
  titleZh: '灵台内核 v0.12.3',
  date: '2026-06-14',
  pkg: 'lingtai',
  tag: 'v0.12.3',
  install: 'python -m pip install --upgrade lingtai==0.12.3',
  runtimeNoteEn:
    'This is a kernel-only release for the LingTai runtime package. TUI/Portal and recipe changes are intentionally outside this release scope; normal projects that are managed by the TUI may continue to receive kernel updates through their usual runtime environment, while bare pip install remains useful for release, diagnostic, and clean-venv validation paths.',
  runtimeNoteZh:
    '这是一次仅面向灵台内核/runtime 包的发布。TUI/Portal 与 recipe 变更不在本轮范围内；由 TUI 管理的普通项目仍通过既有 runtime 环境获得内核更新，裸 pip install 更适合发布、诊断或 clean-venv 验证路径。',
  summaryEn:
    'A focused kernel release after v0.12.2: daemon tasks can now carry explicit one-run MCP registrations, /daemon list gains historical run records with search/filter metadata and lazy data-version migration, and the agent procedures now teach a pad-first daemon workflow that protects the parent context while sending noisy work to disposable workers.',
  summaryZh:
    '这是 v0.12.2 之后的一次聚焦内核发布：daemon task 现在可以携带显式的一次性 MCP 注册；/daemon list 获得历史运行记录、搜索/过滤元数据与 data_version 懒迁移；agent procedures 也把“先写 pad、父灵运筹、daemon 处理噪声”的工作流正式沉淀下来，以保护主上下文。',
  features: [
    {
      titleEn: 'Task-scoped MCP tools for daemon work',
      titleZh: 'daemon 任务级 MCP 工具',
      leadEn:
        'Daemon tasks can now declare the MCP servers they need for a single run, instead of assuming the parent agent should expose every integration to every worker.',
      leadZh:
        'daemon task 现在可以为单次运行声明自己需要的 MCP server，而不再假设父 agent 要把所有集成暴露给每个 worker。',
      bulletsEn: [
        '`tasks[].mcp` accepts one-run registration objects for stdio or HTTP MCP servers, including command/args/env or URL/header configuration.',
        'The daemon prompt receives redacted YAML context for the task-scoped MCPs; secrets are not copied into the visible transcript.',
        'LingTai-backed daemon runs launch and clean up task-scoped MCP clients, and CLI-backed daemons can still receive the contract as visible context.',
      ],
      bulletsZh: [
        '`tasks[].mcp` 接受一次性 registration object，可描述 stdio 或 HTTP MCP server，包括 command/args/env 或 URL/header 配置。',
        'daemon prompt 会收到已脱敏的 YAML 上下文；secret 不会被复制进可见 transcript。',
        'LingTai 后端 daemon 会启动并清理任务级 MCP client；CLI 后端 daemon 也能以可见上下文接收这份契约。',
      ],
      whyEn:
        'Specialized workers can borrow exactly the integrations needed for their job without widening the parent agent surface or making daemon prompts depend on ambient, hidden tools.',
      whyZh:
        '专门的 worker 可以只借用本任务需要的集成，不必扩大父 agent 的工具面，也不让 daemon prompt 依赖隐含的环境工具。',
    },
    {
      titleEn: 'Daemon list becomes a progressive-disclosure index',
      titleZh: 'daemon list 成为渐进披露索引',
      leadEn:
        '`daemon(action="list")` now reads persistent `daemon.json` records instead of forcing the parent to mine raw logs first.',
      leadZh:
        '`daemon(action="list")` 现在读取持久化的 `daemon.json` 记录，不再要求父 agent 一上来就挖原始日志。',
      bulletsEn: [
        'Historical run records expose ids, backend, task preview, status, result paths, prompt preview paths, group ids, visible call parameters, and search/filter-friendly metadata.',
        'Missing, invalid, non-object, or stale records are rebuilt best-effort at list time from the run directory, prompt file, result file, and event-log tail.',
        '`data_version` and `migration` audit fields make rebuilt records explicit while preserving unknown backend-specific fields where possible.',
      ],
      bulletsZh: [
        '历史运行记录会暴露 id、backend、task preview、status、result path、prompt preview path、group id、可见 call 参数，以及便于搜索/过滤的元数据。',
        '缺失、无效、非 object 或旧版本记录会在 list 时从 run 目录、prompt 文件、result 文件与 event log 尾部 best-effort 重建。',
        '`data_version` 与 `migration` 审计字段会明确标记重建记录，并尽量保留未知的后端专属字段。',
      ],
      whyEn:
        'The normal inspection path is now list first, read the relevant artifact second, and only grep raw traces when needed; that keeps parent context and human attention clean.',
      whyZh:
        '常规排查路径变成先 list、再读相关 artifact、必要时才 grep 原始 trace；这能节省父 agent 上下文，也节省人的注意力。',
    },
    {
      titleEn: 'Daemon workflow discipline is now part of the kernel manuals',
      titleZh: 'daemon 工作流纪律进入内核手册',
      leadEn:
        'The procedures prompt and manual now describe daemon use as a planning pattern, not just a tool call.',
      leadZh:
        'procedures prompt 与 manual 现在把 daemon 用法写成一种规划模式，而不只是一个工具调用。',
      bulletsEn: [
        'Before substantial daemon work, the parent should record objective, assumptions, daemon split, expected artifacts, stop criteria, and who or what is waiting in the pad or task document.',
        'The parent agent plans, synthesizes, decides, and verifies; daemon workers handle noisy scans, deterministic transforms, read-only reviews, batch conversion, and log mining.',
        'The parent reclaims evidence and conclusions, then persists durable results without dragging the full daemon transcript back into the main context.',
      ],
      bulletsZh: [
        '在较大的 daemon 工作开始前，父 agent 应在 pad 或任务文档中记录 objective、assumptions、daemon split、expected artifacts、stop criteria，以及谁/什么在等待。',
        '父 agent 负责规划、综合、决策与验证；daemon worker 负责嘈杂扫描、确定性转换、只读 review、批处理转换与日志挖掘。',
        '父 agent 收回证据与结论，并把可持久化结果沉淀下来，而不是把 daemon transcript 全量拖回主上下文。',
      ],
      whyEn:
        'This release turns a hard-won operating habit into the default method: spend the expensive context on judgment, and spend cheap isolated workers on noise.',
      whyZh:
        '这次发布把一条来之不易的工作习惯变成默认方法：昂贵上下文用于判断，便宜且隔离的 worker 用来处理噪声。',
    },
  ],
  contributors: [
    'huangzesen',
    'Jason H',
    'TZZheng',
    'ktwu01',
    '9s5bz2jvd2-lang',
    '888yzbt888',
    'a-green-hand-jack',
    'antimonyz',
    'BatalloLu',
    'qingyong-hu',
    'vvvhappyvvv',
    'xczics',
    'ZacharyHu0',
    'ZigongXu',
  ],
  validation: {
    commit: '73253e514888abf26da27e00bb417d2fc12ff054',
    items: [
      { label: 'Whitespace / diff hygiene', result: '`git diff --check v0.12.2...HEAD` passed' },
      { label: 'Python compile check', result: '`python -m compileall -q src tests` passed' },
      { label: 'Focused pytest release suite', result: '448 passed in 46.80s' },
      { label: 'Kernel build', result: 'sdist + macOS arm64 wheel built for lingtai 0.12.3' },
      { label: 'Twine package check', result: '`python -m twine check dist/*` passed' },
      { label: 'PyPI visibility', result: 'PyPI JSON and `pip index --no-cache-dir` show 0.12.3 as latest' },
    ],
  },
  links: [
    { label: 'Kernel GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.12.3' },
    { label: 'PyPI', href: 'https://pypi.org/project/lingtai/0.12.3/' },
    { label: 'Compare v0.12.2...v0.12.3', href: 'https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.12.2...v0.12.3' },
    { label: 'Daemon MCP/list PR #289', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/289' },
    { label: 'Daemon workflow PR #290', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/290' },
  ],
};

const v0_9_1_v0_12_2: Release = {
  id: '20260613-2',
  version: 'v0.9.1 / v0.12.2',
  titleEn: 'LingTai TUI/Portal v0.9.1 + Kernel v0.12.2',
  titleZh: '灵台 TUI/Portal v0.9.1 与内核 v0.12.2',
  date: '2026-06-13',
  pkg: 'lingtai-tui + lingtai',
  tag: 'v0.9.1 / v0.12.2',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    'This small-patch release pairs TUI/Portal v0.9.1 with Kernel/runtime package lingtai==0.12.2. Ordinary LingTai projects upgrade through the TUI/Homebrew flow; bare pip install lingtai remains a release, diagnostic, or clean-venv validation path rather than the normal user upgrade route.',
  runtimeNoteZh:
    '这是一篇小版本发布日志，配对 TUI/Portal v0.9.1 与内核/runtime 包 lingtai==0.12.2。普通 LingTai 项目仍通过 TUI/Homebrew 路径升级；裸 pip install lingtai 适合发布、诊断或 clean-venv 验证，不是正常用户升级路径。',
  summaryEn:
    'A focused patch after the v0.9.0 / v0.12.0 release train: coding CLIs move out of Swiss Knife into first-class bash-manual harnesses; daemon execution gains MiMo Code, Qwen Code, and Oh-My-Pi backends; the Zhipu picker exposes GLM-5.2; and new agents default to a 300k context window. The release keeps the previous release-log boundary clear: ToolCallGuard, structured tool-error recovery, Ctrl+O cockpit work, /setup keep-current behavior, and Telegram reconnect recovery remain same-window context already covered by 20260613-1, not newly claimed post-tag work here.',
  summaryZh:
    '这是 v0.9.0 / v0.12.0 发布列车之后的一次聚焦补丁：coding CLI 从 Swiss Knife 迁出，成为 bash-manual 的一等 harness；daemon 执行新增 MiMo Code、Qwen Code、Oh-My-Pi 后端；Zhipu 模型选择器暴露 GLM-5.2；新 agent 默认 context window 提升到 300k。本文保持清晰的 release-log 边界：ToolCallGuard、结构化工具错误恢复、Ctrl+O cockpit、/setup keep-current 行为与 Telegram 重连恢复，是 20260613-1 已覆盖的同窗口 context，不在此重复声明为 post-tag 新变化。',
  features: [
    {
      titleEn: 'Coding CLIs became first-class bash harnesses',
      titleZh: 'Coding CLI 成为一等 bash harness',
      leadEn:
        'The kernel now owns reusable bash-manual harness pages for coding CLIs, while the TUI trims Swiss Knife back to small utilities and routes operator guidance to the new home.',
      leadZh:
        '内核现在承载可复用的 bash-manual coding CLI harness 页面；TUI 则把 Swiss Knife 收回到小工具定位，并把操作指引导向新的归属地。',
      bulletsEn: [
        'Kernel #277 adds bash-manual subskills for Claude Code, OpenAI Codex, OpenCode, Cursor Agent, MiMo Code, Qwen Code, and Oh-My-Pi.',
        'Docs-first candidate pages also reserve space for Gemini CLI, Aider, Goose, OpenHands, Crush, and Zed/ACP without pretending those integrations are release-ready.',
        'TUI #335 removes the old coding-CLI guidance from Swiss Knife and replaces it with a bash-cli-harnesses redirect, keeping Swiss Knife focused on MiniMax, vision, listen, academic research, HTML reports, Xiaomi MiMo, and Zhipu coding-plan discovery.',
      ],
      bulletsZh: [
        '内核 #277 为 Claude Code、OpenAI Codex、OpenCode、Cursor Agent、MiMo Code、Qwen Code、Oh-My-Pi 新增 bash-manual 子技能。',
        'Gemini CLI、Aider、Goose、OpenHands、Crush、Zed/ACP 保留为 docs-first 候选页，不把尚未成熟的集成写成已发布能力。',
        'TUI #335 从 Swiss Knife 移除旧的 coding-CLI 指引，改为 bash-cli-harnesses redirect，让 Swiss Knife 回到 MiniMax、vision、listen、academic research、HTML reports、Xiaomi MiMo、Zhipu coding-plan discovery 等小工具定位。',
      ],
      whyEn:
        'Operator guidance now lives next to the shell tool that actually runs long-lived CLI work, reducing duplicated docs and making future harnesses easier to add safely.',
      whyZh:
        '操作指引现在靠近真正执行长时间 CLI 工作的 shell 工具，减少重复文档，也让后续 harness 更容易安全扩展。',
    },
    {
      titleEn: 'Daemon coding backend coverage expanded',
      titleZh: 'Daemon coding 后端覆盖面扩大',
      leadEn:
        'Kernel v0.12.2 adds three more provider-family daemon backends while keeping the higher-level daemon workflow unchanged for agents.',
      leadZh:
        '内核 v0.12.2 新增三个 provider-family daemon 后端，同时保持 agent 侧高层 daemon workflow 不变。',
      bulletsEn: [
        'Kernel #275 adds MiMo Code as mimocode / mimo and Qwen Code as qwen-code / qwen through the OpenCode-family JSON runner.',
        'Kernel #276 adds Oh-My-Pi as oh-my-pi / omp, giving agents another coding-agent route when that CLI is the right fit.',
        'The daemon documentation and i18n strings were updated so the new backends appear in the same operational vocabulary as existing CLI backends.',
      ],
      bulletsZh: [
        '内核 #275 通过 OpenCode-family JSON runner 新增 MiMo Code（mimocode / mimo）与 Qwen Code（qwen-code / qwen）。',
        '内核 #276 新增 Oh-My-Pi（oh-my-pi / omp），当该 CLI 更合适时，agent 又多一个 coding-agent 路由。',
        'daemon 文档与 i18n 字符串同步更新，使新后端使用与既有 CLI 后端一致的操作语言。',
      ],
      whyEn:
        'LingTai agents can route isolated coding work to more external agent families without changing the parent workflow or treating each CLI as a one-off exception.',
      whyZh:
        'LingTai agent 可以把隔离的 coding 工作路由到更多外部 agent 家族，而不需要改变父层 workflow，也不必把每个 CLI 当作一次性例外。',
    },
    {
      titleEn: 'GLM-5.2 and a larger default context window landed in the TUI',
      titleZh: 'TUI 纳入 GLM-5.2，并提升默认 context window',
      leadEn:
        'The TUI side of this patch is small but user-visible: Zhipu users can pick GLM-5.2, and new/default project agents start with a larger context budget.',
      leadZh:
        '这次 TUI 侧改动小但可见：Zhipu 用户可以选择 GLM-5.2，新建/默认项目 agent 则获得更大的上下文预算。',
      bulletsEn: [
        'Commit 9e6ae53 adds GLM-5.2 to the Zhipu model picker ahead of the older GLM models and registers its vision capability.',
        'TUI #339 raises the default agent context window to 300k for new/default project agents.',
        'Both changes are small release-train polish: they make stronger models and larger work windows available without changing the release workflow.',
      ],
      bulletsZh: [
        'commit 9e6ae53 把 GLM-5.2 加入 Zhipu 模型选择器，排在旧 GLM 模型之前，并登记其 vision 能力。',
        'TUI #339 将新建/默认项目 agent 的默认 context window 提升到 300k。',
        '两者都是小版本列车上的体验打磨：更强模型和更大工作窗口可用，但不改变 release workflow。',
      ],
      whyEn:
        'Model choice and context budget are day-to-day operator ergonomics. This patch makes the stronger preset and safer default capacity available before the next larger release train.',
      whyZh:
        '模型选择与上下文预算都是日常操作体验。这个补丁在下一轮大版本之前，先把更强 preset 与更稳妥的默认容量交到用户手里。',
    },
    {
      titleEn: 'Same-window reliability work remains context, not double-counted change',
      titleZh: '同窗口可靠性工作作为 context，不重复计入新变化',
      leadEn:
        'This page intentionally separates strict post-tag delta from the broader release window, so the small patch does not over-claim work already documented in 20260613-1.',
      leadZh:
        '本文刻意区分严格 post-tag delta 与更宽的 release window，避免把 20260613-1 已写过的工作重复声明为本补丁的新变化。',
      bulletsEn: [
        'ToolCallGuard (#270), idle-care/watchdog guidance (#271), and structured tool-error recovery metadata (#273) remain the kernel governance/recovery foundation covered by the previous release log.',
        'The TUI Ctrl+O tool-noise ladder (#325, #330, #331, #332, #333, #334) and /setup keep-current fix (#327) shipped in v0.9.0 and remain context for the current operator-facing polish.',
        'Telegram polling disconnect recovery (#35) and README product-positioning work (#219/#220) are referenced as release-window context rather than new v0.9.1/v0.12.2 delta.',
        'PR #340 is still open and is not included in this release.',
      ],
      bulletsZh: [
        'ToolCallGuard（#270）、idle-care/watchdog 指引（#271）、结构化工具错误恢复元数据（#273）仍是上一篇 release log 已覆盖的内核治理/恢复基础。',
        'TUI Ctrl+O 工具噪音阶梯（#325、#330、#331、#332、#333、#334）与 /setup keep-current 修复（#327）已在 v0.9.0 交付，是当前操作体验打磨的上下文。',
        'Telegram polling 断线恢复（#35）和 README 产品定位（#219/#220）作为 release-window context 引用，而不是新的 v0.9.1/v0.12.2 delta。',
        'PR #340 仍处于 open 状态，不包含在本次发布中。',
      ],
      whyEn:
        'Small patch notes are most useful when they are honest about scope. The context explains why this patch matters without blurring what actually changed after the last tags.',
      whyZh:
        '小版本说明最重要的是范围诚实。context 解释本补丁为何重要，但不模糊上一个 tag 之后到底改了什么。',
    },
  ],
  contributors: ['huangzesen'],
  validation: {
    commit: 'lingtai d73aaaa6afa042b1080a57f34871194840b3b2b2 / lingtai-kernel c43434f12155c9bb6d20fcecb6b5831dd7852c34',
    items: [
      { label: 'TUI diff check', result: 'passed' },
      { label: 'TUI tests', result: 'go test -count=1 ./... passed' },
      { label: 'Portal web build', result: 'npm ci + npm run build passed; one known moderate npm audit warning noted' },
      { label: 'Portal Go tests', result: 'passed' },
      { label: 'TUI/Portal builds', result: 'lingtai-tui + lingtai-portal built successfully' },
      { label: 'Kernel diff check', result: 'passed' },
      { label: 'Kernel compileall', result: 'passed' },
      { label: 'Kernel pytest release suite', result: '538 passed' },
      { label: 'Kernel build', result: 'sdist + macOS arm64 wheel built' },
      { label: 'Twine check', result: 'passed' },
      { label: 'PyPI JSON verification', result: 'lingtai 0.12.2 files visible' },
      { label: 'Homebrew tap', result: 'lingtai-tui.rb at version 0.9.1' },
    ],
  },
  links: [
    { label: 'TUI GitHub release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.1' },
    { label: 'Kernel GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.12.2' },
    { label: 'PyPI', href: 'https://pypi.org/project/lingtai/0.12.2/' },
    { label: 'Homebrew formula', href: 'https://github.com/Lingtai-AI/homebrew-lingtai/blob/main/lingtai-tui.rb' },
    { label: 'TUI commit', href: 'https://github.com/Lingtai-AI/lingtai/commit/d73aaaa6afa042b1080a57f34871194840b3b2b2' },
    { label: 'Kernel commit', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/c43434f12155c9bb6d20fcecb6b5831dd7852c34' },
  ],
};
const v0_9_0_v0_12_0: Release = {
  id: '20260613-1',
  version: 'v0.9.0 / v0.12.0',
  titleEn: 'LingTai TUI/Portal v0.9.0 + Kernel v0.12.0',
  titleZh: '灵台 TUI/Portal v0.9.0 与内核 v0.12.0',
  date: '2026-06-13',
  pkg: 'lingtai-tui + lingtai',
  tag: 'v0.9.0 / v0.12.0',
  install: 'brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui',
  runtimeNoteEn:
    "This is the release log for TUI/Portal v0.9.0 and Kernel/runtime package lingtai==0.12.0. Ordinary LingTai projects upgrade through the TUI/Homebrew flow; bare pip install lingtai remains a release, diagnostic, or clean-venv validation path rather than the normal user upgrade route.",
  runtimeNoteZh:
    "这是 TUI/Portal v0.9.0 与内核/runtime 包 lingtai==0.12.0 的发布日志。普通 LingTai 项目仍通过 TUI/Homebrew 路径升级；裸 pip install lingtai 适合发布、诊断或 clean-venv 验证，不是正常用户升级路径。",
  summaryEn:
    "This release log is written from the previous published release log to the current v0.9.0 / v0.12.0 release, not merely from the immediately previous patch tag. The audited window spans LingTai TUI/Portal, lingtai-kernel, and the Telegram addon work that affected the same operating surface: 129 commits, 370 changed files, +31,717 / -2,047 lines, 109 PRs updated in the window (81 merged, 20 closed unmerged), and 48 issues (41 closed). The main theme is operational quality under real load: the TUI becomes a layered cockpit for long agent runs; setup, presets, manifests, and first-run paths become harder to misread; the kernel turns tool execution into a governed and observable surface; daemon/idle-care practices become explicit operations; knowledge, skills, tutorials, and research workflows become more teachable; MCP/chat/mail integrations become more reliable; and release hygiene records the validation, packaging, Homebrew, PyPI, contributors, and lessons for the next release.",
  summaryZh:
    "这篇 release log 从上一篇已发布 release log 写到当前 v0.9.0 / v0.12.0，而不是只比较前一个 patch tag。审计窗口覆盖 LingTai TUI/Portal、lingtai-kernel，以及影响同一运行面的 Telegram addon 工作：129 commits、370 个文件、+31,717 / -2,047 行；窗口内 109 个 PR 有更新（81 merged，20 closed unmerged），48 个 issue（41 closed）。主线是“真实负载下的运行质量”：TUI 变成长任务的分层 cockpit；setup、preset、manifest 与首次安装路径更不容易误读；内核把工具执行变成可治理、可观察的执行面；daemon/idle-care 被当成显式运维对象；知识、技能、教程与研究流程更可教学；MCP/聊天/邮件集成更可靠；发布卫生则记录验证、打包、Homebrew、PyPI、贡献者与下一次 release 应继承的流程。",
  features: [
    {
      titleEn: "The release window is much larger than a patch note",
      titleZh: "这不是一个 patch note，而是一整个发布窗口",
      leadEn:
        "This log is written from the previous published release log, not only from the immediately previous tag. The covered window spans TUI/Portal, the kernel, and the Telegram addon work that affected the same operating surface.",
      leadZh:
        "这篇日志按上一篇已发布 release log 往后写，而不是只比较前一个 tag。覆盖窗口横跨 TUI/Portal、内核，以及影响同一条通讯面的 Telegram addon 工作。",
      bulletsEn: [
        "Across the audited repositories the window contains 129 commits, 370 changed files, +31,717 / -2,047 lines.",
        "TUI/Portal contributes 58 commits and 108 changed files (+6,443 / -986) from v0.8.15 to v0.9.0.",
        "Kernel contributes 40 commits and 234 changed files (+22,416 / -676) from v0.11.3 to v0.12.0.",
        "Telegram addon contributes 31 commits and 28 changed files (+2,858 / -385) from v0.3.0 to current main in the same release-log window.",
        "The GitHub surface contains 109 PRs updated in the window (81 merged, 20 closed unmerged) plus 48 issues (41 closed).",
        "The contributor list includes commit authors/co-authors, merged PR authors, closed-unmerged PR authors, issue reporters, assignees/reviewers, and participants whose issue or PR was closed even when the proposal was not adopted.",
      ],
      bulletsZh: [
        "本次审计的相关仓库窗口合计 129 commits、370 个文件变更、+31,717 / -2,047 行。",
        "TUI/Portal 从 v0.8.15 到 v0.9.0：58 commits，108 个文件，+6,443 / -986。",
        "Kernel 从 v0.11.3 到 v0.12.0：40 commits，234 个文件，+22,416 / -676。",
        "Telegram addon 从 v0.3.0 到当前 main：31 commits，28 个文件，+2,858 / -385，属于同一个 release-log 窗口。",
        "GitHub 侧窗口包含 109 个更新过的 PR（81 merged，20 closed unmerged）和 48 个 issue（41 closed）。",
        "贡献者不只按 commit 算：merged PR、closed unmerged PR、closed issue 的作者/报告者/协作者/审阅者都纳入；未采纳但被关闭的 issue/PR 也算进贡献窗口。",
      ],
      whyEn:
        "The scale matters because the release blog is the public memory of the project. If the window is counted too narrowly, contributors disappear and operators lose the real shape of the work.",
      whyZh:
        "规模本身很重要，因为 release blog 是项目的公开记忆。窗口算窄了，贡献者会消失，使用者也看不到这轮工作的真实形状。",
    },
    {
      titleEn: "TUI becomes an operator cockpit for long runs",
      titleZh: "TUI 从 transcript 变成长期运行的 cockpit",
      leadEn:
        "The strongest user-facing theme is readability under load. Long agent runs now have a layered replay path, quieter defaults, and more places where the UI shows the runtime state instead of hiding it in raw logs.",
      leadZh:
        "最外显的主题是负载下的可读性。长时间 agent 运行现在有分层回放路径、更安静的默认界面，以及更多把 runtime state 直接展示出来的入口，而不是把它藏在原始日志里。",
      bulletsEn: [
        "Text output and Ctrl+O replay are separated by API call, so multiple model invocations read as distinct steps.",
        "Tool-call display controls, tool-result payload rendering, tool-result summaries, two Ctrl+O detail levels, and a 100-rune tool-call summary cap make replay usable instead of overwhelming.",
        "The TUI daemon browser, independent daemon pane scrolling, daemon counts in kanban, and daemon detail layout fixes make background work visible.",
        "Kanban gained context stats and clearer Ctrl+D detail hints; list views became closer to a decentralized contact book.",
        "Root-owned layout budgeting, adaptive mail input height, and global status-bar design work make the shell more stable for dense sessions.",
        "The TUI /clear path is routed through kernel context clear, reducing mismatch between the interface and the runtime operation.",
      ],
      bulletsZh: [
        "文本输出和 Ctrl+O 回放按 API call 分段，多次模型调用读起来是步骤，而不是一整团 transcript。",
        "tool-call display controls、tool-result payload 渲染、tool-result 摘要、两级 Ctrl+O 详情，以及 100-rune tool-call 摘要封顶，让回放可用而不是淹没人。",
        "TUI daemon browser、daemon pane 独立滚动、kanban daemon 计数、daemon detail layout 修复，让后台工作真正可见。",
        "Kanban 增加 context stats 和 Ctrl+D 详情提示；list view 更接近一个去中心化 contact book。",
        "root-owned layout budget、自适应 mail input 高度、全局 status bar 设计，让高密度会话下的 shell 更稳定。",
        "TUI /clear 走内核 context clear，减少界面操作与 runtime 实际行为之间的错位。",
      ],
      whyEn:
        "When agents work for a long time, the UI cannot be a text dump. It has to preserve attention: summary first, details on demand, and runtime state where the operator can see it.",
      whyZh:
        "agent 长时间工作时，UI 不能只是文本倾倒。它要保护人的注意力：先摘要，需要时展开细节，并把 runtime state 放到操作者能看到的位置。",
    },
    {
      titleEn: "Setup, presets, manifests, and first-run paths are safer",
      titleZh: "setup、preset、manifest 与首次安装路径更安全",
      leadEn:
        "Several fixes close the gap between what the operator selected and what the runtime actually loaded. This section also carries forward the v0.8.16 preset-safety patch that was not given its own release log.",
      leadZh:
        "这一组改动修的是“人选择的配置”和“runtime 实际加载的配置”之间的缝。这里也补上没有单独发 release log 的 v0.8.16 preset 安全 patch。",
      bulletsEn: [
        "Switching preset models no longer drops skills.paths or other non-model capability overrides; old presets without skills.paths are migrated.",
        "/setup no longer writes a synthetic keep_current.json placeholder into real preset default/allowed policy.",
        "The TUI can read resolved manifest artifacts published by the kernel, so the interface can inspect effective runtime state instead of only raw init.json.",
        "Default agent max_turns increased, and list/max-turns surfaces now describe the actual operating limits more accurately.",
        "Tutorial language defaulting, adaptive welcome guidance, first-install troubleshooting, README top guidance, and install.sh source helper behavior were repaired.",
        "Runtime checkout refresh and stale worktree cleanup were added to developer/release procedures so local state does not silently poison future work.",
      ],
      bulletsZh: [
        "切换 preset model 不再丢掉 skills.paths 或其他非模型 capability overrides；缺少 skills.paths 的旧 preset 会迁移补齐。",
        "/setup 不再把 synthetic keep_current.json placeholder 写进真实 preset default/allowed policy。",
        "TUI 可以读取内核发布的 resolved manifest artifacts，因此界面能看 effective runtime state，而不是只看 raw init.json。",
        "默认 agent max_turns 提高；list/max-turns 相关界面更准确地描述真实运行限制。",
        "Tutorial 语言默认值、adaptive welcome 的 IM 建议、首次安装 troubleshooting、README 顶部指引、install.sh source helper 都做了修复。",
        "runtime checkout refresh 与 stale worktree cleanup 写进开发/发布流程，避免本地状态静默污染后续工作。",
      ],
      whyEn:
        "Configuration drift is one of the easiest ways to lose trust in an agent system. This release spends real work making effective state inspectable and safer to mutate.",
      whyZh:
        "配置漂移最容易损害对 agent 系统的信任。这轮发布花了不少工作，让 effective state 更可检查，也更安全地被修改。",
    },
    {
      titleEn: "Kernel tool execution becomes governed and observable",
      titleZh: "内核工具执行变得可治理、可观察",
      leadEn:
        "Kernel v0.12.0 reshapes tool execution as a structured runtime surface. It removes brittle nested call paths, adds tracing and guard layers, and returns richer recovery information to the model.",
      leadZh:
        "内核 v0.12.0 把工具执行重塑成结构化 runtime surface：移除脆弱的嵌套调用路径，加入 tracing 与 guard layer，并把更丰富的 recovery 信息返回给模型。",
      bulletsEn: [
        "The nested secondary tool-call channel was removed after transitional read-only restrictions; stale secondary args are no longer a hidden execution path.",
        "Tool-call lifecycle tracing and api_call_id fields now group LLM/tool events, matching the TUI replay work.",
        "ToolCallGuard introduces normalized proposal review with structured pass/warn/deny decisions before dispatch.",
        "Repeated tool-error pairing, tool-loop non-dispatch recovery, formal recovery metadata, active-turn progress meters, and repeated-call advisories make recovery less disruptive.",
        "Notification sync became tool-only; MCP previews are deduped; goal/system notifications gained protection and atomic dismiss controls.",
        "OpenAI Responses compact-threshold handling, context-window overflow recovery, strict avatar schema compatibility, and prompt_cache_key support make provider integrations safer.",
      ],
      bulletsZh: [
        "嵌套 secondary tool-call channel 在过渡性 read-only 限制后被移除；stale secondary args 不再是隐藏执行路径。",
        "tool-call lifecycle tracing 与 api_call_id 字段把 LLM/tool events 分组，和 TUI 回放改动对齐。",
        "ToolCallGuard 在 dispatch 前引入 normalized proposal review，给出结构化 pass/warn/deny 决策。",
        "重复工具错误 pairing、tool-loop non-dispatch recovery、正式 recovery metadata、active-turn progress meter、repeated-call advisory，让恢复不再那么破坏性。",
        "notification sync 改成 tool-only；MCP previews 去重；goal/system notifications 有保护和 atomic dismiss。",
        "OpenAI Responses compact-threshold、context-window overflow recovery、严格 avatar schema 兼容、prompt_cache_key 支持，让 provider integration 更安全。",
      ],
      whyEn:
        "Future side-effect policy, budget enforcement, and model self-recovery all need a reliable execution ledger. This release builds that ledger into the kernel instead of asking operators to infer it from logs.",
      whyZh:
        "未来的副作用策略、预算控制、模型自恢复，都需要可靠的执行账本。这轮发布把账本放进内核，而不是要求操作者从日志里猜。",
    },
    {
      titleEn: "Daemons, avatars, soul/idle care, and long subprocesses are treated as operations",
      titleZh: "daemon、avatar、心流/idle care 与长 subprocess 被当作运维对象",
      leadEn:
        "Many changes are about keeping a running network healthy after the first happy path. Daemon records, dead parents, long CLI subprocesses, and idle timing all became explicit operational surfaces.",
      leadZh:
        "很多改动不是为了“第一次能跑”，而是为了网络运行久了仍然健康：daemon records、dead parent、长 CLI subprocess、idle timing 都被当成显式运维面。",
      bulletsEn: [
        "Dead-parent daemon records are reaped on startup; daemon max_turns increased to 1000 for larger isolated tasks.",
        "The experimental interactive Claude backend landed for daemon work while preserving managed-workspace boundaries.",
        "Async bash guidance now explicitly requires agent/coding CLIs to run asynchronously rather than blocking the active turn.",
        "Idle-care / watchdog-before-idle is documented: before resting with long subprocess or daemon work pending, arm a wake and later verify logs, processes, outputs, worktree progress, and provider prompts.",
        "Molt-history and session-journal knowledge entries were documented so recovery after context shedding has a durable trail.",
        "Avatar schema strictness and provider relay compatibility were tightened for networks running through stricter APIs.",
      ],
      bulletsZh: [
        "dead-parent daemon records 会在 startup 时清理；daemon max_turns 提高到 1000，支持更大的隔离任务。",
        "experimental interactive Claude backend 落地，用于 daemon work，同时保留 managed-workspace 边界。",
        "async bash 指南明确要求 agent/coding CLI 走异步，不能阻塞 active turn。",
        "idle-care / watchdog-before-idle 写入文档：长 subprocess/daemon work pending 前休息要设置自唤醒，醒来检查日志、进程、输出、worktree 与 provider prompt。",
        "molt-history 与 session-journal knowledge entries 被文档化，凝蜕后的恢复有持久轨迹。",
        "avatar schema strictness 与 provider relay compatibility 被收紧，适应更严格的 API relay。",
      ],
      whyEn:
        "A LingTai network is not a single request/response. It is a living runtime. These changes reduce the number of failures that only appear after an agent has been working for a while.",
      whyZh:
        "LingTai 网络不是一次 request/response，而是持续运行的 runtime。这些改动减少了“跑久了才暴露”的故障。",
    },
    {
      titleEn: "Knowledge, skills, tutorials, and research workflows became more teachable",
      titleZh: "知识、技能、教程与研究流程更可教学",
      leadEn:
        "The release window also expands the methodology layer. Several issues and PRs turned one-off lessons into skills, docs, and reusable guardrails for future agents and human operators.",
      leadZh:
        "这轮窗口也扩展了方法论层：不少 issue 和 PR 把一次性的经验沉淀成技能、文档和可复用 guardrail，给未来的 agent 与人类操作者使用。",
      bulletsEn: [
        "Skill-backed multilingual /help, markdown viewer routing fixes, notification commands, goal request commands, and community slash-command docs make the TUI easier to teach.",
        "Optional skill repository remotes, hidden nested-knowledge catalog behavior, preset-health checks, textbook distillation, and ResearchClawBench docs improve reusable knowledge surfaces.",
        "Academic-research gained Zotero institutional full-text handoff guidance and an evidence-verification gate before academic drafting.",
        "Graphify repo-map documentation, cyclic manifold architecture docs, and beginner/user-manual issues sharpen the project’s conceptual model.",
        "Tutorial material now explains the LICC chat command flow; README/install guidance makes first contact with LingTai less brittle.",
        "Closed community requests around browser-based CLIs, login skills, Feishu/WeChat onboarding, rewind/snapshot inspection, and yolo/permission controls remain part of the public contribution record even when not fully adopted in this release.",
      ],
      bulletsZh: [
        "skill-backed 多语言 /help、markdown viewer routing 修复、notification command、goal request command、社区 slash-command 文档，让 TUI 更容易教学。",
        "optional skill repository remote、nested knowledge catalog 隐藏规则、preset-health、textbook distillation、ResearchClawBench 文档，改善可复用知识面。",
        "academic-research 增加 Zotero institutional full-text handoff 与学术写作前的 evidence-verification gate。",
        "Graphify repo-map 文档、cyclic manifold architecture 文档、beginner/user-manual 相关 issue，让项目概念模型更清晰。",
        "教程补充 LICC chat command flow；README/install 指引降低第一次接触 LingTai 的脆弱性。",
        "browser-based CLI、登录技能、飞书/微信 onboarding、rewind/snapshot inspector、yolo/permission control 等社区请求即使没有在本轮完整采纳，也作为公开贡献记录被保留。",
      ],
      whyEn:
        "A feature is more valuable when future people can learn it without rediscovering the story. This release turns more of LingTai’s operating culture into durable teaching material.",
      whyZh:
        "功能只有被后来者学得会，价值才稳定。这轮发布把更多 LingTai 的运行文化变成了可持久教学材料。",
    },
    {
      titleEn: "MCP, chat, and mail integrations became more reliable",
      titleZh: "MCP、聊天与邮件集成更可靠",
      leadEn:
        "Communication is the lifeline of an agent network. This window adds Cloud Mail to the curated addon set, strengthens the kernel LICC path, and fixes Telegram polling recovery after real transport failures.",
      leadZh:
        "通信是 agent 网络的生命线。这轮窗口把 Cloud Mail 加入 curated addon 集合，强化 kernel LICC 路径，并修复真实 transport failure 后的 Telegram polling recovery。",
      bulletsEn: [
        "Kernel v0.12.0 embeds curated MCP servers and adds the Cloud Mail MCP addon for self-hosted maillab/cloud-mail REST deployments.",
        "Cloud Mail covers check/search/read/send/accounts/add_user plus LICC inbox polling; add_user payload shape was corrected before merge.",
        "The kernel exposes the LICC client interface, and the Telegram addon now prefers that client path.",
        "Telegram polling now rebuilds stale httpx/proxy clients after disconnects, closing the MCP _poll_loop failure reported in the window.",
        "Notification preview dedupe and tool-only notification sync reduce repeated chat replies and diary-looking synthesized text leaks.",
        "Adaptive welcome now recommends IM channels when they are the right interface for a human operator.",
      ],
      bulletsZh: [
        "Kernel v0.12.0 内嵌 curated MCP servers，并新增 Cloud Mail MCP addon，面向 self-hosted maillab/cloud-mail REST 部署。",
        "Cloud Mail 覆盖 check/search/read/send/accounts/add_user 与 LICC inbox polling；add_user payload shape 在 merge 前被修正。",
        "内核暴露 LICC client interface，Telegram addon 现在优先使用该 client path。",
        "Telegram polling 在 httpx/proxy disconnect 后会重建 stale client，修复窗口里报告的 MCP _poll_loop failure。",
        "notification preview dedupe 与 tool-only notification sync 减少重复聊天回复和像 diary 的 synthesized 文本泄漏。",
        "adaptive welcome 在适合时会推荐 IM 通道，帮助人类操作者选对入口。",
      ],
      whyEn:
        "A smart agent that misses or repeats human messages is not operationally trustworthy. The integration work in this release is directly about that trust.",
      whyZh:
        "再聪明的 agent，如果漏消息或重复回复，人也很难信任。这轮集成工作直接服务于这种信任。",
    },
    {
      titleEn: "Release hygiene and packaging are part of the delivery",
      titleZh: "发布卫生与打包验证也是交付的一部分",
      leadEn:
        "The release was published before the final blog, as it should be: versions should not be blocked by prose. The blog then records the validation and the corrections made so the next release is easier.",
      leadZh:
        "版本已先于最终 blog 发布，这也是正确顺序：release 不应该被 prose 卡住。blog 随后记录验证和流程修正，让下一次发布更容易。",
      bulletsEn: [
        "TUI/Portal v0.9.0 was tagged and released on GitHub; the tag workflow updated Homebrew to v0.9.0 with source SHA f811ea3ccf341dd073b8e9728cfa9125bfe578251cc281fac7c90a5837d4a036.",
        "Kernel v0.12.0 was tagged and released on GitHub; lingtai==0.12.0 was built, twine-checked, uploaded to PyPI, and verified as latest.",
        "TUI gates passed: diff check after whitespace normalization, TUI Go tests, portal web build, portal Go tests, TUI build, and portal build.",
        "Kernel gates passed: compileall, 555 focused pytest tests, build of sdist and macOS arm64 wheel, and twine check.",
        "The release-log workflow is being tightened so future blogs start from commits, LOC, merged PRs, closed unmerged PRs, and closed issues by default instead of relying on a narrow patch-note summary.",
      ],
      bulletsZh: [
        "TUI/Portal v0.9.0 已打 tag 并发布 GitHub release；tag workflow 把 Homebrew 更新到 v0.9.0，source SHA 为 f811ea3ccf341dd073b8e9728cfa9125bfe578251cc281fac7c90a5837d4a036。",
        "Kernel v0.12.0 已打 tag 并发布 GitHub release；lingtai==0.12.0 已 build、twine check、上传 PyPI，并验证为 latest。",
        "TUI gates 通过：whitespace normalization 后 diff check、TUI Go tests、portal web build、portal Go tests、TUI build、portal build。",
        "Kernel gates 通过：compileall、555 个 focused pytest、sdist 与 macOS arm64 wheel 构建、twine check。",
        "release-log 流程会固化回 release workflow，以后 release blog 默认从 commits、LOC、merged PR、closed unmerged PR、closed issue 开始，而不是只写一个狭义 patch-note 摘要。",
      ],
      whyEn:
        "A release is not complete just because tags exist; it also needs a public record that names the work, the people, the validation, and the lessons for next time.",
      whyZh:
        "tag 存在不代表 release 记忆完整；它还需要一份公开记录，写清楚工作、贡献者、验证，以及下次应该继承的流程。",
    }
  ],
  contributors: [
    "huangzesen",
    "TZZheng",
    "9s5bz2jvd2-lang",
    "ZigongXu",
    "ZacharyHu0",
    "a-green-hand-jack",
    "ktwu01",
    "antimonyz",
    "xczics",
    "888yzbt888",
    "want2sleeep",
    "BatalloLu",
    "vvvhappyvvv",
    "rawpaper123",
    "qingyong-hu",
    "github-actions[bot]",
    "Claude Fable 5",
    "Claude Sonnet 4.6",
    "Claude Opus 4.8",
    "Claude Opus 4.7",
  ],
  validation: {
    commit:
      'lingtai@518ab63ef2d550fec9a1f4f868b11bc3692392c3 + lingtai-kernel@a0d5309cf847384333bdab83bf3c59f49cf86bdb + lingtai-telegram@8cf97852fa36',
    items: [
      { label: 'Audited release-log window', result: '129 commits; 370 files; +31,717 / -2,047 across TUI/Portal, kernel, and Telegram addon' },
      { label: 'GitHub participation window', result: '109 PRs updated (81 merged, 20 closed unmerged) and 48 issues (41 closed)' },
      { label: 'Contributors / participants', result: '20 commit authors, co-authors, PR authors/reviewers/assignees, and issue reporters/assignees counted' },
      { label: 'TUI diff check', result: 'passed after release whitespace normalization' },
      { label: 'TUI Go tests', result: 'passed' },
      { label: 'Portal web build', result: 'passed; npm audit reported 1 moderate vulnerability' },
      { label: 'Portal Go tests', result: 'passed' },
      { label: 'TUI and Portal builds', result: 'passed' },
      { label: 'Kernel compileall', result: 'passed' },
      { label: 'Kernel focused pytest', result: '555 passed' },
      { label: 'Kernel build + twine check', result: 'passed for sdist and macOS arm64 wheel' },
      { label: 'PyPI', result: 'lingtai==0.12.0 visible as latest' },
      { label: 'Homebrew tap', result: 'updated to v0.9.0 by tag workflow, commit 69aa5c4' },
    ],
  },
  links: [
    { label: 'Previous release log', href: 'https://lingtai.ai/zh/releases/20260609-1/' },
    { label: 'TUI/Portal GitHub release', href: 'https://github.com/Lingtai-AI/lingtai/releases/tag/v0.9.0' },
    { label: 'Kernel GitHub release', href: 'https://github.com/Lingtai-AI/lingtai-kernel/releases/tag/v0.12.0' },
    { label: 'PyPI lingtai 0.12.0', href: 'https://pypi.org/project/lingtai/0.12.0/' },
    { label: 'TUI v0.8.15...v0.9.0 compare', href: 'https://github.com/Lingtai-AI/lingtai/compare/v0.8.15...v0.9.0' },
    { label: 'Kernel v0.11.3...v0.12.0 compare', href: 'https://github.com/Lingtai-AI/lingtai-kernel/compare/v0.11.3...v0.12.0' },
    { label: 'Telegram addon window', href: 'https://github.com/Lingtai-AI/lingtai-telegram/compare/v0.3.0...main' },
    { label: 'Homebrew tap update', href: 'https://github.com/Lingtai-AI/homebrew-lingtai/commit/69aa5c4' },
  ],
};

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

export const releases: Release[] = [v0_15_2_kernel, v0_15_1_kernel_v0_10_1_tui, v0_15_0_kernel_v0_10_0_tui, v0_14_2_kernel_v0_9_6_tui, v0_14_1_kernel, v0_14_0_kernel_v0_9_5_tui, v0_13_0_kernel_v0_9_3_tui, v0_12_4_kernel, v0_12_3_kernel, v0_9_1_v0_12_2, v0_9_0_v0_12_0, v0_8_15_v0_11_3, v0_8_14_v0_11_2, v0_8_13_v0_11_1, v0_8_12_v0_11_0, v0_10_10];

export function getRelease(id: string): Release | undefined {
  return releases.find((r) => r.id === id);
}
