# LingTai 新手用户手册

这是一份给第一次接触 LingTai 的用户看的入门手册。目标不是讲完所有内部机制，而是帮你完成三件事：安装 LingTai、连上模型、交给它第一个真实任务。

LingTai 仍在快速迭代。安装命令、插件字段和模型名称请以官网、仓库 README、`/setup` 和 `/addon` 页面显示为准。

## 1. LingTai 是什么

你可以把 LingTai 理解成一个运行在自己电脑上的 AI 工作台。它不是普通网页聊天框，而是把一个长期 AI agent 放进项目目录里，让它能持续使用文件、记忆、知识、技能和工具。

LingTai 适合：

- 长期项目：写作、研究、开发、资料整理、课程或内容生产。
- 多资料工作流：让 agent 阅读文件、总结材料、维护项目背景。
- 多工具协作：按需使用网页搜索、图片理解、内部邮件、daemon、avatar、skills、knowledge、pad 等能力。
- 愿意学习少量命令的用户：常用 slash command 学会后，日常使用会顺很多。

如果你只是偶尔问一句简单问题，普通聊天网站可能更轻便；如果你希望 AI 长期理解一个项目，LingTai 更合适。

## 2. 安装与获取入口

### macOS / Linux / WSL2

官方普通安装入口：

```sh
curl -fsSL https://lingtai.ai/install.sh | bash
```

安装完成后，在终端运行：

```sh
lingtai-tui
```

### Windows PowerShell

Windows 原生安装入口：

```powershell
irm https://lingtai.ai/install.ps1 | iex
```

如果你更熟悉 Linux 环境，也可以在 Windows 上使用 WSL2，然后按 macOS / Linux 的方式安装。

### 其他参考入口

- 官网：<https://lingtai.ai>
- GitHub 组织：<https://github.com/Lingtai-AI>
- TUI 仓库：<https://github.com/Lingtai-AI/lingtai>
- Kernel 仓库：<https://github.com/Lingtai-AI/lingtai-kernel>
- Homebrew tap：<https://github.com/huangzesen/homebrew-lingtai>
- Gitee 镜像：<https://gitee.com/huangzesen1997/lingtai>

如果这些入口的说明和本手册不一致，以官网和对应仓库最新说明为准。

## 3. 第一次启动

建议先准备一个项目目录。LingTai 通常围绕项目工作，项目中的 `.lingtai/` 会保存 agent 状态、知识、技能、配置等资料。

常见流程：

1. 打开终端或 PowerShell。
2. 进入你的项目目录。
3. 运行 `lingtai-tui`。
4. 按界面提示创建或选择项目。
5. 第一次进入后先配置模型和凭证。

常用检查命令：

```text
/projects
/kanban
/doctor
```

`/projects` 用来看已有项目，`/kanban` 用来看当前 agent 状态，`/doctor` 用来检查模型、API key 和网络连接。

## 4. 配置 API Key 与模型

LingTai 需要至少一个大模型服务商的凭证才能工作。你通常需要准备：

- provider：模型服务商。
- model：模型名称。
- API key：访问服务商 API 的密钥。

在 LingTai 里输入：

```text
/setup
```

按向导配置服务商、模型和能力开关。凭证状态可以用：

```text
/login
```

如果模型请求失败，先运行：

```text
/doctor
```

常见问题包括 API key 填错、余额不足、模型名不可用、网络或代理不通。

切换模型或预设时，可以先查看：

```text
/presets
```

再按当前界面提示切换。不同机器可用的模型取决于你配置了哪些账号和 API key，不要把别人机器上的预设当成默认配置。

## 5. 基础用法

你可以像普通聊天一样直接描述任务：

```text
请阅读这个项目的 README，帮我用五句话说明它是做什么的，并列出我下一步应该看的文件。
```

也可以把任务拆得更清楚：

```text
请先搜索项目里和安装相关的文件，不要修改文件。找到后告诉我入口、关键命令和你不确定的地方。
```

给 LingTai 下任务时，尽量说明：

- 目标：你希望得到什么结果。
- 范围：要看哪些文件、不要碰哪些文件。
- 格式：要列表、表格、Markdown、代码还是摘要。
- 约束：是否允许改文件、是否需要先确认、是否要运行测试。

## 6. 常用 slash commands

| 命令 | 用途 |
| --- | --- |
| `/setup` | 配置 agent、模型、能力和运行参数。 |
| `/login` | 查看或更新凭证认证状态。 |
| `/doctor` | 检查 API key、模型和网络连接。 |
| `/projects` | 浏览已注册项目。 |
| `/kanban` | 查看 agent 状态、模型、能力和上下文使用情况。 |
| `/presets` | 查看可用预设。 |
| `/skills` | 浏览可用技能。 |
| `/knowledge` | 浏览当前 agent 的长期知识。 |
| `/system` | 查看 agent 系统文件。 |
| `/mailbox` | 查看内部邮件和相关消息。 |
| `/addon` | 配置 IMAP、Telegram、飞书、微信等扩展桥接。 |
| `/insights` | 让 agent 给出当前任务的简短观察。 |
| `/clear` | 清空当前对话上下文，但保留身份和长期资料。 |
| `/molt` | 保存并压缩长上下文后继续工作。 |
| `/refresh` | 重启并从磁盘重新加载配置。 |
| `/cpr` | 唤醒挂起、停止或异常退出的 agent。 |
| `/sleep` | 让当前 agent 休眠。 |
| `/suspend` | 挂起当前 agent。 |
| `/quit` | 退出 TUI。 |

