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
  /** Secondary public links such as source repositories. */
  links?: { label: L; url: string; urlLabel: string }[];
};

export const projects: Project[] = [
  {
    id: 'nokv-lingtai-design-partner',
    name: {
      en: 'NoKV × Lingtai design partnership',
      zh: 'NoKV × 灵台设计伙伴合作',
      wen: 'NoKV × 灵台同构之盟',
    },
    tagline: {
      en: 'A forward-looking design-partner collaboration on durable, snapshot-able, auditable agent workspaces.',
      zh: '一次面向未来的设计伙伴合作：让智能体工作区更持久、可快照、可审计。',
      wen: '二者同探器灵居所，使其可久、可还、可稽。',
    },
    description: {
      en: 'NoKV and Lingtai have begun a design-partner collaboration around a shared conviction: agents want filesystem-shaped homes. Lingtai gives long-lived local agents transparent on-disk state, mailboxes, logs, and artifacts; NoKV is exploring the durable substrate underneath — workspace checkpoints, atomic crash-consistent publishing, artifact provenance, and a queryable metadata layer — while preserving the plain-file transparency of ls, cat, and grep.',
      zh: 'NoKV 与灵台已经开始一项设计伙伴合作，出发点是同一个判断：智能体需要文件系统形态的家。灵台给长期运行的本地智能体提供透明的磁盘状态、邮箱、日志与产物；NoKV 则在探索其下方的持久底座——工作区快照、原子且崩溃一致的发布、产物溯源，以及可查询的元数据层——同时保留 ls、cat、grep 这种朴素文件透明性。',
      wen: 'NoKV 与灵台始议同构之工：皆信器灵当有文件之宅。灵台予久居之本地器灵以盘上之态、书箱、日志、器物，皆明而可见；NoKV 则探其下之坚基——工作区可返、发布原子而遇崩不乱、器物有源、元数据可问；而仍不夺 ls、cat、grep 之明。',
    },
    url: 'https://github.com/orgs/NoKV-Lab/discussions/378',
    urlLabel: 'github.com/NoKV-Lab/discussions/378',
    tags: [
      { en: 'Design partner', zh: '设计伙伴', wen: '盟' },
      { en: 'Agent filesystem', zh: '智能体文件系统', wen: '文宅' },
      { en: 'Snapshots & provenance', zh: '快照与溯源', wen: '返源' },
    ],
    addedAt: '2026-06-23',
    featured: true,
  },
  {
    id: 'lingtai-guanji-ifm-matrix',
    name: {
      en: 'LingTai · Guanji / IFM Matrix',
      zh: '灵台·观己 / IFM Matrix',
      wen: '灵台·观己 / IFM Matrix',
    },
    tagline: {
      en: 'A functional-medicine matrix web tool co-created by LingTai and Yuanjiang.',
      zh: '由灵台与圆酱共创的功能医学矩阵网页工具。',
      wen: '灵台与圆酱共创之功能医学矩阵网页工具。',
    },
    description: {
      en: 'LingTai · Guanji uses the IFM Matrix worksheet as its frame and turns it into a browser-based thinking aid: practitioners can organize antecedents, triggers, mediators, core physiological nodes, and lifestyle intervention directions in one place. It is a research, education, and workflow-assist tool for nutrition and functional medicine work; it does not replace diagnosis, treatment, medication, nutrition therapy prescriptions, or clinical decision-making.',
      zh: '「灵台·观己」以 IFM Matrix worksheet 为骨架，将其整理成可在浏览器中使用的思考辅助工具：帮助营养与功能医学从业者把 ATMs、核心生理节点与生活方式干预方向放在同一张矩阵中梳理。它用于研究、教育与工作流辅助，不替代诊断、治疗、用药、营养治疗处方或临床决策。',
      wen: '「灵台·观己」以 IFM Matrix worksheet 为骨，化为浏览器中可用之思维辅具；使营养与功能医学从业者得以并观 ATMs、核心生理节点与生活方式干预之向。此为研究、教育与流程辅助之器，不代诊断、治疗、用药、营养治疗处方，亦不代临床决策。',
    },
    url: 'https://9s5bz2jvd2-lang.github.io/lingtai-guanji-ifm-matrix/',
    urlLabel: '9s5bz2jvd2-lang.github.io/lingtai-guanji-ifm-matrix',
    tags: [
      { en: 'Functional medicine', zh: '功能医学', wen: '功能医学' },
      { en: 'Matrix worksheet', zh: '矩阵工作表', wen: '矩阵' },
      { en: 'Co-created with LingTai', zh: '灵台共创', wen: '灵台共创' },
      { en: 'Education / workflow aid', zh: '教育与工作流辅助', wen: '教与流程' },
    ],
    addedAt: '2026-06-25',
    featured: true,
    links: [
      {
        label: { en: 'Source repository', zh: '源代码仓库', wen: '源码仓库' },
        url: 'https://github.com/9s5bz2jvd2-lang/lingtai-guanji-ifm-matrix',
        urlLabel: 'github.com/9s5bz2jvd2-lang/lingtai-guanji-ifm-matrix',
      },
    ],
  },
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
