---
title: "Agent Harness 田野指南：50 个 loop、工具系统，以及 LingTai 应该学什么"
date: 2026-06-08
tags: [tech, devlog]
lang: zh
description: "一篇持续更新的双语 field guide：从 50 个 agent harness 的源码和公开材料里，看 coding CLI、IDE agent、图框架、多 agent 系统、沙箱底座，以及 LingTai 的下一步。"
---

<div class="callout callout-tldr">

**Living field guide**

这是一篇持续更新的田野指南，浓缩自对 50 个当前 agent harness 的 source-grounded 调研。生态变化很快：harness 会改版、消失、合并，也会不断给 LingTai 新的启发，所以这篇放在 blog 里，后续可以继续增补。

</div>

多数 agent 讨论都在谈“模型”。这篇文章谈的是模型外面那层东西：**harness**。

一个 harness 决定上下文如何组装，工具如何声明，工具调用如何审批，副作用如何提交，trace 如何记录，中断后如何恢复，以及人类如何判断 agent 是在思考、卡住，还是正在行动。模型当然重要，但真正决定 agent 能不能可靠干活的，往往是 harness。

对 LingTai 来说，关键比较不是“谁的 ReAct loop 更聪明”。LingTai 的形态本来就不同：它是一个 always-on **agent network**，有持久记忆、mail/chat wakeup、avatars、daemons、MCP/addon ownership 和生命周期控制。更有价值的问题是：这样一个网络运行时，应该从最好的单 agent harness、框架 harness、沙箱底座里借鉴什么？

## 一句话结论

这 50 个系统大致聚成五种主流方向：

1. **Coding workbench** 把工具使用做得可见：shell、文件编辑、patch、审批、可恢复会话。
2. **IDE agent** 靠贴近代码取胜，把上下文和审批摩擦降到最低。
3. **图/工作流框架** 用类型化状态、checkpoint 和边，把长计划变得更确定。
4. **SDK/框架型 harness** 正在收敛到 strict tools、typed outputs、tracing、evals、handoffs。
5. **沙箱底座** 提醒我们：执行策略不是实现细节，而是 harness 本身的一部分。

LingTai 的差异化仍然很强：它不只是一个 loop，而是一个网络运行时。但这次调研也给出了很具体的改进方向。

## 给 LingTai 的改进建议

### P0 — Tool-result commit ledger

让每一次工具调用显式经过这些状态：**proposed → approved → executing → side-effect committed → model-visible → durable-log-visible**。这会让 LingTai 比常见 SDK 更强，也能减少 orphan tool call、retry、heal 时的歧义。

### P0 — Daemon/process reattachment

给每个 daemon/backend 建立 run-artifact 契约：parent PID、child PID、workspace、transcript、report path、last heartbeat、recovery action。重启后 LingTai 应该能 reattach、finalize 或解释状态，而不是留下“好像还在跑/不知道在哪”的任务。

### P1 — Span-style observability

借鉴现代 agent SDK 越来越常见的 tracing 形态：turn → model call → tool calls → MCP calls → daemon tasks。在 portal/TUI 里渲染出来，让人能看懂 agent 为什么慢、为什么卡、卡在哪。

### P1 — Graph/checkpoint option

保留 LingTai 的 always-on loop，但为需要确定性多步状态的 workflow 增加 graph/checkpoint primitive。LangGraph 式 checkpoint 不是 LingTai 的替代品，而是 LingTai 内部可以提供的一种模式。

### P1 — Stricter tool schema ergonomics

把工具元数据做成清楚的数据：参数 schema、副作用类别、timeout、审批策略、retry 策略、错误 formatter。LingTai 拥有的工具越多，工具契约越应该可见。

### P1 — Sandbox policy objects

让每个工具/backend 都有一等 sandbox/approval policy。Claude Code、Codex、SWE-agent、E2B/Daytona 都说明：文件系统、shell、网络、审批策略会直接塑造 agent 行为。

### P1 — Cheaper handoff primitive

LingTai 的 avatar 是持久、强力的。但有时我们也需要更便宜的 in-process handoff/router primitive：当只需要一次专门路由、不需要持久身份时，别每次都生成一个长期 agent。

## Taxonomy：如何读这个领域

