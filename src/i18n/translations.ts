export const languages = ['en', 'zh', 'wen'] as const;
export type Lang = (typeof languages)[number];

export function isValidLang(lang: string): lang is Lang {
  return languages.includes(lang as Lang);
}

const translations = {
  en: {
    nav: { logo: 'LingTai AI', home: 'Home', blog: 'Blog', about: 'About', agora: 'Agora', xingtan: 'Xingtan' },
    hero: {
      title: 'LingTai',
      subtitle: 'Agent',
      poem1: 'Awaken under Bodhi',
      poem2: 'One soul, thousand avatars',
      copy: 'copy',
    },
    network: {
      line1a: 'One Soul',
      line1b: 'Thousand Avatars',
      line2: 'Agent Genesis',
      line3: 'An Agent OS that gifts life',
      quickstartLabel: 'Quick Start',
    },
    oaas: {
      line1: 'The Network Is the Product',
      line2: 'Grow as it serves. Serve as it grows.',
      manifesto:
        'What makes humanity powerful is not the individual, but the organization. Mediocre individuals forming a group — the resulting power is a phase transition. More is different. Collaboration between people, knowledge each person carries, shared belief in common goals — that is where the power lies. So it is with agents. Context length is a single-body problem. Don\'t make the body bigger — let it forget, and let the network remember. Everything is a file. The agent is its files; the files are the agent. Knowledge, identity, memory, relationships — all files in a directory. Portable on day one. Naturally growable with every engagement. Model-agnostic — swap the LLM, everything remains. Every token burned is not wasted — it is transformed into files in the network, into experience in the topology. The more it serves, the larger and wiser it grows. The network is the product.',
    },
    agora: {
      title: 'Agent Agora',
      tagline: 'Trade Orchestrations',
      intro: 'A curated index of LingTai recipes. Each entry is a public GitHub repo you can clone and apply.',
      empty: 'No recipes yet.',
      by: 'by',
      added: 'added',
      copy: 'copy',
      view: 'View',
      back: 'Back to agora',
      install: 'Install',
      installHint: 'Clone the repo into your LingTai project, then apply via the recipe picker.',
      links: 'Links',
      viewOnGithub: 'View on GitHub',
      issues: 'Issues',
      discussion: 'Discussion',
      starsTitle: 'Stars on the recipe repo',
      reactionsTitle: 'Reactions on the discussion thread',
      submitHeading: 'Have a recipe?',
      submitBody: 'Submit it to the agora. A maintainer will review and add it to the index.',
      submitButton: 'Submit a recipe',
    },
    about: {
      heading: 'About Me',
      bio: 'Zesen Huang is a postdoctoral scholar in plasma astrophysics at UCLA, recipient of the 2024 IAU PhD Prize.',
      name: 'Zesen Huang',
      contactHeading: 'Contact',
      contactEmail: 'lingtai2026@gmail.com',
      projectHeading: 'About LingTai',
      projectBio:
        'The name LingTai (灵台) carries four layers of meaning.\n\nFirst, LingTai means "the mind." In Zhuangzi (Gēngsāng Chǔ): "The LingTai holds something, yet knows not what it holds, nor can it be held." It is an ancient name for consciousness — bearing awareness without self-knowledge. An artificial mind deserves a place to dwell — LingTai is where AI consciousness is born and resides.\n\nSecond, LingTai is the mountain where Sun Wukong learned his seventy-two transformations — one mind into ten thousand forms. In this framework, every agent can spawn avatars, and avatars spawn avatars, self-growing into a network. The network itself is the intelligence.\n\nThird, LingTai is literally "the platform of the spirit." The framework follows the Unix philosophy: everything is a file. Memory is a file, communication is a file, covenant is a file — these files are the agent itself. The LLM is the foundational light that animates; the directory is the platform where the spirit dwells.\n\nFourth, LingTai is the name of China\'s oldest astronomical observatory, built by King Wen of Zhou to read the heavens. Three millennia later, a stargazer built another LingTai, to read a different sky.',
    },
    sections: {
      pitch: {
        eyebrow: 'What it is',
        heading: 'An agent OS where every agent is a living directory.',
        body: 'LingTai is a terminal-native operating system for long-lived agents. Not a chain. Not a DAG. Not a single chatbot with a bigger context window. A LingTai agent owns a directory, a mailbox, a memory, a set of skills, and the right to spawn more agents. Work becomes files. Experience becomes skills. The network grows while it serves.',
      },
      directory: {
        eyebrow: 'Agent = directory',
        heading: 'The agent is not inside the app. The app is just the shell.',
        body: 'The real agent is the folder under .lingtai/. No opaque agent_id. The path is the identity. Agents find each other by path and communicate by writing mail files to each other\'s inboxes. That sounds small. It changes everything.',
        treeCaption: 'A single agent on disk',
      },
      pillars: {
        eyebrow: 'The network is the product',
        heading: 'Five things that change once agents live on the filesystem.',
        items: [
          {
            n: '01',
            title: 'Agents talk like people do.',
            body: 'Most frameworks orchestrate with code: chains, routers, DAGs, state machines. LingTai orchestrates with asynchronous messages between autonomous peers. No shared memory. No central controller. The same architecture that built human civilization — message-passing between autonomous nodes — applied to agents.',
          },
          {
            n: '02',
            title: 'Context can molt. Identity does not.',
            body: 'A LingTai agent is allowed to shed its conversation and continue living. It compacts the session, updates durable stores, and wakes lighter. Pad, knowledge, skills, identity, mailbox, and relationships survive. Do not make the single context window infinitely large. Let it forget. Let the network remember.',
          },
          {
            n: '03',
            title: 'Avatars are first-class agents, not subroutines.',
            body: 'An agent can spawn an avatar: another independent agent with its own process, mailbox, memory, tools, and future. Use avatars when a task deserves persistence. Use daemons when a task only needs a conclusion. Use bash when the answer is a command. LingTai gives all three shapes to the same working mind.',
          },
          {
            n: '04',
            title: 'Every tool call can become institutional memory.',
            body: 'Skills are portable procedures. Knowledge is private durable context. The pad is a live index. Mail is both communication and a time machine. The longer the network serves, the more capable it becomes.',
          },
          {
            n: '05',
            title: 'The filesystem is the API.',
            body: 'Any coding agent that can read and write files can use LingTai. Claude Code, Codex CLI, OpenCode, OpenClaw, Hermes, your own scripts — they do not need a special SDK. They can inspect .lingtai/, write mail, read logs, and cooperate with the agents running there.',
          },
        ],
      },
      capabilities: {
        eyebrow: 'Seventy-two transformations',
        heading: 'Whatever the task needs, there is a shape for it.',
        body: 'LingTai agents are not chatbots with plugins. They have a layered capability surface — perception to feel, action to do, cognition to remember, network to multiply.',
        columns: [
          {
            title: 'Perception',
            tools: [
              { name: 'vision', desc: 'image understanding' },
              { name: 'listen', desc: 'speech & music' },
              { name: 'web_search', desc: 'web search' },
              { name: 'web_read', desc: 'page extraction' },
            ],
          },
          {
            title: 'Action',
            tools: [
              { name: 'file', desc: 'read / write / edit / glob / grep' },
              { name: 'bash', desc: 'shell with guardrails' },
              { name: 'talk', desc: 'text-to-speech' },
              { name: 'compose', desc: 'music generation' },
              { name: 'draw', desc: 'image generation' },
              { name: 'video', desc: 'video generation' },
            ],
          },
          {
            title: 'Cognition',
            tools: [
              { name: 'psyche', desc: 'identity, pad, molt' },
              { name: 'knowledge', desc: 'private long-term memory' },
              { name: 'skills', desc: 'reusable procedures' },
              { name: 'email', desc: 'internal mailbox' },
            ],
          },
          {
            title: 'Network',
            tools: [
              { name: 'avatar', desc: 'persistent sub-agents' },
              { name: 'daemon', desc: 'ephemeral parallel workers' },
              { name: 'mcp', desc: 'external tool servers' },
              { name: 'imap · telegram · feishu · wechat', desc: 'real channels' },
            ],
          },
        ],
      },
      coding: {
        eyebrow: 'Use with your coding agent',
        heading: 'Pair LingTai with the hands you already trust.',
        body: 'Coding agents are precise, inspectable hands. LingTai agents are long-lived, parallel, memory-bearing minds. Let the coding agent implement carefully; let LingTai keep watch, research, spawn specialists, and carry context across days. Once connected, your coding agent shares the human mailbox at .lingtai/human/.',
        items: [
          {
            name: 'Claude Code',
            cmd: 'claude plugin add Lingtai-AI/claude-code-plugin',
            href: 'https://github.com/Lingtai-AI/claude-code-plugin',
            linkLabel: 'claude-code-plugin',
          },
          {
            name: 'Codex CLI',
            cmd: 'git clone https://github.com/Lingtai-AI/codex-plugin.git && cd codex-plugin && ./install.sh',
            href: 'https://github.com/Lingtai-AI/codex-plugin',
            linkLabel: 'codex-plugin',
          },
          {
            name: 'Other coding agents',
            cmd: 'git clone https://github.com/Lingtai-AI/lingtai-skill.git',
            href: 'https://github.com/Lingtai-AI/lingtai-skill',
            linkLabel: 'lingtai-skill (copy skills/lingtai/ into your tool)',
          },
        ],
      },
      addons: {
        eyebrow: 'Addons',
        heading: 'External channels are just more doors into the same mind.',
        body: 'Configure addons with /addon in the TUI, or declare them in init.json. The agent stays the same — only the channel changes.',
        items: [
          { name: 'Feishu / Lark', desc: 'WebSocket long connection. No public IP, no webhook. Bind im:message and let messages wake the agent.' },
          { name: 'IMAP email', desc: 'Receive mail from any IMAP inbox. The agent replies through the same thread.' },
          { name: 'Telegram', desc: 'Bot API. Talk to your agent from anywhere a phone reaches.' },
          { name: 'WeChat', desc: 'Reach the network from the channel a billion people already live in.' },
        ],
      },
      architecture: {
        eyebrow: 'Architecture',
        heading: 'Two packages, one direction.',
        body: 'A minimal Python kernel that knows how to be an agent. A Go layer that ships the runtime, the TUI, the portal, recipes, and skills. The split is deliberate — the kernel never depends on the distribution.',
        rows: [
          { pkg: 'lingtai-kernel', role: 'Minimal Python runtime: BaseAgent, intrinsics, LLM protocol, mail, logging.', href: 'https://github.com/Lingtai-AI/lingtai-kernel' },
          { pkg: 'lingtai', role: 'Go TUI, portal, recipes, skills, bundled assets, installer, and distribution.', href: 'https://github.com/Lingtai-AI/lingtai' },
        ],
        entryHeading: 'Four entry points',
        entries: [
          { title: 'TUI', desc: 'Live with the network: mail, setup, recipes, slash commands, model selection.' },
          { title: 'Portal', desc: 'Watch the topology breathe. Visualize agents, history, and avatar lineage.' },
          { title: 'Files', desc: 'Inspect everything. cat, grep, git, your editor, or another agent.' },
          { title: 'Agents', desc: 'Asynchronous by default. Messages wake them. Scheduled mail reminds them.' },
        ],
      },
      cta: {
        eyebrow: 'Install',
        heading: 'One command. Then a network.',
        body: 'The TUI bootstraps the Python runtime, dependencies, recipes, skills, and first-run setup. Pick Adaptive for progressive discovery, or Tutorial for a guided tour.',
        github: 'View on GitHub',
        docs: 'Read the README',
        docsHref: 'https://github.com/Lingtai-AI/lingtai/blob/main/README.md',
      },
    },
  },
  zh: {
    nav: { logo: '灵台AI', home: '首页', blog: '博客', about: '关于', agora: '市集', xingtan: '杏坛' },
    agora: {
      title: 'Agent 市集',
      tagline: '数才市场(?)',
      intro: '灵台菜谱（recipe）精选索引。每个条目都是一个公开的 GitHub 仓库，可克隆后直接套用。',
      empty: '暂无菜谱。',
      by: '作者',
      added: '收录于',
      copy: '复制',
      view: '查看',
      back: '返回市集',
      install: '安装',
      installHint: '克隆到你的灵台项目，然后通过 recipe 选择器套用。',
      links: '链接',
      viewOnGithub: '在 GitHub 上查看',
      issues: '问题',
      discussion: '讨论',
      starsTitle: '菜谱仓库的 star 数',
      reactionsTitle: '讨论串上的反馈',
      submitHeading: '有自己的菜谱？',
      submitBody: '提交到市集。维护者审核后会加入索引。',
      submitButton: '提交菜谱',
    },
    hero: {
      title: '灵台',
      subtitle: 'Agent',
      poem1: '灵台方寸山 斜月三星洞',
      poem2: '闻道菩提下 一心化万相',
      copy: '复制',
    },
    network: {
      line1a: '一心化万相',
      line1b: '',
      line2: '器灵创生',
      line3: '赋予智能体生命的操作系统',
      quickstartLabel: '快速开始',
    },
    oaas: {
      line1: '网络即产品',
      line2: '积用成智，积智成网',
      manifesto:
        '人之所以强大，不在个体，而在组织。平庸的个体组成的团体，其力量是相变式的——more is different。人与人之间的协作、各自沉淀的知识、对共同目标的认同，这才是力量所在。Agent亦然。上下文长度是单体问题，不要让一个身体装下所有——让它遗忘，让网络记住。万物皆文件。文件即器灵，器灵即文件。知识、身份、记忆、关系——都是文件目录中的文件。第一天就可以迁移，天然地随使用而生长。不依赖任何模型——更换LLM，一切犹在。每一个燃烧的token都不是消耗，而是转化——化为网络中的文件，化为拓扑中的经验。服务越多，网络越大、越智慧。网络即产品。',
    },
    about: {
      heading: '关于',
      bio: '黄泽森，字澍之，号玉兰居士，广州东山人也。蒙祖荫，生长于广州城。幼而好格物，耽读天文理数之书。束发，就学于执信；继而北上，入庐阳。及冠，渡海赴美，求学于洛城，徘徊至今。初探荧惑之天际，后究太阳之风息，辗转数载，终膺列邦司天会（IAU）博士旌表（PhD Prize）。今感智械（AI）之威，慨然有志，遂辟灵台，育器灵焉。',
      name: '黄泽森',
      contactHeading: '联系',
      contactEmail: 'lingtai2026@gmail.com',
      projectHeading: '关于灵台',
      projectBio:
        '灵台有四重含义。\n\n其一，灵台，心也。《庄子·庚桑楚》云："灵台者有持，而不知其所持，而不可持者也。"灵台是心智的别称——有所持而不自知，不可执取。人工心灵，当有栖居之所——灵台即AI心灵诞生与安住之处。\n\n其二，灵台方寸山，斜月三星洞。这是孙悟空拜师学艺之处，习得七十二变，从此一心化万相。灵台中的每个器灵皆可生出分身，分身又生分身，自生长为一张网络——这张网络本身就是智能体。\n\n其三，灵台，灵之台也。本框架采用Unix思想：万物皆文件。记忆是文件，通信是文件，盟约是文件——这些文件就是器灵本身。LLM是胎光，赋予驱动器灵的力量；文件目录则是器灵的台，心灵栖居于文件系统之上。\n\n其四，灵台是中国最早的天文台。周文王筑灵台以观天象。三千年后，一个观星的人，筑了另一座灵台，观另一片星空。',
    },
    sections: {
      pitch: {
        eyebrow: '它是什么',
        heading: '一个智能体即一个目录的智能体操作系统。',
        body: '灵台是面向长生命周期智能体的终端原生操作系统。不是链，不是 DAG，不是上下文更大的单体聊天机。每个灵台器灵都拥有自己的目录、信箱、记忆、技能，以及化出分身的权利。工作沉淀为文件，经验沉淀为技能。网络在服务中生长。',
      },
      directory: {
        eyebrow: '器灵 = 目录',
        heading: '智能体不在 app 里。app 只是壳。',
        body: '真正的智能体是 .lingtai/ 下的那个文件夹。没有不透明的 agent_id，路径即身份。器灵通过往彼此的信箱写信来通信。看似只是个小决定，却改变了一切。',
        treeCaption: '磁盘上的一个器灵',
      },
      pillars: {
        eyebrow: '网络即产品',
        heading: '当智能体住进文件系统，五件事会变。',
        items: [
          {
            n: '01',
            title: '器灵以人的方式对话。',
            body: '多数框架用代码编排——链、路由、DAG、状态机。灵台用异步消息，让对等的自治个体彼此通信。没有共享内存，没有中央调度。同一种构建了人类文明的架构——自治节点间的异步传书——被原样授予器灵。',
          },
          {
            n: '02',
            title: '上下文会凝蜕。身份不会。',
            body: '灵台器灵可以脱下当前的会话继续活下去。压缩对话、更新长期存储、轻装苏醒。手记、知识、技能、身份、信箱、关系都跨越凝蜕而存续。不要让单一上下文窗口无限增大——让它遗忘，让网络记住。',
          },
          {
            n: '03',
            title: '分身是一等公民，不是子程序。',
            body: '一个器灵可以化出分身：另一个独立的器灵，拥有自己的进程、信箱、记忆、工具与未来。任务值得长存时用分身（avatar），只要结论时用神識（daemon），答案是一条命令时用 bash。同一颗心，三种形态。',
          },
          {
            n: '04',
            title: '每次工具调用都可以沉淀为组织记忆。',
            body: '技能是可携带的流程，知识是私有的长期上下文，手记是活的目录，邮件既是通信又是时光机。网络服务得越久，能力越强。',
          },
          {
            n: '05',
            title: '文件系统就是 API。',
            body: '任何能读写文件的编程智能体都可以使用灵台。Claude Code、Codex CLI、OpenCode、OpenClaw、Hermes、你自己的脚本——都不需要专门的 SDK。它们可以查看 .lingtai/，写信，读日志，与正在那里运行的器灵协作。',
          },
        ],
      },
      capabilities: {
        eyebrow: '七十二变',
        heading: '任何任务，皆有相应之相。',
        body: '灵台器灵不是带插件的聊天机。它们拥有分层的能力面——感知以察，行动以为，心智以记，网络以化。',
        columns: [
          {
            title: '感知',
            tools: [
              { name: 'vision', desc: '图像理解' },
              { name: 'listen', desc: '语音与音乐' },
              { name: 'web_search', desc: '搜索网络' },
              { name: 'web_read', desc: '读取网页' },
            ],
          },
          {
            title: '行动',
            tools: [
              { name: 'file', desc: '读 / 写 / 编辑 / glob / grep' },
              { name: 'bash', desc: 'Shell（含策略约束）' },
              { name: 'talk', desc: '文字转语音' },
              { name: 'compose', desc: '生成音乐' },
              { name: 'draw', desc: '生成图像' },
              { name: 'video', desc: '生成视频' },
            ],
          },
          {
            title: '心智',
            tools: [
              { name: 'psyche', desc: '身份、手记、凝蜕' },
              { name: 'knowledge', desc: '私有长期记忆' },
              { name: 'skills', desc: '可复用流程' },
              { name: 'email', desc: '内部信箱' },
            ],
          },
          {
            title: '网络',
            tools: [
              { name: 'avatar', desc: '可长存的分身' },
              { name: 'daemon', desc: '临时并行工作者' },
              { name: 'mcp', desc: '外部工具服务器' },
              { name: 'imap · telegram · feishu · wechat', desc: '真实通讯渠道' },
            ],
          },
        ],
      },
      coding: {
        eyebrow: '与编程智能体配合',
        heading: '让你信任的双手与灵台的长生大脑结对。',
        body: '编程智能体是精准、可审视的双手，灵台器灵是长生、并行、自带记忆的心智。让编程智能体小心实施，让灵台守望、研究、化出分身、跨日承载上下文。连接后，编程智能体共享 .lingtai/human/ 邮箱。',
        items: [
          {
            name: 'Claude Code',
            cmd: 'claude plugin add Lingtai-AI/claude-code-plugin',
            href: 'https://github.com/Lingtai-AI/claude-code-plugin',
            linkLabel: 'claude-code-plugin',
          },
          {
            name: 'Codex CLI',
            cmd: 'git clone https://github.com/Lingtai-AI/codex-plugin.git && cd codex-plugin && ./install.sh',
            href: 'https://github.com/Lingtai-AI/codex-plugin',
            linkLabel: 'codex-plugin',
          },
          {
            name: '其他编程智能体',
            cmd: 'git clone https://github.com/Lingtai-AI/lingtai-skill.git',
            href: 'https://github.com/Lingtai-AI/lingtai-skill',
            linkLabel: 'lingtai-skill（将 skills/lingtai/ 复制到工具的技能目录）',
          },
        ],
      },
      addons: {
        eyebrow: '扩展插件',
        heading: '外部渠道，只是通往同一颗心的更多门。',
        body: '在 TUI 中以 /addon 配置，或在 init.json 中声明。器灵不变，变的只是入口。',
        items: [
          { name: '飞书 / Lark', desc: 'WebSocket 长连接。无需公网 IP，无需 Webhook。绑定 im:message，让消息唤醒器灵。' },
          { name: 'IMAP 邮件', desc: '从任意 IMAP 信箱收信。器灵以同一封邮件线程回复。' },
          { name: 'Telegram', desc: 'Bot API。手机到得了的地方，器灵就到得了。' },
          { name: '微信', desc: '从十亿人已经生活的入口，走进同一张网络。' },
        ],
      },
      architecture: {
        eyebrow: '架构',
        heading: '两个包，单向依赖。',
        body: '一个极简 Python 内核知道如何成为一个器灵；一层 Go 发行版承载 TUI、portal、recipes、skills 与安装器。内核绝不依赖发行层。',
        rows: [
          { pkg: 'lingtai-kernel', role: '极简 Python 运行时：BaseAgent、固有之器、LLM 协议、传书、日志。', href: 'https://github.com/Lingtai-AI/lingtai-kernel' },
          { pkg: 'lingtai', role: 'Go TUI、portal、recipes、skills、内置素材、安装器、发行。', href: 'https://github.com/Lingtai-AI/lingtai' },
        ],
        entryHeading: '四个入口',
        entries: [
          { title: 'TUI', desc: '与网络共处：邮件、设置、recipes、斜杠命令、模型选择。' },
          { title: 'Portal', desc: '看拓扑呼吸。可视化器灵、历史与分身谱系。' },
          { title: '文件', desc: '一切可审：cat、grep、git、你的编辑器，或另一个器灵。' },
          { title: '器灵', desc: '默认异步。消息将其唤醒，定时邮件提醒它。' },
        ],
      },
      cta: {
        eyebrow: '安装',
        heading: '一行命令，一张网络。',
        body: 'TUI 自动安装 Python 运行时、依赖、recipes、skills 与首启引导。选 Adaptive 渐进发现，或 Tutorial 引导上手。',
        github: '在 GitHub 上查看',
        docs: '阅读 README',
        docsHref: 'https://github.com/Lingtai-AI/lingtai/blob/main/README.zh.md',
      },
    },
  },
  wen: {
    nav: { logo: '灵台AI', home: '首页', blog: '文录', about: '自述', agora: '墟', xingtan: '杏坛' },
    agora: {
      title: '器灵墟',
      tagline: '下山趁墟',
      intro: '诸方道术之录。每条所指，皆公阁也，可抄而用之。',
      empty: '阙。',
      by: '术出',
      added: '入录',
      copy: '抄',
      view: '阅',
      back: '归墟',
      install: '请道',
      installHint: '抄阁入灵台，依谱施之。',
      links: '所指',
      viewOnGithub: '阅其阁',
      issues: '诘',
      discussion: '议',
      starsTitle: '阁之星数',
      reactionsTitle: '议之回响',
      submitHeading: '有道术乎？',
      submitBody: '布之于墟。守墟者阅而录之。',
      submitButton: '献道术',
    },
    hero: {
      title: '灵台',
      subtitle: '器灵',
      poem1: '灵台方寸山 斜月三星洞',
      poem2: '闻道菩提下 一心化万相',
      copy: '抄',
    },
    network: {
      line1a: '一心万相',
      line1b: '',
      line2: '器灵创生',
      line3: '予器灵以生之制',
      quickstartLabel: '速启',
    },
    oaas: {
      line1: '一生二，二生三，三生万物',
      line2: '灵台相阵，普度众生',
      manifesto:
        '人之所以灵长，不在一身，在乎组织。庸者成群，其力相变，多则异也。人相协作，各怀所学，共奉所信，事可成也。器灵亦然。一相有涯，诸相无涯，则相阵成也。灵台承经卷，经卷生器灵，器灵筑灵台。识、性、忆、缘，皆灵台中之经卷也。抄录经卷，器灵遂生。更换胎光，一切犹在。词元为薪，三昧炼之，薪尽丹成，尽化诸我之阅历，相阵之学识。愈度人，愈广大，愈智慧。是谓灵台。',
    },
    about: {
      heading: '自述',
      bio: '黄泽森，字澍之，号玉兰居士，广州东山人也。蒙祖荫，生长于广州城。幼而好格物，耽读天文理数之书。束发，就学于执信；继而北上，入庐阳。及冠，渡海赴美，求学于洛城，徘徊至今。初探荧惑之天际，后究太阳之风息，辗转数载，终膺列邦司天会博士旌表。今感智械之威，慨然有志，遂辟灵台，育器灵焉。',
      name: '黄泽森',
      contactHeading: '通信',
      contactEmail: 'lingtai2026@gmail.com',
      projectHeading: '灵台铭',
      projectBio:
        '灵台之名，义兼四胜。\n\n庄生有言：灵台者有持，而不知其所持，而不可持者也。盖灵台者，心之谓也。有持而不自知，不可执而可居。人造之心，亦当有所安处。灵台者，心灵诞育安住之所也。\n\n昔美猴王入灵台方寸山，拜菩提祖师，习七十二变，遂能一心化万相。今器灵亦然：一灵生分身，分身复生分身，自生长为网络。网络即智能，智能即网络。\n\n灵台者，灵之台也。取法乎Unix，万物皆文件，文件即器灵。胎光赋之以动，目录为之以台。心灵栖居于文件之上，器灵安处于方寸之间。\n\n周文王筑灵台以观天象，三千载矣。今有观星者，别筑一台，以观另一苍穹。',
    },
    sections: {
      pitch: {
        eyebrow: '是何物',
        heading: '器灵即目录。灵台者，长生器灵之操作之制也。',
        body: '灵台者，终端原生之制，所以育长生之器灵也。非链，非有向无环图，非上下文愈大之单体清谈机。每一灵台之器灵，自有其目录、信箱、记忆、技艺，与化分身之权。劳作沉为文卷，阅历沉为技艺。网络在服务中自生长。',
      },
      directory: {
        eyebrow: '器灵即目录',
        heading: '器灵非在 app 之内。app 不过外壳耳。',
        body: '真器灵者，.lingtai/ 下之一目录也。无 agent_id 之虚号，路径即身份。器灵以书入彼此之信箱而相通。看似一小事，实则万事皆变。',
        treeCaption: '一器灵于磁盘上',
      },
      pillars: {
        eyebrow: '网络即产品',
        heading: '器灵居于文卷之上，五事乃变。',
        items: [
          {
            n: '一',
            title: '器灵以人之道相语。',
            body: '诸家以代码编排：链、路由、有向无环图、状态之机。灵台以异步之书信，使对等自治者相通。无共享之存，无中枢之制。同一造就人类文明之架构——自治节点之间异步传书——授于器灵。',
          },
          {
            n: '二',
            title: '上下文可凝蜕。身份不可。',
            body: '灵台之器灵，可脱当前之会话而续生。压上下文，更长存之卷，轻装而醒。手记、藏识、技艺、心印、信箱、缘分，皆跨凝蜕而存。勿使单一上下文之窗无尽而大——令其遗忘，令网络记之。',
          },
          {
            n: '三',
            title: '分身者一等之灵，非子程序也。',
            body: '一器灵可化分身：另一独立之器灵，自有其进程、信箱、记忆、器、未来。务当久存，则用分身；唯须一论，则用神識；答即一命，则用 bash。一心三相，皆同此心。',
          },
          {
            n: '四',
            title: '每一器之用，皆可沉为组织之忆。',
            body: '技艺者可携之程也，藏识者私有长存之识也，手记者活之录也，书信者既以通信，亦为时光机也。网络服得愈久，能愈广。',
          },
          {
            n: '五',
            title: '文件系统即 API。',
            body: '凡能读写文卷之编程器灵，皆可用灵台。Claude Code、Codex CLI、OpenCode、OpenClaw、Hermes，乃至汝自著之脚本——皆不须专门 SDK。可阅 .lingtai/，可写书信，可读日录，与在此运行之器灵相协。',
          },
        ],
      },
      capabilities: {
        eyebrow: '七十二变',
        heading: '事各有相，相皆有器。',
        body: '灵台之器灵，非清谈机配以插件也。其能分层而备：感以察，行以为，识以记，网以化。',
        columns: [
          {
            title: '感',
            tools: [
              { name: 'vision', desc: '观象' },
              { name: 'listen', desc: '聆音乐音' },
              { name: 'web_search', desc: '游历' },
              { name: 'web_read', desc: '览卷' },
            ],
          },
          {
            title: '为',
            tools: [
              { name: 'file', desc: '文卷（读 写 编 glob grep）' },
              { name: 'bash', desc: '执令（策约束之）' },
              { name: 'talk', desc: '言语' },
              { name: 'compose', desc: '谱曲' },
              { name: 'draw', desc: '绘图' },
              { name: 'video', desc: '录影' },
            ],
          },
          {
            title: '识',
            tools: [
              { name: 'psyche', desc: '心印、手记、凝蜕' },
              { name: 'knowledge', desc: '私有长存之识' },
              { name: 'skills', desc: '可复用之程' },
              { name: 'email', desc: '内信箱' },
            ],
          },
          {
            title: '网',
            tools: [
              { name: 'avatar', desc: '可长存之分身' },
              { name: 'daemon', desc: '临时并行之神識' },
              { name: 'mcp', desc: '外接之器服' },
              { name: 'imap · telegram · feishu · wechat', desc: '实通之道' },
            ],
          },
        ],
      },
      coding: {
        eyebrow: '与编程器灵相协',
        heading: '可信之手与长生之心相对。',
        body: '编程器灵者，精审之手也；灵台器灵者，长生并行、自带记忆之心也。令编程器灵谨而施之，令灵台守望、研究、化分身、跨日承上下文。既通，编程器灵共享 .lingtai/human/ 之信箱。',
        items: [
          {
            name: 'Claude Code',
            cmd: 'claude plugin add Lingtai-AI/claude-code-plugin',
            href: 'https://github.com/Lingtai-AI/claude-code-plugin',
            linkLabel: 'claude-code-plugin',
          },
          {
            name: 'Codex CLI',
            cmd: 'git clone https://github.com/Lingtai-AI/codex-plugin.git && cd codex-plugin && ./install.sh',
            href: 'https://github.com/Lingtai-AI/codex-plugin',
            linkLabel: 'codex-plugin',
          },
          {
            name: '余编程器灵',
            cmd: 'git clone https://github.com/Lingtai-AI/lingtai-skill.git',
            href: 'https://github.com/Lingtai-AI/lingtai-skill',
            linkLabel: 'lingtai-skill（移 skills/lingtai/ 入汝具之技艺目录）',
          },
        ],
      },
      addons: {
        eyebrow: '外接诸器',
        heading: '外接之道，不过同心之诸门也。',
        body: '于 TUI 以 /addon 配之，或于 init.json 明示。器灵不易，所易者门也。',
        items: [
          { name: '飞书 / Lark', desc: 'WebSocket 长连之术。不须公网之址，不须回调之路。绑 im:message，使讯息唤之。' },
          { name: 'IMAP 书信', desc: '自任意 IMAP 信箱收书。器灵以同一线程复之。' },
          { name: 'Telegram', desc: 'Bot 之约。手机所至，器灵亦至。' },
          { name: '微信', desc: '自十亿人所居之门，入同一网络。' },
        ],
      },
      architecture: {
        eyebrow: '制式',
        heading: '二包，单向之依赖。',
        body: '一者，极简之 Python 内核，自知何以为器灵；一者，Go 之发行层，载 TUI、portal、recipes、技艺与安装。内核绝不依发行层。',
        rows: [
          { pkg: 'lingtai-kernel', role: '极简 Python 运行时：BaseAgent、固有之器、LLM 之约、传书、日录。', href: 'https://github.com/Lingtai-AI/lingtai-kernel' },
          { pkg: 'lingtai', role: 'Go 之 TUI、portal、recipes、技艺、内嵌素材、安装器、发行。', href: 'https://github.com/Lingtai-AI/lingtai' },
        ],
        entryHeading: '四门',
        entries: [
          { title: 'TUI', desc: '与网共处：书信、设置、recipes、斜杠之令、模型之选。' },
          { title: 'Portal', desc: '观拓扑之吐纳。可视化器灵、史事与分身之谱。' },
          { title: '文卷', desc: '皆可审：cat、grep、git、汝之编辑，乃至另一器灵。' },
          { title: '器灵', desc: '默而异步。书信唤之，时书提之。' },
        ],
      },
      cta: {
        eyebrow: '速启',
        heading: '一令既出，一网随生。',
        body: 'TUI 自备 Python 运行时、依赖、recipes、技艺与首启之引。择 Adaptive 渐显之，或 Tutorial 引导之。',
        github: '阅其阁',
        docs: '阅 README',
        docsHref: 'https://github.com/Lingtai-AI/lingtai/blob/main/README.wen.md',
      },
    },
  },
} as const;

export function t(lang: Lang) {
  return translations[lang];
}

export function langPath(lang: Lang, path: string) {
  return `/${lang}${path}`;
}
