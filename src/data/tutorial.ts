import type { Lang } from '../i18n/translations';

// One typed source of truth for the beginner tutorial, keyed field-by-field across all
// three locales so a locale can never silently fall behind. Kept deliberately separate
// from translations.ts: the tutorial body is long and structured, and does not belong in
// the shared nav/UI string table.
//
// `L` mirrors the localized-string shape used by data/projects.ts, but here `wen` is
// REQUIRED (not optional): the Wen locale is a first-class literary register, never a
// fallback to zh. Literal shell commands live in locale-neutral `string` fields (`cmd`,
// `keys`, `url`) so a command is byte-identical in every language — commands are code,
// not prose to be translated.
export type L = { en: string; zh: string; wen: string };

export function pick(value: L, lang: Lang): string {
  if (lang === 'en') return value.en;
  if (lang === 'wen') return value.wen;
  return value.zh;
}

/** A named concept card: a short name, a one-line gist, and a longer detail. */
type Concept = { name: L; gist: L; detail: L };
/** A slash-command / shell reference row: literal command + localized description. */
type CommandRow = { cmd: string; note: L };
/** An external link with a localized label and a locale-neutral URL + display label. */
type Link = { label: L; url: string; urlLabel: string };

export type Tutorial = {
  // ── Page frame ───────────────────────────────────────────────────────────
  eyebrow: L;
  hero: L;
  lede: L;
  tocLabel: L;
  minutes: L; // e.g. "~10 minute read"

  // ── 1. What LingTai is / is not ──────────────────────────────────────────
  whatIs: {
    id: string;
    heading: L;
    body: L;
    isLabel: L;
    is: L[];
    isNotLabel: L;
    isNot: L[];
  };

  // ── 2. Prerequisites + install ───────────────────────────────────────────
  install: {
    id: string;
    heading: L;
    prereqHeading: L;
    prereqs: L[];
    primaryHeading: L;
    primaryNote: L; // the command itself renders via <InstallCommand>
    altHeading: L;
    alts: { name: L; cmd: string; note: L }[];
    updateHeading: L;
    updateBody: L;
  };

  // ── 3. First launch, project, /setup ─────────────────────────────────────
  firstRun: {
    id: string;
    heading: L;
    intro: L;
    steps: { title: L; body: L; cmd?: string }[];
    setupNote: L;
  };

  // ── 4. First task + giving instructions + status ─────────────────────────
  firstTask: {
    id: string;
    heading: L;
    intro: L;
    exampleLabel: L;
    example: L; // the plain-language prompt a beginner would type
    tipsHeading: L;
    tips: L[];
    statusHeading: L;
    statusBody: L;
    statusCmds: CommandRow[];
  };

  // ── 5. main agent vs daemon vs avatar ────────────────────────────────────
  cast: { id: string; heading: L; intro: L; items: Concept[] };

  // ── 6. files vs Knowledge vs Skills ──────────────────────────────────────
  memory: { id: string; heading: L; intro: L; items: Concept[] };

  // ── 7. context / molt ────────────────────────────────────────────────────
  molt: { id: string; heading: L; body: L[]; note: L };

  // ── 8. optional external channels / add-ons ──────────────────────────────
  channels: { id: string; heading: L; intro: L; items: { name: L; body: L }[]; note: L };

  // ── 9. command + shortcut reference ──────────────────────────────────────
  reference: {
    id: string;
    heading: L;
    intro: L;
    commandsLabel: L;
    commands: CommandRow[];
    shortcutsLabel: L;
    shortcuts: { keys: string; note: L }[];
  };

  // ── 10. troubleshooting ──────────────────────────────────────────────────
  troubleshooting: { id: string; heading: L; items: { symptom: L; fix: L }[] };

  // ── 11. next steps + source links ────────────────────────────────────────
  next: { id: string; heading: L; body: L; links: Link[] };
};

