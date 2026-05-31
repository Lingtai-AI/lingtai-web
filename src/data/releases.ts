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
    'A release window about making long-running LingTai work easier to resume and easier to inspect. Molt continuation now relies on explicit post-molt notifications rather than fragile next-action guessing, while local traces gain a rebuildable SQLite index and optional historical backfill. The same window also brings first-party WhatsApp MCP support, a kernel-owned intrinsic doctor, progressive-disclosure guidance for resident prompts, and product/license documentation polish.',
  summaryZh:
    '这次发布窗口的核心是让 LingTai 的长任务更容易续上、更容易检查。molt 后的继续不再依赖脆弱的 next-action 猜测，而是走更明确的 post-molt notification 路径；本地轨迹也获得了可重建的 SQLite 索引与可选历史 backfill。同一窗口还加入了一等 WhatsApp MCP 支持、kernel-owned intrinsic doctor、resident prompt 的 progressive-disclosure 指引，以及产品叙事与 license 文档整理。',
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
    commit: 'lingtai 30b2a58 / lingtai-kernel 30726dd',
    items: [
      { label: 'Kernel SQLite log index PR #201', result: 'focused verification passed; merged' },
      { label: 'Kernel chat/daemon SQLite index PR #203', result: 'focused suite passed with 186 tests; merged' },
      { label: 'TUI SQLite backfill migration PR #221', result: 'go test ./... for TUI passed; portal migration package passed' },
      { label: 'Post-molt continuation PR #190', result: 'merged with notification wake and deferral fixes' },
      { label: 'WhatsApp MCP package', result: 'lingtai-whatsapp v0.1.0 tagged and published' },
      { label: 'Final release validation', result: 'pending tag/package release pass before publishing this entry' },
    ],
  },
  links: [
    { label: 'Post-molt continuation PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/190' },
    { label: 'Kernel SQLite log index PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/201' },
    { label: 'Kernel chat/daemon SQLite index PR', href: 'https://github.com/Lingtai-AI/lingtai-kernel/pull/203' },
    { label: 'TUI SQLite backfill migration PR', href: 'https://github.com/Lingtai-AI/lingtai/pull/221' },
    { label: 'WhatsApp MCP package tag', href: 'https://github.com/Lingtai-AI/lingtai-whatsapp/tree/v0.1.0' },
    { label: 'Kernel main commit', href: 'https://github.com/Lingtai-AI/lingtai-kernel/commit/30726dd7840b5286ad6e65b73dd3b10f86e5af63' },
    { label: 'TUI/Portal main commit', href: 'https://github.com/Lingtai-AI/lingtai/commit/30b2a58' },
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

export const releases: Release[] = [v0_8_13_v0_11_1, v0_8_12_v0_11_0, v0_10_10];

export function getRelease(id: string): Release | undefined {
  return releases.find((r) => r.id === id);
}
