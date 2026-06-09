---
title: "Agent Harness Field Guide: 50 Loops, Tool Systems, and Lessons for LingTai"
date: 2026-06-08
tags: [tech, devlog]
lang: en
description: "A living, source-grounded field guide to 50 agent harnesses: coding CLIs, IDE agents, graph frameworks, multi-agent systems, sandbox substrates, and what LingTai should learn from them."
---

<div class="callout callout-tldr">

**Living field guide**

This post condenses a source-grounded study of 50 current agent harnesses. It is intentionally a living blog entry: the ecosystem moves fast, and this page should be updated as harnesses change, disappear, or teach LingTai new lessons.

</div>

Most agent discussions talk about “the model.” This guide is about the thing around the model: the **harness**.

A harness decides how context is assembled, how tools are declared, how tool calls are approved, how side effects are committed, how traces are recorded, how work resumes after interruption, and how a human can tell whether the agent is thinking, stuck, or acting. The model matters, but the harness decides whether the model can do reliable work.

For LingTai, the important comparison is not “which project has the cleverest ReAct loop.” LingTai is already a different shape: an always-on **agent network** with durable memory, mail/chat wakeup, avatars, daemons, MCP/addon ownership, and lifecycle control. The right question is: what should such a network borrow from the best single-agent harnesses, framework harnesses, and sandbox substrates?

## Bottom line

The ecosystem clusters around five dominant ideas:

1. **Coding workbenches** make tool use visible: shell, file edits, patches, approvals, and resumable sessions.
2. **IDE agents** win by living next to code and keeping context/approval friction low.
3. **Graph and workflow frameworks** make long plans deterministic through typed state, checkpoints, and edges.
4. **SDK/framework harnesses** are converging on strict tools, typed outputs, tracing, evals, and handoffs.
5. **Sandbox substrates** remind us that execution policy is not an implementation detail; it is part of the harness.

LingTai’s differentiation is still strong: it is not just a loop. It is a network runtime. But the study suggests several concrete improvements.

## Recommended improvements for LingTai

### P0 — Tool-result commit ledger

Make each tool call explicitly move through states: **proposed → approved → executing → side-effect committed → model-visible → durable-log-visible**. This would make LingTai stronger than typical SDKs and reduce ambiguity around orphaned, retried, or healed tool calls.

### P0 — Daemon/process reattachment

Adopt a run-artifact contract for every daemon/backend: parent PID, child PID, workspace, transcript, report path, last heartbeat, and recovery action. On restart, LingTai should be able to reattach, finalize, or explain instead of leaving a task in an unknown state.

### P1 — Span-style observability

Borrow the tracing shape now common in modern agent SDKs: turn → model call → tool calls → MCP calls → daemon tasks. Render it in the portal/TUI so humans can see why an agent is slow or stuck.

### P1 — Graph/checkpoint option

Keep LingTai’s always-on loop, but offer a graph/checkpoint primitive for workflows that need atomic multi-step state. LangGraph-style checkpointing is not a replacement for LingTai; it is a useful mode inside it.

### P1 — Stricter tool schema ergonomics

Expose typed tool metadata: argument schema, side-effect class, timeout, approval policy, retry policy, and error formatter. The more tools LingTai owns, the more tool contracts should be visible as data.

### P1 — Sandbox policy objects

Make sandbox/approval policy first-class per tool and backend. Claude Code, Codex, SWE-agent, and E2B/Daytona all show that filesystem, shell, network, and approval policy shape the agent’s behavior.

### P1 — Cheaper handoff primitive

LingTai avatars are durable and powerful. Sometimes we also need a cheap in-process handoff/router primitive for specialist routing when persistence is unnecessary.

## Taxonomy: how to read the field

