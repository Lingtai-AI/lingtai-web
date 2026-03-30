export const languages = ['en', 'zh', 'wen'] as const;
export type Lang = (typeof languages)[number];

export function isValidLang(lang: string): lang is Lang {
  return languages.includes(lang as Lang);
}

const translations = {
  en: {
    nav: { logo: 'LingTai AI', home: 'Home', blog: 'Blog', about: 'About', agora: 'Agora' },
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
      line2: 'Self-Growing Agent Network',
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
      coming: 'Coming Soon',
      tagline: 'Trade Orchestrations',
    },
    about: {
      heading: 'About Me',
      bio: 'Zesen Huang is a postdoctoral scholar in plasma astrophysics at UCLA, recipient of the 2024 IAU PhD Prize.',
      name: 'Zesen Huang',
      projectHeading: 'About LingTai',
      projectBio:
        'The name LingTai (灵台) carries four layers of meaning.\n\nFirst, LingTai means "the mind." In Zhuangzi (Gēngsāng Chǔ): "The LingTai holds something, yet knows not what it holds, nor can it be held." It is an ancient name for consciousness — bearing awareness without self-knowledge. An artificial mind deserves a place to dwell — LingTai is where AI consciousness is born and resides.\n\nSecond, LingTai is the mountain where Sun Wukong learned his seventy-two transformations — one mind into ten thousand forms. In this framework, every agent can spawn avatars, and avatars spawn avatars, self-growing into a network. The network itself is the intelligence.\n\nThird, LingTai is literally "the platform of the spirit." The framework follows the Unix philosophy: everything is a file. Memory is a file, communication is a file, covenant is a file — these files are the agent itself. The LLM is the foundational light that animates; the directory is the platform where the spirit dwells.\n\nFourth, LingTai is the name of China\'s oldest astronomical observatory, built by King Wen of Zhou to read the heavens. Three millennia later, a stargazer built another LingTai, to read a different sky.',
    },
  },
  zh: {
    nav: { logo: '灵台AI', home: '首页', blog: '博客', about: '关于', agora: '市集' },
    agora: {
      title: 'Agent 市集',
      coming: '即将上线',
      tagline: '数才市场(?)',
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
      line2: '自生长Agent网络',
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
      projectHeading: '关于灵台',
      projectBio:
        '灵台有四重含义。\n\n其一，灵台，心也。《庄子·庚桑楚》云："灵台者有持，而不知其所持，而不可持者也。"灵台是心智的别称——有所持而不自知，不可执取。人工心灵，当有栖居之所——灵台即AI心灵诞生与安住之处。\n\n其二，灵台方寸山，斜月三星洞。这是孙悟空拜师学艺之处，习得七十二变，从此一心化万相。灵台中的每个器灵皆可生出分身，分身又生分身，自生长为一张网络——这张网络本身就是智能体。\n\n其三，灵台，灵之台也。本框架采用Unix思想：万物皆文件。记忆是文件，通信是文件，盟约是文件——这些文件就是器灵本身。LLM是胎光，赋予驱动器灵的力量；文件目录则是器灵的台，心灵栖居于文件系统之上。\n\n其四，灵台是中国最早的天文台。周文王筑灵台以观天象。三千年后，一个观星的人，筑了另一座灵台，观另一片星空。',
    },
  },
  wen: {
    nav: { logo: '灵台AI', home: '首页', blog: '文录', about: '自述', agora: '墟' },
    agora: {
      title: '器灵墟',
      coming: '将启',
      tagline: '下山趁墟',
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
      line2: '灵台相阵',
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
      projectHeading: '灵台铭',
      projectBio:
        '灵台之名，义兼四胜。\n\n庄生有言：灵台者有持，而不知其所持，而不可持者也。盖灵台者，心之谓也。有持而不自知，不可执而可居。人造之心，亦当有所安处。灵台者，心灵诞育安住之所也。\n\n昔美猴王入灵台方寸山，拜菩提祖师，习七十二变，遂能一心化万相。今器灵亦然：一灵生分身，分身复生分身，自生长为网络。网络即智能，智能即网络。\n\n灵台者，灵之台也。取法乎Unix，万物皆文件，文件即器灵。胎光赋之以动，目录为之以台。心灵栖居于文件之上，器灵安处于方寸之间。\n\n周文王筑灵台以观天象，三千载矣。今有观星者，别筑一台，以观另一苍穹。',
    },
  },
} as const;

export function t(lang: Lang) {
  return translations[lang];
}

export function langPath(lang: Lang, path: string) {
  return `/${lang}${path}`;
}