危险命令要谨慎使用，尤其是会清除项目状态或删除 `.lingtai/` 的命令。排错时优先用 `/doctor`、`/refresh` 和 `/cpr`。

## 7. 内置能力速览

### 文件

LingTai 可以读取、搜索和修改项目文件。第一次让它改文件时，建议明确说“先说明计划，再修改”。

### 网页搜索

在模型和工具允许时，LingTai 可以查网页和近期资料。涉及法律、医疗、营养、财务等高风险内容时，要看原始来源并人工复核。

### 图片理解

支持视觉能力的模型可以分析截图、图表和图片。上传前请遮挡身份证、病历、密钥、聊天记录等隐私信息。

### daemon

daemon 是临时派出去处理子任务的后台工作者，适合并行搜索、批量整理、生成草稿。它通常做完后返回结果，不适合承担长期角色。

### avatar

avatar 是更长期、更独立的 agent，可以拥有自己的目录、记忆和工作历史，适合培养成某个项目或领域的长期助手。

### 内部邮件与外部消息

agent 之间可以通过内部邮件汇报。通过 `/addon` 还可以接入 IMAP 邮箱、Telegram、飞书、微信等外部渠道。配置这些插件前，先读对应 README，不要猜字段名。

### skills

skills 是可复用流程。比如“整理访谈记录”“审阅 PR”“分析饮食日志”都可以沉淀成 skill，之后让 agent 按固定流程执行。

### knowledge

knowledge 是当前 agent 的长期知识，用来保存项目背景、长期决策、重要路径和偏好。

### pad

pad 可以理解成 agent 的随身便签，适合放当前任务计划、重要约束和需要持续注意的事项。

### molt

对话太长时，`/molt` 会保存并整理上下文，再让 agent 轻装继续。长任务中这比无限堆聊天记录更稳定。

## 8. 十分钟上手流程

1. 进入项目目录并运行 `lingtai-tui`。
2. 输入 `/doctor`，确认模型、API key 和网络可用。
3. 输入 `/setup`，按需调整服务商、模型和能力。
4. 输入 `/kanban`，查看当前 agent 状态。
5. 让 agent 总结项目 README 或一个你指定的文件。
6. 输入 `/skills`，看看当前有哪些可用流程。
7. 输入 `/knowledge`，看看是否已有项目背景。
8. 给一个小而真实的任务，例如生成一段项目介绍、整理一份材料、检查一个配置文件。
9. 如果状态不对，先 `/refresh`；如果 agent 停了，再 `/cpr`。
10. 任务结束后，让 agent 总结本次做了什么、还有哪些待确认事项。

## 9. 常见问题

### LingTai 打不开

先确认安装命令是否完整执行、`lingtai-tui` 是否在 PATH 中、当前终端是否能访问安装目录。Windows 用户确认自己使用的是 PowerShell 原生安装还是 WSL2 安装。

### API 报错

先运行 `/doctor`。重点检查 API key、余额、模型名称、服务商权限、代理和网络。

### 模型切换后没生效

用 `/presets` 查看可用预设，用 `/kanban` 查看当前 agent 实际配置。必要时执行 `/refresh` 重新加载配置。

### agent 卡住

先等一会儿，复杂任务可能正在跑工具。之后依次尝试 `/insights`、`/refresh`、`/cpr`。不要一上来删除 `.lingtai/`。

### 插件不工作

用 `/addon` 查看配置入口，读对应插件 README。确认 token、app id、secret、邮箱授权码等仍有效，并在修改后刷新 agent。

## 10. 安全与隐私

- API key 不要发到群聊、截图或公开仓库。
- 邮箱、微信、Telegram、飞书等插件可能读取或发送真实消息，开启前确认权限范围。
- 医学、营养、法律、财务等专业内容必须由专业人士复核。
- 上传图片或文件前先遮挡个人隐私和商业机密。
- `.lingtai/` 里可能保存长期记忆、技能和项目状态，删除前先备份并确认影响。

## 11. 下一步

熟悉本手册后，建议继续看：

- 安装参考：<https://lingtai.ai/help/reference/installation/skill.md>
- 官网教程：<https://lingtai.ai/tutorial>
- 项目与发布信息：<https://lingtai.ai/releases>

你不需要一次学完所有能力。先掌握 `/doctor`、`/setup`、`/kanban`、`/skills`、`/knowledge`、`/refresh`、`/cpr`，就能处理大多数入门场景。
