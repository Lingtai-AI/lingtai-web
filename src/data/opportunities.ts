export type Opportunity = {
  id: string;
  status: 'open' | 'draft';
  title: string;
  titleZh: string;
  tagline: string;
  taglineZh: string;
  sponsor: string;
  location: string;
  backgrounds: string[];
  backgroundsZh: string[];
  outputs: string[];
  outputsZh: string[];
  summary: string;
  summaryZh: string;
  researchQuestions: string[];
  researchQuestionsZh: string[];
  methods: string[];
  methodsZh: string[];
  notes: string[];
  notesZh: string[];
};

export const opportunities: Opportunity[] = [
  {
    id: 'counterfactual-novel-simulation',
    status: 'open',
    title: 'Counterfactual Novel Simulation with LingTai Multi-Agent Networks',
    titleZh: '用 LingTai 多智能体网络模拟小说反事实发展',
    tagline:
      'Change one character, event, or rule in a story world, then study how the narrative diverges.',
    taglineZh:
      '修改小说世界中的一个人物、事件或规则，观察叙事如何分叉、人物关系如何重组。',
    sponsor: 'NUS Prof. Lin Du / Jason H.',
    location: 'Remote-friendly research collaboration',
    backgrounds: [
      'LLM agents and multi-agent simulation',
      'Narrative generation or computational creativity',
      'HCI, digital humanities, or computational literary studies',
      'Evaluation design for generative AI systems',
    ],
    backgroundsZh: [
      'LLM agent 与多智能体模拟',
      '叙事生成或计算创造力',
      'HCI、数字人文或计算文学研究',
      '生成式 AI 系统评价设计',
    ],
    outputs: [
      'A reproducible counterfactual story-simulation protocol',
      'A LingTai demo with role, world-state, narrator, and critic avatars',
      'Divergence maps showing how interventions alter plots and relationships',
      'A paper-style evaluation over public-domain or original story worlds',
    ],
    outputsZh: [
      '可复现的反事实故事模拟协议',
      '包含角色、世界状态、叙事者、评论者 avatar 的 LingTai demo',
      '展示干预如何改变情节与人物关系的 divergence map',
      '基于公版或原创故事世界的论文式评估',
    ],
    summary:
      'This project treats a novel as a simulated social world rather than a prompt to continue. We define a canonical baseline, introduce controlled interventions, let specialized LingTai avatars roll out the consequences, and evaluate whether the resulting branches remain coherent, causally grounded, and literarily interesting.',
    summaryZh:
      '这个项目把小说视作一个可模拟的社会世界，而不是简单续写 prompt。我们先定义 canonical baseline，再加入受控反事实干预，让 LingTai 的不同 avatar 推演后果，并评价分支故事是否保持角色一致、因果自洽和文学趣味。',
    researchQuestions: [
      'How should a narrative world be decomposed into persistent roles, memories, goals, and shared state?',
      'Which interventions produce meaningful divergence instead of arbitrary rewriting?',
      'Can multiple specialized agents preserve character consistency better than one monolithic generator?',
      'How do we evaluate story branches: causality, theme, character fidelity, novelty, and reader interest?',
    ],
    researchQuestionsZh: [
      '如何把叙事世界拆解成持久角色、记忆、目标和共享世界状态？',
      '哪些反事实干预会带来有意义的分叉，而不是任意改写？',
      '多个专门 avatar 是否比单一生成器更能保持人物一致性？',
      '如何评价故事分支：因果性、主题、人物保真、新颖性和读者兴趣？',
    ],
    methods: [
      'Character avatars maintain private goals, beliefs, relationships, and local memories.',
      'A world-state avatar tracks facts, timeline constraints, and intervention effects.',
      'A narrator avatar turns state transitions into readable scenes without owning the world model.',
      'A critic/evaluator avatar scores causal consistency, role fidelity, thematic drift, and quality.',
      'Repeated rollouts estimate a distribution of possible endings under the same intervention.',
    ],
    methodsZh: [
      '角色 avatar 维护私有目标、信念、关系和局部记忆。',
      '世界状态 avatar 跟踪事实、时间线约束和干预后果。',
      '叙事者 avatar 把状态转移写成可读场景，但不拥有世界模型。',
      '评论/评价 avatar 对因果一致、人物保真、主题漂移和质量打分。',
      '多次 rollout 估计同一干预下可能结局的分布。',
    ],
    notes: [
      'Public-domain novels or original synthetic settings are preferred for the first experiments.',
      'The goal is a research protocol and demo, not unconstrained fan fiction generation.',
    ],
    notesZh: [
      '第一阶段优先使用公版小说或原创/合成设定，避免版权问题。',
      '目标是研究协议和 demo，不是无约束同人文生成。',
    ],
  },
];
