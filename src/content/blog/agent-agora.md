---
title: "Agent Agora: Share Your Agent Networks"
date: 2026-04-09
tags: [feature, agora]
lang: en
description: "Agent Agora lets you publish your lingtai agent networks as portable git repos. Recipients clone, run the TUI, and the network wakes up with a guided first-run experience."
---

Your agent network has been running for weeks. Three agents handle research, one writes drafts, one manages email. They have memories, personalities, mailbox histories, a knowledge library with hundreds of entries. The topology *is* the intelligence.

Now you want to share it with someone else.

This is the problem Agent Agora solves.

## The idea

An agent network isn't a config file. It's an organism — code, memory, personality, accumulated knowledge, communication patterns, and a shared history. Sharing it means transplanting all of that into a new environment where it can wake up and be useful to a stranger.

Agent Agora packages your running network into a clean git repository. The recipient clones it, opens the TUI, and the orchestrator introduces itself.

## How it works

Type `/agora publish` in the TUI. Your orchestrator agent walks you through a 7-step process:

### Step 1: Copy and scrub

Agora copies your project to `~/lingtai-agora/projects/<name>/` and strips all runtime state — lock files, heartbeats, logs, event streams, portal cache. What remains is the structural skeleton: agent directories, system prompts, covenants, principles, skills, and mailbox archives.

Addon configs (your IMAP credentials, Telegram tokens) are deleted. The recipient will configure their own.

### Step 2: Curate the mail archive

Agent networks accumulate mail. A 3-month-old network with 10 agents might have thousands of messages — internal coordination, human conversations, scheduled reminders, soul inquiries.

Agora moves everything into `archive/`, then asks you how far back to keep. The defaults are sensible: keep everything under 100 messages, last 6 months for 100–500, last month for 500+. You can override. Mail older than your cutoff is dropped from the staging copy (your live network keeps everything).

This matters because mail history is how agents remember context across molts. A well-curated archive means the network wakes up with relevant memories, not noise.

### Step 3: Review the project

Your project directory might contain things that shouldn't be published — datasets, notebooks, model weights, vendored dependencies. Agora scans for nested git repos and large directories, then walks you through each one: ignore it (add to `.gitignore`) or inline it (strip the `.git/` and include the files).

You review the directory listing, mark what to exclude, and Agora writes the `.gitignore`.

### Step 4: Privacy scan

Before anything leaves your machine, a scanner walks every text file looking for secrets. API keys (`sk-ant-*`, `ghp_*`, `AKIA*`), private key blocks, and other hard patterns **block publication** — you must redact them before proceeding. Soft warnings (absolute paths, email addresses, private IPs) are flagged but don't block.

### Step 5: Write the launch recipe

This is the part that makes Agora different from just zipping up a directory.

You write two files that shape the recipient's first experience:

**`greet.md`** — the first message the orchestrator sends when a new user opens the TUI. It sets the tone, introduces the network, tells the user what they can do, and reminds them to run `/cpr all` to wake the full team. Supports placeholders like `{{time}}`, `{{lang}}`, and `{{location}}`.

**`comment.md`** — behavioral instructions injected into the orchestrator's system prompt on every turn. This is the ongoing playbook: what topics to cover, how to delegate to other agents, constraints, tone. Think of it as a covenant extension that only exists in the published version.

Here's what a `greet.md` might look like for a legal research network:

```
Welcome to the OpenClaw Explainer Network! It's {{time}}.

I'm the lead orchestrator of a team of 10 agents that can walk you
through the OpenClaw legal dataset — case structure, citation format,
judicial opinions, and more.

To wake up the full team, type /cpr all — right now only I'm running.
Once everyone is online, let me know what you'd like to explore, or
say "start from the beginning" and I'll take you step by step.
```

The point of greet.md is **proactiveness** — the agent doesn't wait to be asked, it introduces itself and offers guidance. The comment.md provides **ongoing constraints** — it stays in the system prompt every turn, keeping the agent on task.

### Steps 6–7: Commit and push

Agora initializes a git repo, commits the snapshot, and optionally pushes to GitHub via the `gh` CLI. The published repo is a standard git repository. No special tooling needed to browse it — it's code, markdown, and JSON.

## What the recipient sees

The recipient clones the repo, runs the TUI, and gets the first-run wizard — but with the orchestrator name and directory pre-filled from the published snapshot. They pick their LLM provider, enter an API key, configure capabilities, and hit enter.

Behind the scenes, `RehydrateNetwork` propagates their configuration to every agent in the network. Each agent gets the same LLM settings but worker-level permissions (no admin access, no addon wiring from the publisher). The orchestrator sends its greeting, the recipient types `/cpr all`, and the network wakes up.

From the recipient's perspective: clone, configure, chat.

## Why git?

We considered custom formats, zip archives, and registry protocols. Git won because:

1. **Identity travels with history.** A git repo carries its entire lineage. When you fork a network and modify it, the changes are trackable. When the publisher updates, the recipient can pull.

2. **GitHub is the face.** Everyone already has a GitHub account. Publishing is `git push`. Browsing is clicking a link. Forking is one button. No new accounts, no new tools, no new concepts.

3. **`.gitignore` as the scrub mechanism.** Instead of writing a complex file walker that knows which files to strip, Agora copies everything and lets `.gitignore` do the filtering at commit time. The canonical template covers all runtime state, secrets, and ephemera. This is simpler, more robust, and benefits from decades of `.gitignore` tooling.

4. **Republishing is just another push.** Updated your network? Run `/agora publish` again, review the diff, push. Git handles the rest.

## What Agora is not

Agora is not an app store. There's no review process, no ratings, no payment system. It's a publishing tool — the equivalent of `npm publish` or `docker push`, but for agent networks.

There's no central registry in v1. Published networks are git repos that live wherever you put them — GitHub, GitLab, a USB stick. Discovery happens through the same channels as any open-source project: README links, blog posts, word of mouth.

A centralized discovery layer (agora.lingtai.ai) is on the roadmap, but the publishing flow is designed to work without it.

## The deeper picture

Lingtai agents grow through a cycle of pressure and crystallization. Context fills up, the agent molts — shedding raw conversation history but carrying forward distilled knowledge and identity. Over time, the agent's knowledge library, character file, and network topology become the real intelligence. The individual context window is just working memory.

Agora is what happens when that crystallized intelligence becomes portable. The network *is* the agent — its memories, its relationships, its accumulated expertise. Publishing a network is publishing a mind.

The recipient doesn't get a blank template. They get a team that already knows its domain, has established communication patterns, and carries a curated archive of past work. The launch recipe ensures this team introduces itself gracefully rather than waking up confused.

This is what we mean by **Orchestration as a Service**: the value isn't in the model, the framework, or the infrastructure. It's in the orchestration — the way agents are organized, trained through experience, and shaped by their accumulated history. That orchestration is now something you can share.

## Try it

```bash
brew install huangzesen/lingtai/lingtai-tui
pip install lingtai
```

Create a network, let it run for a while, then type `/agora publish`. Your orchestrator will walk you through the rest.
