export const languages = ['en', 'zh', 'wen'] as const;
export type Lang = (typeof languages)[number];

export function isValidLang(lang: string): lang is Lang {
  return languages.includes(lang as Lang);
}

const translations = {
  en: {
    nav: { logo: 'LingTai AI', blog: 'Blog', about: 'About' },
    hero: {
      title: 'LingTai',
      subtitle: 'Agent',
      poem1: 'Awaken under Bodhi',
      poem2: 'One soul, thousand avatars',
      copy: 'copy',
    },
  },
  zh: {
    nav: { logo: '灵台AI', blog: '博客', about: '关于' },
    hero: {
      title: '灵台',
      subtitle: 'Agent',
      poem1: '灵台方寸山 斜月三星洞',
      poem2: '闻道菩提下 一心化万相',
      copy: '复制',
    },
  },
  wen: {
    nav: { logo: '灵台AI', blog: '文录', about: '自述' },
    hero: {
      title: '灵台',
      subtitle: '器灵',
      poem1: '灵台方寸山 斜月三星洞',
      poem2: '闻道菩提下 一心化万相',
      copy: '抄',
    },
  },
} as const;

export function t(lang: Lang) {
  return translations[lang];
}

export function langPath(lang: Lang, path: string) {
  return `/${lang}${path}`;
}
