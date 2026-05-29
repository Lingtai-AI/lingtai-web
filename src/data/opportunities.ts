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
  people: {
    name: string;
    nameZh: string;
    role: string;
    roleZh: string;
    profile: string;
    profileZh: string;
    links: { label: string; href: string }[];
  }[];
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
    people: [
      {
        name: 'Lin Du',
        nameZh: '杜琳',
        role: 'Sponsor / humanities research advisor',
        roleZh: '资助人与人文学术顾问',
        profile:
          'Lin Du is an Assistant Professor at the National University of Singapore, appointed in Chinese Studies and jointly with Japanese Studies. Her profile sits at the intersection of Chinese and Japanese studies, Asian studies, digital humanities, art history, media studies, machine-learning applications, photography, and visual culture. For this opportunity, that combination matters: counterfactual novel simulation needs not only agent engineering, but also careful thinking about narrative form, cultural context, visual and textual archives, and what counts as a meaningful interpretation rather than arbitrary generation.',
        profileZh:
          '杜琳是新加坡国立大学（NUS）中文系助理教授，并与日本研究系联合任职。她的研究横跨中国研究、日本研究、亚洲研究、数字人文、艺术史、媒介研究、机器学习应用、摄影与视觉文化。对于这个机会来说，这个背景很关键：小说反事实模拟不只是 agent 工程问题，也需要认真处理叙事形式、文化语境、视觉与文本档案，以及什么样的生成结果才算“有解释力”而不是随意续写。',
        links: [
          { label: 'NUS Chinese Studies profile', href: 'https://fass.nus.edu.sg/cs/people/du-lin-%e6%9d%9c%e7%90%b3/' },
          { label: 'NUS Japanese Studies profile', href: 'https://fass.nus.edu.sg/jps/people/du-lin/' },
          { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=sVFwJg4AAAAJ' },
        ],
      },
      {
        name: 'Zesen Huang',
        nameZh: '黄泽森',
        role: 'LingTai lead / agent-systems builder',
        roleZh: '灵台负责人 / Agent 系统构建者',
        profile:
          'Zesen Huang is a postdoctoral scholar in Earth, Planetary, and Space Sciences at UCLA, working in plasma astrophysics with research interests including solar wind, magnetohydrodynamic turbulence, solar physics, and time-series analysis. He is the creator of LingTai, an agent operating system built around persistent memory, skills, avatars, daemons, mail, and multi-agent growth. In this project, his role is to turn the research question into a working LingTai experiment: define the avatar topology, maintain reproducible simulation protocols, build the interactive demo, and connect literary counterfactuals with measurable agent-network behavior.',
        profileZh:
          '黄泽森是 UCLA 地球、行星与空间科学系博士后学者，研究方向属于等离子体天体物理，关注太阳风、磁流体湍流、太阳物理与时间序列分析。他也是 LingTai 的创建者；LingTai 是围绕持久记忆、技能、分身、神识、邮件和多 agent 成长机制构建的 agent operating system。在这个项目中，他负责把研究问题落成可运行的 LingTai 实验：设计 avatar 拓扑、维护可复现模拟协议、搭建交互 demo，并把文学反事实问题连接到可度量的 agent-network 行为。',
        links: [
          { label: 'UCLA EPSS profile', href: 'https://epss.ucla.edu/zesen-huang/' },
          { label: 'LingTai about page', href: 'https://lingtai.ai/en/about/' },
          { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=rcQwoOoAAAAJ' },
        ],
      },
    ],
  },
];
