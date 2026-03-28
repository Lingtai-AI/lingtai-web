export const languages = ['en', 'zh', 'wen'] as const;
export type Lang = (typeof languages)[number];

export function isValidLang(lang: string): lang is Lang {
  return languages.includes(lang as Lang);
}

const translations = {
  en: {
    nav: { logo: 'LingTai AI', home: 'Home', blog: 'Blog', about: 'About' },
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
    },
    about: {
      heading: 'About Me',
      bio: 'Zesen Huang is a postdoctoral scholar in plasma astrophysics at UCLA and a recipient of the 2024 IAU PhD Prize.',
      name: 'Zesen Huang',
    },
  },
  zh: {
    nav: { logo: '灵台AI', home: '首页', blog: '博客', about: '关于' },
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
    },
    about: {
      heading: '关于',
      bio: '黄泽森，字澍之，号玉兰居士，广州东山人也。蒙祖荫，生长于广州城。幼而好格物，耽读天文理数之书。束发，就学于执信；继而北上，入庐阳。及冠，渡海赴美，求学于洛城，徘徊至今。初探荧惑之天际，后究太阳之风息，辗转数载，终膺列邦司天会（IAU）博士旌表（PhD Prize）。今感智械（AI）之威，慨然有志，遂辟灵台，育器灵焉。',
      name: '黄泽森',
    },
  },
  wen: {
    nav: { logo: '灵台AI', home: '首页', blog: '文录', about: '自述' },
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
    },
    about: {
      heading: '自述',
      bio: '黄泽森，字澍之，号玉兰居士，广州东山人也。蒙祖荫，生长于广州城。幼而好格物，耽读天文理数之书。束发，就学于执信；继而北上，入庐阳。及冠，渡海赴美，求学于洛城，徘徊至今。初探荧惑之天际，后究太阳之风息，辗转数载，终膺列邦司天会博士旌表。今感智械之威，慨然有志，遂辟灵台，育器灵焉。',
      name: '黄泽森',
    },
  },
} as const;

export function t(lang: Lang) {
  return translations[lang];
}

export function langPath(lang: Lang, path: string) {
  return `/${lang}${path}`;
}
