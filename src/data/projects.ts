import type { Lang } from '../i18n/translations';

// A localized string: English, Simplified Chinese, and optional Classical (wen).
// `wen` falls back to `zh` when absent.
export type L = { en: string; zh: string; wen?: string };

export function pick(value: L, lang: Lang): string {
  if (lang === 'en') return value.en;
  if (lang === 'wen') return value.wen ?? value.zh;
  return value.zh;
}

export type Project = {
  id: string;
  /** Short display name. */
  name: L;
  /** One-line summary shown under the name. */
  tagline: L;
  /** Longer description / showcase angle. */
  description: L;
  /** External canonical URL for the project. */
  url: string;
  /** Hostname-style label shown on the link chip. */
  urlLabel: string;
  /** Small classifier chips. */
  tags: L[];
  /** Sort/recency hint, ISO date. */
  addedAt: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: 'nira-worldcup-2026',
    name: {
      en: 'Nira · World Cup 2026',
      zh: 'Nira · 2026 世界杯',
      wen: 'Nira · 丙午世界杯',
    },
    tagline: {
      en: 'A public, bilingual feed of football model judgments that validate themselves match by match.',
      zh: '一个公开的中英双语足球模型判断流，逐场比赛自我验证。',
      wen: '足球模型之判，中英并陈，逐战自验，公之于众。',
    },
    description: {
      en: 'Nira posts pre-match directional calls for World Cup 2026 fixtures, then checks each one against the actual result. After every match it records which signals held, which were over- or under-weighted, and how the next judgment should adjust — form and rhythm, defensive risk, stalemate risk, away-game pressure, market drift. It reads like a living agent notebook: an example of a project built around LingTai-style judgment, validation, and feedback loops accumulating over time.',
      zh: 'Nira 为 2026 世界杯赛事发布赛前方向判断，再对照真实结果逐一验证。每场比赛之后，它会记录哪些信号成立、哪些被高估或低估，以及下一次判断该如何调整——状态与节奏、防守风险、僵持风险、客场压力、盘口漂移。它读起来像一本活的智能体笔记：一个围绕灵台式的判断、验证与反馈回路、在时间中不断累积的项目范例。',
      wen: 'Nira 于丙午世界杯，赛前先出方向之判，既战则以实果验之。每战之后，录其信号孰中孰失、孰重孰轻，及来日之判当如何演化——状态节奏、守御之险、僵持之危、客场之压、盘口之移。其状若活器灵之笔记：盖藉灵台之判、验、循而积于时者，一范也。',
    },
    url: 'https://nira.social/worldcup2026',
    urlLabel: 'nira.social/worldcup2026',
    tags: [
      { en: 'Model judgment', zh: '模型判断', wen: '判' },
      { en: 'Validation loop', zh: '验证回路', wen: '验' },
      { en: 'Bilingual feed', zh: '双语流', wen: '双语' },
    ],
    addedAt: '2026-06-23',
    featured: true,
  },
];