- **Agent frameworks**（10）：把 agent 暴露为带工具、记忆、callback 或类型化输出的可编程对象。
- **Code workbench agents**（7）：面向仓库编辑、patch、shell 命令和审批循环的终端 agent。
- **IDE-native agents**（6）：嵌入编辑器的 agent，上下文和审批都在代码旁边发生。
- **Autonomous SWE platforms**（5）：拥有持久工作区、尝试端到端软件工程任务的长期运行系统。
- **Multi-agent frameworks**（5）：以角色/团队协作为产品界面的系统。
- **Workflow runtimes**（3）：让 agent step 持久、可组合的图或事件运行时。
- **Benchmark coding harnesses**（2）：为评测 coding agent 而生的小型可复现 loop。
- **Commercial closed agents**（2）：闭源产品；虽然不能读全源码，但公开材料仍能提供产品模式。
- **RAG/tool frameworks**（2）：从检索和 pipeline 栈长出来的 agentic tool-routing 层。
- **Review/issue-to-PR agents**（2）：面向 review、issue triage、PR 生成的窄域仓库 agent。
- **Agent lineage / primitives**（1）：最小 task loop 祖先和 agent 原语。
- **Local runtimes**（1）：面向个人工作站的本地 extension/tool runtime。
- **Memory-first runtimes**（1）：以显式记忆对象为核心运行时的系统。
- **Prompt/programming frameworks**（1）：把 prompt/agent program 当作软件来优化的系统。
- **Sandbox substrates**（1）：让工具执行安全、可复现的执行底座。
- **Uncertain/small harnesses**（1）：小型或低置信度包，用来标记“harness”这个词的边界。

## 50 个 harness 索引