export const tutorial: Tutorial = {
  eyebrow: {
    en: 'Beginner Tutorial',
    zh: '新手教程',
    wen: '入门',
  },
  hero: {
    en: 'From zero to your first task',
    zh: '从零到第一个任务',
    wen: '自无入有，成其初功',
  },
  lede: {
    en: 'LingTai gives you a long-lived AI assistant that lives inside a project folder on your own machine. This guide takes you from installing it to handing it a real first task — and explains just enough of how it thinks to keep going on your own.',
    zh: '灵台让你在自己的机器上、在一个项目文件夹里，拥有一个长期的 AI 助手。本指南带你从安装开始，到交给它第一个真正的任务，并把它的运作方式讲到刚好够你自己走下去。',
    wen: '灵台者，令君于己之机、于一隅之中，得一长伴之 AI 助手也。此篇自安装始，至托以初任，复明其运思之要，俾君得以自行。',
  },
  tocLabel: {
    en: 'On this page',
    zh: '本页目录',
    wen: '篇目',
  },
  minutes: {
    en: '~10 minute read',
    zh: '约 10 分钟阅读',
    wen: '约十分钟可读',
  },

  whatIs: {
    id: 'what-is',
    heading: {
      en: 'What LingTai is — and is not',
      zh: '灵台是什么，不是什么',
      wen: '灵台何谓，何所不谓',
    },
    body: {
      en: 'LingTai is a home for a persistent AI agent that you run yourself. It works inside a project directory and keeps everything it knows — memory, identity, knowledge, skills — as plain files in that directory. The guiding idea: the agent is its files, and the files are the agent. Swap the underlying model and the agent remains.',
      zh: '灵台是一个长期 AI 器灵（agent）的居所，由你自己运行。它在一个项目目录里工作，并把它所知的一切——记忆、身份、知识、技能——都以普通文件的形式存放在这个目录中。核心思想是：器灵即其文件，文件即器灵。更换底层模型，器灵犹在。',
      wen: '灵台者，长伴器灵之所居也，君自运之。其工于一目录之内，凡所知者——忆、身、识、艺——皆化为寻常文件，藏于此目录之中。其要曰：器灵即其文件，文件即器灵。易其模型，而器灵犹存。',
    },
    isLabel: { en: 'It is', zh: '它是', wen: '其为' },
    is: [
      {
        en: 'A local, file-based home for an AI assistant you own and grow over time.',
        zh: '一个本地的、以文件为本的 AI 助手居所，由你拥有，并随时间成长。',
        wen: '本地文件之 AI 助手居所，君所自有，历时而长。',
      },
      {
        en: 'A terminal app (a TUI) you drive with plain language and a few slash commands.',
        zh: '一个终端应用（TUI），用日常语言和少量斜杠命令来驱动。',
        wen: '终端之应用（TUI），以常言与数则斜杠之令驱之。',
      },
      {
        en: 'A place where memory, identity, knowledge, and skills are just files in a folder.',
        zh: '一个记忆、身份、知识、技能都只是文件夹中文件的地方。',
        wen: '忆、身、识、艺，皆一夹中文件之处也。',
      },
    ],
    isNotLabel: { en: 'It is not', zh: '它不是', wen: '其非' },
    isNot: [
      {
        en: 'A chatbot website or a hosted service — it runs on your machine, in your project.',
        zh: '一个聊天机器人网站或托管服务——它运行在你的机器上、你的项目里。',
        wen: '非闲谈之网站，非寄托之外服——运于君之机、君之项目。',
      },
      {
        en: 'Tied to one model — it is model-agnostic; the LLM is swappable.',
        zh: '被单一模型绑定——它与模型无关，LLM 可以替换。',
        wen: '不系于一模型——与模型无涉，LLM 可更也。',
      },
      {
        en: 'Only for coding — the agent can take on any task you can describe and supervise.',
        zh: '只用于写代码——凡你能描述并监督的任务，器灵都能承担。',
        wen: '不独为编码——凡君可述而可督之事，器灵皆可任之。',
      },
    ],
  },

  install: {
    id: 'install',
    heading: {
      en: 'Prerequisites and install',
      zh: '前置条件与安装',
      wen: '所需与安装',
    },
    prereqHeading: {
      en: 'Before you start',
      zh: '开始之前',
      wen: '始事之前',
    },
    prereqs: [
      {
        en: 'A Unix-like terminal — macOS or Linux (Windows works through WSL). A dark terminal theme looks best.',
        zh: '一个类 Unix 的终端——macOS 或 Linux（Windows 可通过 WSL）。深色终端主题观感最佳。',
        wen: '类 Unix 之终端——macOS 或 Linux（Windows 可假 WSL）。终端宜用深色，观之最佳。',
      },
      {
        en: 'Python 3.11 or newer. In practice LingTai provisions and manages its own runtime for you, so you rarely touch Python directly.',
        zh: 'Python 3.11 或更高版本。实际上灵台会自行准备并管理它的运行时，你几乎不必直接接触 Python。',
        wen: 'Python 三点一一以上。然灵台自备而自理其运行时，君殆无须亲抚 Python。',
      },
      {
        en: 'At least one LLM provider credential (an API key). You enter it during first-run setup; no LingTai account is required.',
        zh: '至少一个 LLM 服务商的凭据（API key）。首次运行时填入即可；无需注册灵台账号。',
        wen: '至少一 LLM 供者之凭（API key）。首运之际填之即可；无须灵台之籍。',
      },
    ],
    primaryHeading: {
      en: 'Install (recommended)',
      zh: '安装（推荐）',
      wen: '安装（所荐）',
    },
    primaryNote: {
      en: 'This is the primary install path for new users. It fetches a prebuilt release, sets up the managed runtime, and needs no Homebrew.',
      zh: '这是新用户的主要安装方式。它会获取预构建的发布版、准备好受管运行时，且不需要 Homebrew。',
      wen: '此新用者之正途也。取预构之版，备其受管之运行时，且不假 Homebrew。',
    },
    altHeading: {
      en: 'Other ways to install',
      zh: '其他安装方式',
      wen: '他途安装',
    },
    alts: [
      {
        name: { en: 'Homebrew (existing users)', zh: 'Homebrew（老用户）', wen: 'Homebrew（旧用者）' },
        cmd: 'brew install lingtai-ai/lingtai/lingtai-tui',
        note: {
          en: 'Still supported during the migration period. If you already installed with Homebrew, upgrade with: brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui — then restart the TUI.',
          zh: '在迁移期内仍受支持。若你已用 Homebrew 安装，升级用：brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui，然后重启 TUI。',
          wen: '迁徙之期，仍可用之。若君既以 Homebrew 安之，升之以：brew update && brew upgrade lingtai-ai/lingtai/lingtai-tui，而后重启 TUI。',
        },
      },
      {
        name: { en: 'pip (development / diagnostics only)', zh: 'pip（仅用于开发／诊断）', wen: 'pip（唯为开发与诊断）' },
        cmd: 'pip install lingtai',
        note: {
          en: 'Not a normal install or upgrade path. Reach for pip only when you are developing or diagnosing the kernel itself — it does not manage a project runtime.',
          zh: '这不是常规的安装或升级方式。只有在你要开发或诊断内核本身时才用 pip——它不负责项目运行时。',
          wen: '此非常规安装升级之法。唯欲开发或诊内核之时用之——其不理项目之运行时。',
        },
      },
    ],
    updateHeading: {
      en: 'Keeping it up to date',
      zh: '保持更新',
      wen: '常保其新',
    },
    updateBody: {
      en: 'With the recommended install, the TUI manages its own runtime updates. Remember there are two layers — the TUI program and the managed Python runtime; if a version looks stale after an upgrade, restart the TUI and run /doctor to repair the runtime.',
      zh: '使用推荐安装方式时，TUI 会自行管理其运行时更新。请记住这里有两层——TUI 程序与受管的 Python 运行时；若升级后版本看起来仍是旧的，重启 TUI 并运行 /doctor 修复运行时。',
      wen: '循所荐之法，TUI 自理其运行时之更。须记有二层——TUI 之程与受管之 Python 运行时；若升而版犹旧，则重启 TUI，运 /doctor 以葺其运行时。',
    },
  },

  firstRun: {
    id: 'first-run',
    heading: {
      en: 'First launch and your first project',
      zh: '首次启动与你的第一个项目',
      wen: '首启与初立项目',
    },
    intro: {
      en: 'A LingTai project is just a folder. You launch the TUI inside it, and everything the agent creates lives there. On the very first run, a short wizard walks you through setup and starts one resident agent.',
      zh: '一个灵台项目就是一个文件夹。你在其中启动 TUI，器灵创建的一切都存放在那里。首次运行时，一个简短的向导会带你完成设置，并启动一个常驻器灵。',
      wen: '灵台之项目，一夹而已。君于其中启 TUI，器灵所造皆藏于斯。首运之时，有简导引君以竟设置，且启一常驻之器灵。',
    },
    steps: [
      {
        title: {
          en: 'Make a project folder and enter it',
          zh: '新建一个项目文件夹并进入',
          wen: '造一项目之夹而入之',
        },
        body: {
          en: 'The folder you are in becomes the project. Start with an empty one while you learn.',
          zh: '你所在的文件夹就会成为项目。学习阶段先从一个空文件夹开始。',
          wen: '君所在之夹，即为项目。习艺之初，先自空夹始。',
        },
        cmd: 'mkdir my-project && cd my-project',
      },
      {
        title: {
          en: 'Launch the TUI',
          zh: '启动 TUI',
          wen: '启 TUI',
        },
        body: {
          en: 'This opens LingTai in the current directory. The first run auto-creates a .lingtai/ folder and provisions the runtime.',
          zh: '这会在当前目录中打开灵台。首次运行会自动创建 .lingtai/ 文件夹并准备运行时。',
          wen: '此于当下之目录开灵台。首运自造 .lingtai/ 之夹，且备其运行时。',
        },
        cmd: 'lingtai-tui',
      },
      {
        title: {
          en: 'Follow the setup wizard, then pick the Tutorial recipe',
          zh: '跟随设置向导，然后选择 Tutorial 菜谱',
          wen: '随设置之导，择 Tutorial 之谱',
        },
        body: {
          en: 'The wizard asks for your API key, a model, an agent name, and a starting recipe. Choose the built-in "Tutorial" recipe: the agent then teaches you the system, lesson by lesson, right inside the TUI.',
          zh: '向导会依次询问你的 API key、模型、器灵名字和一个起始菜谱。选择内置的「Tutorial」菜谱：器灵会在 TUI 里一课一课地教你使用这套系统。',
          wen: '导者次问君之 API key、模型、器灵之名，及一始谱。择内置之「Tutorial」谱：器灵遂于 TUI 之中，逐课授君以斯系之用。',
        },
      },
    ],
    setupNote: {
      en: 'That first wizard is the /setup flow. You can re-run /setup any time to change your provider, model, or capabilities; add /setup credentials to jump straight to the credential check.',
      zh: '这个首次向导就是 /setup 流程。你可以随时重新运行 /setup 来更改服务商、模型或能力；加上 /setup credentials 可直接进入凭据检查。',
      wen: '此首导即 /setup 之流也。君可随时重运 /setup，以易供者、模型或能力；缀以 /setup credentials，则径入凭据之检。',
    },
  },

  firstTask: {
    id: 'first-task',
    heading: {
      en: 'Your first real task',
      zh: '你的第一个真正任务',
      wen: '君之初任',
    },
    intro: {
      en: 'You talk to the agent by typing plain messages and pressing Enter. A good first task is safe, concrete, and read-only — let the agent look before it touches anything.',
      zh: '你通过输入普通消息并按回车来与器灵交谈。一个好的第一个任务是安全、具体、只读的——让器灵先观察，再动手。',
      wen: '君以常语相语，按回车而达之。善之初任，安而具、唯观而不改——令器灵先察而后动。',
    },
    exampleLabel: {
      en: 'Try typing something like',
      zh: '试着输入类似这样的话',
      wen: '试输如是之语',
    },
    example: {
      en: 'Help me get oriented in this project. First read the README and the docs folder — do not change any files. Then tell me what the project is for, which files matter most, and what you would suggest doing next.',
      zh: '帮我熟悉一下这个项目。先读 README 和 docs 文件夹，不要修改任何文件；然后告诉我这个项目是做什么的、哪些文件最重要、下一步你建议做什么。',
      wen: '助我谙此项目。先阅 README 与 docs 之夹，勿改一文；既而告我：此项目何为、何文最要、下一步君何所荐。',
    },
    tipsHeading: {
      en: 'How to give instructions the agent can act on',
      zh: '如何给出器灵可执行的指令',
      wen: '何以授令，俾器灵可行',
    },
    tips: [
      {
        en: 'State the goal — what "done" looks like, in one sentence.',
        zh: '说明目标——用一句话描述「完成」是什么样子。',
        wen: '明其的——以一言状「成」之貌。',
      },
      {
        en: 'Set the scope — which files or folders it should (and should not) touch.',
        zh: '划定范围——它应该（以及不应该）动哪些文件或文件夹。',
        wen: '定其界——何文何夹当动，何者不当动。',
      },
      {
        en: 'Name the safety limits — e.g. do not send messages, delete files, or expose secrets.',
        zh: '点明安全边界——例如：不要发送消息、删除文件或泄露密钥。',
        wen: '标其禁——如：勿发讯、勿删文、勿泄密钥。',
      },
      {
        en: 'Say how to report back — a summary, a list, a file, whatever you want.',
        zh: '说明如何回报——一段总结、一个清单、一个文件，随你所需。',
        wen: '示其复命之式——一结、一录、一文，皆从君所欲。',
      },
    ],
    statusHeading: {
      en: 'Seeing what the agent is doing',
      zh: '查看器灵在做什么',
      wen: '观器灵所为',
    },
    statusBody: {
      en: 'There is no /status command. Instead, open a dashboard. The most useful is /kanban, which shows each agent\'s status, heartbeat, token usage, and how full its context window is.',
      zh: '这里没有 /status 命令。取而代之的是打开一个面板。最有用的是 /kanban，它显示每个器灵的状态、心跳、token 用量，以及上下文窗口的占用程度。',
      wen: '此无 /status 之令，代之以启一看板。最要者 /kanban，示诸器灵之态、之脉息、之 token 耗，及其上下文之盈几何。',
    },
    statusCmds: [
      {
        cmd: '/kanban',
        note: {
          en: 'The network dashboard: per-agent status, heartbeat, token/stamina, and context usage.',
          zh: '网络看板：各器灵的状态、心跳、token／体力，以及上下文用量。',
          wen: '网络之看板：诸器灵之态、脉息、token 与体力，及上下文之耗。',
        },
      },
      {
        cmd: '/daemons',
        note: {
          en: 'Inspect the short-lived worker runs an agent has spawned — their task, trace, and status.',
          zh: '查看器灵派出的短时工作进程——它们的任务、轨迹与状态。',
          wen: '察器灵所遣之短工——其任、其迹、其态。',
        },
      },
      {
        cmd: 'lingtai-tui list --detailed <project-dir>',
        note: {
          en: 'From a shell: list every agent in a project directory (the main agent is marked).',
          zh: '在命令行中：列出某个项目目录里的每个器灵（主器灵会被标出）。',
          wen: '于命令行：列某项目目录中之诸器灵（主器灵有志）。',
        },
      },
    ],
  },

  cast: {
    id: 'cast',
    heading: {
      en: 'The cast: main agent, daemon, avatar',
      zh: '三种角色：主器灵、分神、分身',
      wen: '三者之别：主器灵、分神、分身',
    },
    intro: {
      en: 'LingTai is not one agent but a small organization. Three roles are worth knowing early; a rule of thumb follows each.',
      zh: '灵台不是单个器灵，而是一个小型组织。有三种角色值得早点了解；每种后面附一条经验法则。',
      wen: '灵台非独一器灵，乃一小组织也。三者宜早知；各系一经验之则。',
    },
    items: [
      {
        name: { en: 'Main agent', zh: '主器灵', wen: '主器灵' },
        gist: {
          en: 'The one resident agent you talk to.',
          zh: '你交谈的那个常驻器灵。',
          wen: '君所与语之常驻器灵。',
        },
        detail: {
          en: 'Created at first launch, it is the persistent hub: it holds the plan and memory, and it spawns the others. Use it for anything small — most of the time this is all you need.',
          zh: '在首次启动时创建，它是持久的中枢：掌管计划与记忆，并派生出其他角色。小事都交给它——多数时候你只需要它。',
          wen: '首启而生，为恒久之枢：掌谋与忆，且衍生余者。凡小事付之——多时唯此足矣。',
        },
      },
      {
        name: { en: 'Daemon', zh: '分神', wen: '分神' },
        gist: {
          en: 'A short-lived parallel worker.',
          zh: '一个短时的并行工作者。',
          wen: '短时并行之工也。',
        },
        detail: {
          en: 'Emanated for a noisy, bounded job — bulk lookups, cross-checking, a wide scan — then discarded. You keep its conclusions, not the worker. Use one for a one-off burst of parallel work.',
          zh: '为一件嘈杂而有界的工作而分出——批量查找、交叉核对、大范围扫描——之后即弃。你留下它的结论，而非工作者本身。用它来处理一次性的并行爆发。',
          wen: '为一嘈而有界之事而分——群查、互核、广扫——事竟即弃。君留其论，不留其身。凡一时并发之工，用之。',
        },
      },
      {
        name: { en: 'Avatar', zh: '分身', wen: '分身' },
        gist: {
          en: 'A persistent, specialized teammate.',
          zh: '一个持久的、专门化的队友。',
          wen: '恒久而专司之侪也。',
        },
        detail: {
          en: 'A long-lived agent with its own memory, mailbox, and responsibility — like a fixed teammate who owns one domain. Create one when a specialty deserves to persist across many sessions.',
          zh: '一个长期存在的器灵，拥有自己的记忆、邮箱与职责——像一个固定的、负责某个领域的队友。当某项专长值得跨多次会话持续存在时，就创建一个。',
          wen: '长存之器灵，自有其忆、其邮、其责——若一定侪，专司一域。若一专长宜跨多会而存，则立一焉。',
        },
      },
    ],
  },

  memory: {
    id: 'memory',
    heading: {
      en: 'How an agent remembers: files, Knowledge, Skills',
      zh: '器灵如何记忆：文件、知识、技能',
      wen: '器灵何以记：文件、知识、技艺',
    },
    intro: {
      en: 'Everything the agent knows lives on disk under .lingtai/, which you can inspect with ordinary tools like ls and cat. Three tiers are worth telling apart.',
      zh: '器灵所知的一切都存放在磁盘上的 .lingtai/ 目录里，你可以用 ls、cat 这类普通工具查看。有三个层次值得区分。',
      wen: '器灵所知，尽藏于盘上 .lingtai/ 之中，君可假 ls、cat 之常器观之。三层宜辨。',
    },
    items: [
      {
        name: { en: 'Files', zh: '文件', wen: '文件' },
        gist: {
          en: 'Ordinary working files.',
          zh: '普通的工作文件。',
          wen: '寻常之工作文件。',
        },
        detail: {
          en: 'The reports, edits, and artifacts the agent reads and writes anywhere in your project. Nothing special — just the work itself.',
          zh: '器灵在你项目各处读写的报告、修改与产物。没什么特别的——就是工作本身。',
          wen: '器灵于项目各处所读写之报、之改、之成物。无甚异——即工作本身耳。',
        },
      },
      {
        name: { en: 'Knowledge', zh: '知识', wen: '知识' },
        gist: {
          en: 'Durable, private, per-agent memory.',
          zh: '持久的、私有的、每个器灵各自的记忆。',
          wen: '恒久而私有、各器灵自持之忆。',
        },
        detail: {
          en: 'Lasting facts, paths, decisions, and lessons an agent keeps for itself, in its knowledge/ folder. Only a short index sits in the prompt; full entries are read on demand. Browse it with /knowledge.',
          zh: '器灵为自己保留的长期事实、路径、决策与经验，存于它的 knowledge/ 文件夹。提示词里只放一个简短索引，完整条目按需读取。用 /knowledge 浏览。',
          wen: '器灵为己所存之久事、之径、之断、之鉴，置于其 knowledge/ 之夹。提示之中唯列简目，全条则按需而取。以 /knowledge 阅之。',
        },
      },
      {
        name: { en: 'Skills', zh: '技能', wen: '技艺' },
        gist: {
          en: 'Reusable playbooks, shared by all agents.',
          zh: '可复用的做事方法，所有器灵共享。',
          wen: '可复用之做事之法，诸器灵共之。',
        },
        detail: {
          en: 'Markdown playbooks (each a SKILL.md) that describe how to do a recurring task, loaded on demand. Unlike Knowledge, Skills are shared across every agent in the same .lingtai/. Browse them with /skills.',
          zh: 'Markdown 写成的做事手册（每个是一个 SKILL.md），描述如何完成某类反复出现的任务，按需加载。与「知识」不同，技能在同一个 .lingtai/ 下的所有器灵之间共享。用 /skills 浏览。',
          wen: 'Markdown 所撰之做事之册（各一 SKILL.md），述何以竟一类屡见之事，按需而载。异于「知识」，技艺乃同一 .lingtai/ 下诸器灵所共。以 /skills 阅之。',
        },
      },
    ],
  },

  molt: {
    id: 'molt',
    heading: {
      en: 'Context and molt',
      zh: '上下文与凝蜕',
      wen: '上下文与凝蜕',
    },
    body: [
      {
        en: 'An agent can only hold so much conversation in view at once — its context window. Think of it as a desk that slowly fills with paper. When it gets full, the agent molts: it writes itself a careful summary, then clears the window and carries that summary — plus all its durable memory — forward onto a clean desk.',
        zh: '一个器灵一次只能看到有限的对话内容——这就是它的上下文窗口。把它想象成一张慢慢堆满纸张的书桌。当桌子满了，器灵会「凝蜕」：它给自己写一份仔细的总结，然后清空窗口，把这份总结——连同它所有的持久记忆——带到一张干净的书桌上继续。',
        wen: '器灵一时所能见之对话有限——是谓上下文之窗。譬之一案，纸渐盈焉。案既满，器灵乃「凝蜕」：自撰一慎密之结，遂空其窗，携此结——并其一切久忆——迁于净案而续之。',
      },
      {
        en: 'This is normal housekeeping, not a failure. Under context pressure the agent will molt on its own, after a short series of warnings. You usually do not need to do anything.',
        zh: '这是正常的整理，不是故障。在上下文压力下，器灵会在一连串简短的提醒之后自行凝蜕。你通常什么都不用做。',
        wen: '此常理之事，非败也。上下文既迫，器灵历数则短警之后，自行凝蜕。君常无所须为。',
      },
    ],
    note: {
      en: 'If a task matters, you can prepare for a molt: ask the agent to "wrap up and summarize" first — saving the goal, what is done and not done, key file paths, conclusions, and next steps into its memory — and then run /molt to force it. (Do not confuse this with /clear, which wipes the conversation without saving, or /nirvana, which irreversibly erases the whole agent.)',
      zh: '如果某个任务很重要，你可以为凝蜕做准备：先让器灵「收功总结」——把目标、已完成与未完成的部分、关键文件路径、结论和下一步存进它的记忆——然后运行 /molt 强制凝蜕。（不要把它与 /clear 混淆，后者清空对话而不保存；也不要与 /nirvana 混淆，后者不可逆地抹除整个器灵。）',
      wen: '若一任攸关，君可预为凝蜕之备：先令器灵「收功总结」——存其的、其已成未成、其要文之径、其论、其下一步于忆——而后运 /molt 以强之。（勿与 /clear 相混，彼空对话而不存；亦勿与 /nirvana 相混，彼不可复而尽抹其器灵。）',
    },
  },

  channels: {
    id: 'channels',
    heading: {
      en: 'Optional: external channels and add-ons',
      zh: '可选：外部渠道与插件',
      wen: '可选：外部之径与附件',
    },
    intro: {
      en: 'By default you talk to your assistant in the terminal. If you want, you can also reach the same assistant — same memory, same history — through outside channels. These are optional add-ons, configured with /mcp.',
      zh: '默认情况下你在终端里与助手交谈。如果愿意，你也可以通过外部渠道触达同一个助手——同样的记忆、同样的历史。这些是可选插件，用 /mcp 配置。',
      wen: '常则君于终端与助手语。若愿，亦可假外径以达同一助手——同其忆、同其史。此皆可选之附件，以 /mcp 设之。',
    },
    items: [
      {
        name: { en: 'Telegram', zh: 'Telegram', wen: 'Telegram' },
        body: {
          en: 'Talk to your assistant from Telegram, with an optional allowlist.',
          zh: '从 Telegram 与你的助手交谈，可选设置白名单。',
          wen: '自 Telegram 与助手语，可择设白名。',
        },
      },
      {
        name: { en: 'Feishu / Lark', zh: '飞书', wen: '飞书' },
        body: {
          en: 'Connect over a long-lived WebSocket — no public IP or webhook needed.',
          zh: '通过长连接的 WebSocket 接入——无需公网 IP 或 webhook。',
          wen: '假长连之 WebSocket 而通——无须公网之 IP 或 webhook。',
        },
      },
      {
        name: { en: 'WeChat / WhatsApp', zh: '微信／WhatsApp', wen: '微信／WhatsApp' },
        body: {
          en: 'Reach the assistant through a curated bridge for each messenger.',
          zh: '通过为每种通讯软件准备的桥接触达助手。',
          wen: '假各讯软所备之桥以达助手。',
        },
      },
      {
        name: { en: 'Email (IMAP)', zh: '电子邮件（IMAP）', wen: '邮（IMAP）' },
        body: {
          en: 'Give the assistant a real inbox over IMAP/SMTP, with safe defaults for unknown senders.',
          zh: '通过 IMAP/SMTP 给助手一个真正的收件箱，对陌生发件人有安全默认设置。',
          wen: '假 IMAP/SMTP 予助手一真收件之箱，于生人有安全之默设。',
        },
      },
    ],
    note: {
      en: 'After changing any channel or MCP configuration, run /refresh so the agent picks it up.',
      zh: '更改任何渠道或 MCP 配置后，运行 /refresh 让器灵生效。',
      wen: '凡易一径或 MCP 之配，运 /refresh，俾器灵纳之。',
    },
  },

  reference: {
    id: 'reference',
    heading: {
      en: 'Command and shortcut reference',
      zh: '命令与快捷键速查',
      wen: '令与捷键速查',
    },
    intro: {
      en: 'Type / in the TUI to open the command palette; it fuzzy-matches, so /skl finds skills. A compact set to get started:',
      zh: '在 TUI 中输入 / 打开命令面板；它支持模糊匹配，所以 /skl 就能找到 skills。下面是一份入门用的精简集合：',
      wen: '于 TUI 中输 / 以开令之面板；其能模糊而合，故 /skl 即得 skills。下列一精简之集，以为入门：',
    },
    commandsLabel: { en: 'Common commands', zh: '常用命令', wen: '常用之令' },
    commands: [
      {
        cmd: '/setup',
        note: {
          en: 'Set up or change your provider, model, capabilities, and credentials.',
          zh: '设置或更改服务商、模型、能力与凭据。',
          wen: '设或易供者、模型、能力与凭据。',
        },
      },
      {
        cmd: '/kanban',
        note: {
          en: 'The network dashboard, including context-window usage.',
          zh: '网络看板，含上下文窗口用量。',
          wen: '网络之看板，含上下文窗之耗。',
        },
      },
      {
        cmd: '/skills',
        note: {
          en: 'Browse the shared skill playbooks.',
          zh: '浏览共享的技能手册。',
          wen: '阅所共之技艺之册。',
        },
      },
      {
        cmd: '/knowledge',
        note: {
          en: "Browse this agent's private knowledge (aliases: /library, /codex).",
          zh: '浏览该器灵的私有知识（别名：/library、/codex）。',
          wen: '阅此器灵私有之知识（别名：/library、/codex）。',
        },
      },
      {
        cmd: '/mcp',
        note: {
          en: 'Manage external channels and other MCP add-ons.',
          zh: '管理外部渠道与其他 MCP 插件。',
          wen: '理外部之径及余 MCP 之附件。',
        },
      },
      {
        cmd: '/molt',
        note: {
          en: 'Save context, then reset the conversation window.',
          zh: '保存上下文，然后重置对话窗口。',
          wen: '存上下文，遂重置对话之窗。',
        },
      },
      {
        cmd: '/doctor',
        note: {
          en: 'Diagnose connectivity, keys, models, and repair the runtime.',
          zh: '诊断连接、密钥、模型，并修复运行时。',
          wen: '诊连、钥、模型，且葺其运行时。',
        },
      },
      {
        cmd: '/help',
        note: {
          en: 'Open the in-TUI help reader for the full list.',
          zh: '打开 TUI 内的帮助阅读器查看完整列表。',
          wen: '启 TUI 内之助读器，览其全列。',
        },
      },
    ],
    shortcutsLabel: { en: 'Keyboard shortcuts', zh: '键盘快捷键', wen: '键盘之捷' },
    shortcuts: [
      {
        keys: 'Enter',
        note: { en: 'Send the current message.', zh: '发送当前消息。', wen: '发当下之讯。' },
      },
      {
        keys: 'Shift+Enter  /  Ctrl+J',
        note: { en: 'Insert a newline instead of sending.', zh: '插入换行而不发送。', wen: '插一换行而不发。' },
      },
      {
        keys: '/',
        note: { en: 'Open the command palette (type to fuzzy-filter).', zh: '打开命令面板（输入以模糊筛选）。', wen: '开令之面板（输而模糊以筛）。' },
      },
      {
        keys: 'Ctrl+E',
        note: { en: 'Open an external editor for a long message.', zh: '为长消息打开外部编辑器。', wen: '为长讯开外部之编辑器。' },
      },
      {
        keys: 'Ctrl+T',
        note: { en: 'Switch between agents inside the /skills, /knowledge, and /system views.', zh: '在 /skills、/knowledge、/system 视图中切换器灵。', wen: '于 /skills、/knowledge、/system 之视中易器灵。' },
      },
    ],
  },

  troubleshooting: {
    id: 'troubleshooting',
    heading: {
      en: 'Troubleshooting',
      zh: '疑难排解',
      wen: '排疑',
    },
    items: [
      {
        symptom: {
          en: 'lingtai-tui: command not found',
          zh: 'lingtai-tui：找不到命令',
          wen: 'lingtai-tui：命令不获',
        },
        fix: {
          en: 'The install directory is not on your PATH. Open a new terminal, or add the install location (shown at the end of the installer output) to your PATH, then try again.',
          zh: '安装目录不在你的 PATH 中。打开一个新终端，或把安装位置（安装脚本输出末尾会显示）加入 PATH，然后重试。',
          wen: '安装之目录不在君之 PATH。启一新终端，或将安装之处（安装之末所示）纳于 PATH，而后再试。',
        },
      },
      {
        symptom: {
          en: 'The TUI opens but the assistant does not respond',
          zh: 'TUI 打开了，但助手没有回应',
          wen: 'TUI 已启，而助手无应',
        },
        fix: {
          en: 'It may be running a long tool or molting — give it a moment. Then check /kanban, run /doctor, and look at the tail of .lingtai/<agent>/logs/agent.log.',
          zh: '它可能正在运行一个耗时的工具，或正在凝蜕——稍等片刻。然后查看 /kanban、运行 /doctor，并查看 .lingtai/<agent>/logs/agent.log 的末尾。',
          wen: '其或正运一久器，或方凝蜕——少待之。既而观 /kanban、运 /doctor，且视 .lingtai/<agent>/logs/agent.log 之末。',
        },
      },
      {
        symptom: {
          en: 'I upgraded but nothing changed',
          zh: '我升级了，但什么都没变',
          wen: '既升而无所改',
        },
        fix: {
          en: 'Remember the two layers — the TUI program and its managed Python runtime. Restart the TUI; if a version still looks stale, run /doctor to repair the runtime.',
          zh: '记住那两层——TUI 程序与它受管的 Python 运行时。重启 TUI；若版本看起来仍旧，运行 /doctor 修复运行时。',
          wen: '记其二层——TUI 之程与其受管之 Python 运行时。重启 TUI；若版犹旧，运 /doctor 以葺其运行时。',
        },
      },
      {
        symptom: {
          en: 'A skill or command seems to be missing',
          zh: '某个技能或命令好像不见了',
          wen: '一技或一令若失',
        },
        fix: {
          en: 'Run /doctor to re-extract the bundled skills and utilities, and check that the right preset is active.',
          zh: '运行 /doctor 重新解包内置的技能与工具，并确认当前启用了正确的预设。',
          wen: '运 /doctor 以重解内置之技与器，且验所启之预设无误。',
        },
      },
    ],
  },

  next: {
    id: 'next',
    heading: {
      en: 'Next steps',
      zh: '下一步',
      wen: '下一步',
    },
    body: {
      en: 'The fastest way to go deeper is inside the product itself: launch lingtai-tui, pick the Tutorial recipe, and let the agent teach you concept by concept. When you want more, these are the canonical sources.',
      zh: '要更深入，最快的方式就在产品本身：启动 lingtai-tui，选择 Tutorial 菜谱，让器灵一个概念一个概念地教你。想了解更多时，下面是权威来源。',
      wen: '欲更深者，其捷莫如产品本身：启 lingtai-tui，择 Tutorial 之谱，令器灵逐念授君。若欲知其详，下列乃其正源。',
    },
    links: [
      {
        label: { en: 'LingTai website', zh: '灵台官网', wen: '灵台官网' },
        url: 'https://lingtai.ai',
        urlLabel: 'lingtai.ai',
      },
      {
        label: { en: 'Source on GitHub', zh: 'GitHub 源代码', wen: 'GitHub 源码' },
        url: 'https://github.com/Lingtai-AI/lingtai',
        urlLabel: 'github.com/Lingtai-AI/lingtai',
      },
      {
        label: { en: 'Ask a question (Discussions)', zh: '提问（Discussions）', wen: '发问（Discussions）' },
        url: 'https://github.com/Lingtai-AI/lingtai/discussions',
        urlLabel: 'github.com/Lingtai-AI/lingtai/discussions',
      },
      {
        label: { en: 'Report an issue', zh: '报告问题', wen: '报问' },
        url: 'https://github.com/Lingtai-AI/lingtai/issues',
        urlLabel: 'github.com/Lingtai-AI/lingtai/issues',
      },
    ],
  },
};