- **Agent frameworks** (10): Frameworks that expose agents as programmable objects with tools, memory, callbacks, or typed outputs.
- **Code workbench agents** (7): Terminal agents optimized for repository editing, patches, shell commands, and approval loops.
- **IDE-native agents** (6): Agents embedded in editors, where context and approval sit next to code.
- **Autonomous SWE platforms** (5): Long-running systems that own a workspace and attempt end-to-end software tasks.
- **Multi-agent frameworks** (5): Role/team based systems where coordination is the product surface.
- **Workflow runtimes** (3): Graph/event runtimes that make agent steps durable and composable.
- **Benchmark coding harnesses** (2): Small, reproducible loops built to evaluate coding agents.
- **Commercial closed agents** (2): Closed products whose public materials still reveal product patterns.
- **RAG/tool frameworks** (2): Retrieval and pipeline stacks growing agentic tool-routing layers.
- **Review/issue-to-PR agents** (2): Narrow repository agents for reviews, issue triage, and PR generation.
- **Agent lineage / primitives** (1): Minimal task-loop ancestors and primitives.
- **Local runtimes** (1): Local extension/tool runtimes for personal workstations.
- **Memory-first runtimes** (1): Systems where explicit memory is the core runtime object.
- **Prompt/programming frameworks** (1): Systems that optimize prompts/agent programs as software.
- **Sandbox substrates** (1): Execution substrates that make tool use safe and reproducible.
- **Uncertain/small harnesses** (1): Small or lower-confidence packages kept to map the boundary of the term.

## 50-harness matrix

