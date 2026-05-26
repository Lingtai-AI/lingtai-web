// Release archive entries. Newest entries go at the top of the `releases` array.
// Detail pages render bilingual content (zh + en) side-by-side per section.

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
  /** Install command, single line. */
  install: string;
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

const v0_10_10: Release = {
  id: '20260526-1',
  version: 'v0.10.10',
  titleEn: 'LingTai Kernel v0.10.10',
  titleZh: '灵台内核 v0.10.10',
  date: '2026-05-26',
  pkg: 'lingtai',
  tag: 'v0.10.10',
  install: 'python -m pip install --upgrade lingtai==0.10.10',
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

export const releases: Release[] = [v0_10_10];

export function getRelease(id: string): Release | undefined {
  return releases.find((r) => r.id === id);
}