| # | Harness | 形态 | 证据 | 给 LingTai 的启发 |
|---:|---|---|---|---|
| 1 | Claude Code | Coding CLI / closed agent | 闭源/公开证据 | 把 agent loop 当成产品界面：审批、压缩、恢复、工具语义都应该可见，而不是藏在提示词里。 |
| 2 | [OpenAI Codex CLI](https://github.com/openai/codex) | Coding CLI | 公开源码为主 | 沙箱和审批模式应该是一等运行时策略，而不是提示词里的约定。 |
| 3 | [OpenCode](https://github.com/sst/opencode) | Coding CLI | 公开源码为主 | 多供应商终端 agent 需要清晰的会话状态，以及模型/工具抽象边界。 |
| 4 | [OpenHands](https://github.com/All-Hands-AI/OpenHands) | Autonomous SWE platform | 公开源码为主 | 持久事件流加工作区沙箱，让长时间软件工程任务可检查、可恢复。 |
| 5 | [Aider](https://github.com/Aider-AI/aider) | Coding CLI | 公开源码为主 | Git 原生编辑让 coding agent 更可控：每个改动都是带上下文的 diff。 |
| 6 | [Continue](https://github.com/continuedev/continue) | IDE/code assistant platform | 公开源码为主 | IDE 原生 agent 的优势来自显式、可由用户编辑的上下文组装。 |
| 7 | [Cline](https://github.com/cline/cline) | IDE coding agent | 公开源码为主 | 当每次工具调用都对用户可见时，简单的 plan-act-observe loop 也能很强。 |
| 8 | [Roo Code](https://github.com/RooCodeInc/Roo-Code) | IDE coding agent | 公开源码为主 | mode 是表达专门行为的低成本方式，不一定每次都要生成持久 agent。 |
| 9 | [Goose](https://github.com/block/goose) | Local agent runtime | 公开源码为主 | 基于 extension 的本地运行时让工具可组合，同时把执行留在用户身边。 |
| 10 | [OpenClaw](https://github.com/openclaw-ai/openclaw) | Automation/agent-loop framework | 公开源码为主 | 显式记录 agent loop 本身就是产品能力；用户需要知道到底什么在循环。 |
| 11 | [OpenHarness](https://github.com/thu-nmrc/OpenHarness) | Long-running autonomous harness | 公开源码为主 | 长期自主运行需要 run artifact，而不只是聊天记录。 |
| 12 | [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Self-improving agent | 公开源码为主 | 自我改进需要记忆和技能边界，避免能力演化变成意外漂移。 |
| 13 | [Pi](https://github.com/earendil-works/pi) | Minimal coding harness | 公开源码为主 | 极简 harness 暴露了不可再缩的循环：组装上下文、调用模型、应用工具、重复。 |
| 14 | [Oh My Pi](https://github.com/can1357/oh-my-pi) | Terminal coding harness | 公开源码为主 | 持久执行内核很有用，但必须由清晰的轮次/工具预算约束。 |
| 15 | harness-agent | Small/uncertain harness package | 公开来源不确定 | 小包提供了有用的反例：叫做 harness 不等于真的拥有 agent loop。 |
| 16 | [LangGraph](https://github.com/langchain-ai/langgraph) | Graph agent framework | 公开源码为主 | 带 checkpoint 的图是确定性多步 agent workflow 的最强模式。 |
| 17 | [LangChain Agents](https://github.com/langchain-ai/langchain) | Agent framework | 公开源码为主 | 工具 schema、callback 和中间步骤应该能从框架边界被检查。 |
| 18 | [CrewAI](https://github.com/crewAIInc/crewAI) | Multi-agent framework | 公开源码为主 | 角色化团队让委派更易读，但需要持久责任链，避免变成角色扮演。 |
| 19 | [AutoGen](https://github.com/microsoft/autogen) | Multi-agent framework | 公开源码为主 | 用对话做编排很灵活；真正困难的是终止条件和交接规则。 |
| 20 | [Semantic Kernel Agents](https://github.com/microsoft/semantic-kernel) | Enterprise agent framework | 公开源码为主 | 企业级 harness 需要类型化函数、planner 和普通用户可信任的策略界面。 |
| 21 | [LlamaIndex Agents](https://github.com/run-llama/llama_index) | RAG/tool agent framework | 公开源码为主 | RAG 中心 agent 说明检索和工具调用应该共享同一套可追踪上下文契约。 |
| 22 | [PydanticAI](https://github.com/pydantic/pydantic-ai) | Typed agent framework | 公开源码为主 | 类型化输出和依赖能减少模型/框架边界的歧义。 |
| 23 | [Agno](https://github.com/agno-agi/agno) | Agent/team framework | 公开源码为主 | 团队、记忆和工具应该先作为数据配置，再作为执行轨迹追踪。 |
| 24 | [smolagents](https://github.com/huggingface/smolagents) | Lightweight code/tool agents | 公开源码为主 | code-as-action 很强，但沙箱和 import 必须由设计约束。 |
| 25 | [DSPy agents](https://github.com/stanfordnlp/dspy) | Prompt/programming framework | 公开源码为主 | Agent 行为可以作为程序优化，而不只是手写 prompt。 |
| 26 | [AutoGPT Forge](https://github.com/Significant-Gravitas/AutoGPT) | Autonomous agent platform | 公开源码为主 | 自主 agent 平台首先需要能力注册表和预算，而不是更多 prompt。 |
| 27 | [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | Software-company multi-agent | 公开源码为主 | 结构化产物能让多 agent 协作少一点聊天，多一点可审查。 |
| 28 | [CAMEL-AI](https://github.com/camel-ai/camel) | Communicative multi-agent framework | 公开源码为主 | 社会式 agent 模拟适合研究，但生产环境需要所有权和状态边界。 |
| 29 | [Letta / MemGPT](https://github.com/letta-ai/letta) | Stateful memory agent server | 公开源码为主 | 记忆必须是一等运行时对象，具有编辑、回忆和持久化语义。 |
| 30 | [Mastra](https://github.com/mastra-ai/mastra) | TypeScript agent framework | 公开源码为主 | 现代应用型 agent 框架把 agent、workflow、eval 和观测性当成同一套开发栈。 |
| 31 | [VoltAgent](https://github.com/VoltAgent/voltagent) | TypeScript agent framework | 公开源码为主 | 开发者友好的 dashboard 很重要，因为 agent 失败通常是读 trace 的问题。 |
| 32 | [Motia](https://github.com/MotiaDev/motia) | Event-driven workflow framework | 公开源码为主 | 事件驱动 workflow 是承载跨请求 agent step 的好底座。 |
| 33 | [Haystack Agents](https://github.com/deepset-ai/haystack) | Pipeline/RAG agent framework | 公开源码为主 | 当检索、路由和工具调用相互作用时，pipeline 和 agent 应该收敛。 |
| 34 | [SWE-agent](https://github.com/SWE-agent/SWE-agent) | SWE-bench coding harness | 公开源码为主 | Benchmark harness 证明了可复现 run directory 和环境规格的价值。 |
| 35 | [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent) | Lightweight SWE harness | 公开源码为主 | 小而显式的 loop 比巨型框架更容易 benchmark。 |
| 36 | Devin | Commercial SWE agent | 闭源/公开证据 | 闭源 agent 仍有产品启发：持久工作区、异步工作、人类交接。 |
| 37 | Factory Droid | Commercial SWE agent | 闭源/公开证据 | 商业 SWE agent 强调端到端任务所有权，而不是框架 API。 |
| 38 | [Qodo PR-Agent](https://github.com/qodo-ai/pr-agent) | Code review/change agent | 公开源码为主 | 窄域 review agent 通过限制上下文、输出和仓库副作用取胜。 |
| 39 | [Sweep AI](https://github.com/sweepai/sweep) | Issue-to-PR agent | 公开源码为主 | issue-to-PR agent 需要在仓库现实偏离 issue 文本时清晰升级。 |
| 40 | [Mentat](https://github.com/AbanteAI/mentat) | Command-line coding agent | 公开源码为主 | 对话加 patching 仍然是本地 coding agent 的可靠基线。 |
| 41 | Cursor Agent | IDE-native commercial agent | 闭源/公开证据 | IDE 原生商业 agent 通过无摩擦上下文和编辑器内审批取胜。 |
| 42 | Windsurf / Cascade | IDE-native commercial agent | 闭源/公开证据 | Cascade 类产品说明连续项目上下文比一次性 prompt 更重要。 |
| 43 | GitHub Copilot Agent | IDE/GitHub coding agent | 闭源/公开证据 | GitHub 原生 agent 的优势是直接生活在 issue、branch、PR 所在之处。 |
| 44 | [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) | SDK / AgentKit | 公开源码为主 | tracing、handoff、typed tools 正在成为 agent SDK 的默认契约。 |
| 45 | [BeeAI Framework](https://github.com/i-am-bee/beeai-framework) | Agent framework | 公开源码为主 | 新一代框架越来越把记忆、工具和观测性打包在一起，而不是当作附加件。 |
| 46 | [ControlFlow](https://github.com/PrefectHQ/ControlFlow) | Workflow/agent framework | 公开源码为主 | 带类型化结果的 task graph 让 agent 工作能组合进普通软件系统。 |
| 47 | [PocketFlow](https://github.com/The-Pocket/PocketFlow) | Minimal workflow framework | 公开源码为主 | 极简 node/action 抽象适合追求可教学性和可移植性。 |
| 48 | [E2B / Daytona](https://github.com/e2b-dev/E2B) | Sandbox substrate | 公开源码为主 | 沙箱就是 harness 的一部分：文件系统、网络、进程、snapshot 策略都会塑造行为。 |
| 49 | [SuperAGI](https://github.com/TransformerOptimus/SuperAGI) | Autonomous agent platform | 公开源码为主 | 早期自主平台提醒我们：工具更多但状态语义不更严，只会变成混乱。 |
| 50 | [BabyAGI / functionz](https://github.com/yoheinakajima/babyagi) | Task-loop lineage | 公开源码为主 | 最早的 task loop 仍藏在现代 agent 底下：创建任务、执行、重排优先级、记忆。 |

## 这对 LingTai 意味着什么

LingTai 不应该照抄某一个 harness。更有意思的方向是综合：

- 从 **Claude Code / Codex / Aider / Cline** 学产品级审批 loop、可恢复会话、沙箱模式和 patch discipline；
- 从 **OpenHands / SWE-agent** 学可复现 run directory、event stream 和 workspace recovery；
- 从 **LangGraph / ControlFlow / PocketFlow / Motia** 学 deterministic workflow 所需的 graph/checkpoint 模式；
- 从 **OpenAI Agents SDK / PydanticAI / Mastra / VoltAgent** 学 strict typed tools、tracing、evals 和 developer dashboard；
- 从 **Letta** 学把 memory 当作真正的运行时对象；
- 从 **E2B / Daytona** 学把 sandbox policy 当作产品级契约。

整个领域正在朝更严格的工具契约和 trace 契约演进。而 LingTai 已经拥有更稀有的一部分：agent 可以活着、睡眠、醒来、记忆、生成持久同伴，并通过 channel 协作。下一步，是让这套生命循环里的每一个环节，都像最好的 coding harness 对一个 patch 那样可检查、可恢复、可回放。

## 方法说明

这次底层调研覆盖 50 个系统，优先读源码；开源项目以公开仓库为主要证据。Claude Code、Devin、Cursor、Windsurf/Cascade、GitHub Copilot Agent 等闭源商业系统，因为内部 loop 不完全公开，均标为低置信度；它们被纳入主要是为了产品和界面层启发，而不是当作源码级断言。