| # | Harness | Shape | Evidence | Lesson for LingTai |
|---:|---|---|---|---|
| 1 | Claude Code | Coding CLI / closed agent | Closed/public evidence | Treat the agent loop as a product surface: approvals, compaction, resume, and tool semantics are visible, not hidden. |
| 2 | [OpenAI Codex CLI](https://github.com/openai/codex) | Coding CLI | Public/source-grounded | Sandbox and approval modes should be first-class runtime policy, not prompt folklore. |
| 3 | [OpenCode](https://github.com/sst/opencode) | Coding CLI | Public/source-grounded | Provider-agnostic terminal agents need strict session state and model/tool abstraction boundaries. |
| 4 | [OpenHands](https://github.com/All-Hands-AI/OpenHands) | Autonomous SWE platform | Public/source-grounded | A durable event stream plus workspace sandbox makes long-running SWE work inspectable and recoverable. |
| 5 | [Aider](https://github.com/Aider-AI/aider) | Coding CLI | Public/source-grounded | Git-native editing keeps coding agents honest: every change is a diff with context. |
| 6 | [Continue](https://github.com/continuedev/continue) | IDE/code assistant platform | Public/source-grounded | IDE-native agents win when context assembly is explicit and user-editable. |
| 7 | [Cline](https://github.com/cline/cline) | IDE coding agent | Public/source-grounded | A simple plan-act-observe loop becomes powerful when every tool call is user-visible. |
| 8 | [Roo Code](https://github.com/RooCodeInc/Roo-Code) | IDE coding agent | Public/source-grounded | Modes are a cheap way to express specialist behavior without spawning durable agents. |
| 9 | [Goose](https://github.com/block/goose) | Local agent runtime | Public/source-grounded | Extension-based local runtimes make tools composable while keeping execution near the user. |
| 10 | [OpenClaw](https://github.com/openclaw-ai/openclaw) | Automation/agent-loop framework | Public/source-grounded | Explicit loop documentation is itself a product feature; users need to know what repeats. |
| 11 | [OpenHarness](https://github.com/thu-nmrc/OpenHarness) | Long-running autonomous harness | Public/source-grounded | Long-running autonomy needs a run artifact, not only a transcript. |
| 12 | [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Self-improving agent | Public/source-grounded | Self-improvement requires memory and skill boundaries that prevent accidental drift. |
| 13 | [Pi](https://github.com/earendil-works/pi) | Minimal coding harness | Public/source-grounded | Minimal harnesses reveal the irreducible loop: assemble context, call model, apply tools, repeat. |
| 14 | [Oh My Pi](https://github.com/can1357/oh-my-pi) | Terminal coding harness | Public/source-grounded | Persistent execution kernels are useful, but must be fenced by clear turn/tool budgets. |
| 15 | harness-agent | Small/uncertain harness package | Public/source uncertain | Small packages are useful negative space: naming a harness is not the same as owning a loop. |
| 16 | [LangGraph](https://github.com/langchain-ai/langgraph) | Graph agent framework | Public/source-grounded | Checkpointed graphs are the strongest pattern for deterministic multi-step agent workflows. |
| 17 | [LangChain Agents](https://github.com/langchain-ai/langchain) | Agent framework | Public/source-grounded | Tool schemas, callbacks, and intermediate steps should be inspectable from the framework boundary. |
| 18 | [CrewAI](https://github.com/crewAIInc/crewAI) | Multi-agent framework | Public/source-grounded | Role-based teams make delegation legible, but they need durable accountability to avoid theater. |
| 19 | [AutoGen](https://github.com/microsoft/autogen) | Multi-agent framework | Public/source-grounded | Conversation-as-orchestration is flexible; termination and handoff rules are the hard part. |
| 20 | [Semantic Kernel Agents](https://github.com/microsoft/semantic-kernel) | Enterprise agent framework | Public/source-grounded | Enterprise harnesses need typed functions, planners, and policy surfaces that non-research users can trust. |
| 21 | [LlamaIndex Agents](https://github.com/run-llama/llama_index) | RAG/tool agent framework | Public/source-grounded | RAG-centric agents prove that retrieval and tool use should share one traceable context contract. |
| 22 | [PydanticAI](https://github.com/pydantic/pydantic-ai) | Typed agent framework | Public/source-grounded | Typed outputs and dependencies reduce ambiguity at the model/framework boundary. |
| 23 | [Agno](https://github.com/agno-agi/agno) | Agent/team framework | Public/source-grounded | Teams, memory, and tools should be configured as data, then traced as execution. |
| 24 | [smolagents](https://github.com/huggingface/smolagents) | Lightweight code/tool agents | Public/source-grounded | Code-as-action is powerful when the sandbox and imports are constrained by design. |
| 25 | [DSPy agents](https://github.com/stanfordnlp/dspy) | Prompt/programming framework | Public/source-grounded | Agent behavior can be optimized as a program, not only hand-written as a prompt. |
| 26 | [AutoGPT Forge](https://github.com/Significant-Gravitas/AutoGPT) | Autonomous agent platform | Public/source-grounded | Autonomy platforms need capability registries and budgets before they need more prompts. |
| 27 | [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | Software-company multi-agent | Public/source-grounded | Structured artifacts can make multi-agent collaboration less chatty and more reviewable. |
| 28 | [CAMEL-AI](https://github.com/camel-ai/camel) | Communicative multi-agent framework | Public/source-grounded | Society-style simulation is useful for research, but production needs ownership and state boundaries. |
| 29 | [Letta / MemGPT](https://github.com/letta-ai/letta) | Stateful memory agent server | Public/source-grounded | Memory must be an explicit runtime object with edit, recall, and persistence semantics. |
| 30 | [Mastra](https://github.com/mastra-ai/mastra) | TypeScript agent framework | Public/source-grounded | Modern app-agent frameworks treat agents, workflows, evals, and observability as one developer stack. |
| 31 | [VoltAgent](https://github.com/VoltAgent/voltagent) | TypeScript agent framework | Public/source-grounded | Developer-friendly dashboards matter because agent failure is usually a trace-reading problem. |
| 32 | [Motia](https://github.com/MotiaDev/motia) | Event-driven workflow framework | Public/source-grounded | Event-driven workflows are a good substrate for agent steps that must outlive one request. |
| 33 | [Haystack Agents](https://github.com/deepset-ai/haystack) | Pipeline/RAG agent framework | Public/source-grounded | Pipelines and agents should converge when retrieval, routing, and tool use interact. |
| 34 | [SWE-agent](https://github.com/SWE-agent/SWE-agent) | SWE-bench coding harness | Public/source-grounded | Bench harnesses show the value of reproducible run directories and environment specs. |
| 35 | [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent) | Lightweight SWE harness | Public/source-grounded | A small, explicit loop is easier to benchmark than a giant framework. |
| 36 | Devin | Commercial SWE agent | Closed/public evidence | Closed agents still teach product lessons: persistent workspace, async work, and human handoff. |
| 37 | Factory Droid | Commercial SWE agent | Closed/public evidence | Commercial SWE agents emphasize end-to-end job ownership rather than framework APIs. |
| 38 | [Qodo PR-Agent](https://github.com/qodo-ai/pr-agent) | Code review/change agent | Public/source-grounded | Narrow review agents win by constraining context, outputs, and repository side effects. |
| 39 | [Sweep AI](https://github.com/sweepai/sweep) | Issue-to-PR agent | Public/source-grounded | Issue-to-PR agents need clear escalation when repository reality diverges from the issue text. |
| 40 | [Mentat](https://github.com/AbanteAI/mentat) | Command-line coding agent | Public/source-grounded | Conversation plus patching remains a durable baseline for local coding agents. |
| 41 | Cursor Agent | IDE-native commercial agent | Closed/public evidence | IDE-native commercial agents win through frictionless context and editor-integrated approval. |
| 42 | Windsurf / Cascade | IDE-native commercial agent | Closed/public evidence | Cascade-style products show the value of continuous project context, not one-off prompts. |
| 43 | GitHub Copilot Agent | IDE/GitHub coding agent | Closed/public evidence | GitHub-native agents benefit from living where issues, branches, and PRs already live. |
| 44 | [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) | SDK / AgentKit | Public/source-grounded | Tracing, handoffs, and typed tools are becoming the expected SDK contract. |
| 45 | [BeeAI Framework](https://github.com/i-am-bee/beeai-framework) | Agent framework | Public/source-grounded | Frameworks increasingly bundle memory, tools, and observability instead of treating them as add-ons. |
| 46 | [ControlFlow](https://github.com/PrefectHQ/ControlFlow) | Workflow/agent framework | Public/source-grounded | Task graphs with typed results make agent work composable in ordinary software systems. |
| 47 | [PocketFlow](https://github.com/The-Pocket/PocketFlow) | Minimal workflow framework | Public/source-grounded | Minimal node/action abstractions are useful when the goal is teachability and portability. |
| 48 | [E2B / Daytona](https://github.com/e2b-dev/E2B) | Sandbox substrate | Public/source-grounded | The sandbox is part of the harness: file system, network, process, and snapshot policy shape behavior. |
| 49 | [SuperAGI](https://github.com/TransformerOptimus/SuperAGI) | Autonomous agent platform | Public/source-grounded | Older autonomous platforms remind us that more tools without tighter state semantics becomes chaos. |
| 50 | [BabyAGI / functionz](https://github.com/yoheinakajima/babyagi) | Task-loop lineage | Public/source-grounded | The original task loop is still visible under modern agents: create tasks, execute, reprioritize, remember. |

## What this means for LingTai

LingTai should not copy a single harness wholesale. The interesting direction is synthesis:

- from **Claude Code / Codex / Aider / Cline**, take product-grade approval loops, resumable sessions, sandbox modes, and patch discipline;
- from **OpenHands / SWE-agent**, take reproducible run directories, event streams, and workspace recovery;
- from **LangGraph / ControlFlow / PocketFlow / Motia**, take graph/checkpoint modes for deterministic workflows;
- from **OpenAI Agents SDK / PydanticAI / Mastra / VoltAgent**, take strict typed tools, tracing, evals, and developer dashboards;
- from **Letta**, take memory as a real runtime object;
- from **E2B / Daytona**, take sandbox policy as a product-level contract.

The field is moving toward stricter contracts around tools and traces. LingTai already has the rarer piece: agents that can live, sleep, wake, remember, spawn durable peers, and coordinate through channels. The next step is to make every part of that life cycle as inspectable and replayable as the best coding harnesses make a single patch.

## Method note

The underlying study inspected 50 systems with source-first evidence where available. Open-source projects were checked against public repositories. Closed commercial systems such as Claude Code, Devin, Cursor, Windsurf/Cascade, and GitHub Copilot Agent are marked lower-confidence because their internal loops are not fully public; they are included for product and interface lessons, not as source-level claims.
