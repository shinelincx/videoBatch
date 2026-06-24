---
name: setup-matt-pocock-skills
description: 在 AGENTS.md/CLAUDE.md 中设置 `## Agent skills` 代码块，并创建 `docs/agents/` 目录，以便工程类 skill 了解此仓库的 Issue 追踪器（GitHub 或本地 Markdown）、分诊标签词表和领域文档布局。在首次使用 `to-issues`、`to-prd`、`triage`、`diagnose`、`tdd`、`improve-codebase-architecture` 或 `zoom-out` 之前运行——或者当这些 skill 缺少 Issue 追踪器、分诊标签或领域文档上下文时运行。
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

搭建每个仓库的配置，供工程类 skill 使用：

- **Issue 追踪器**——Issue 存储在哪里（默认 GitHub；本地 Markdown 也开箱即用支持）
- **分诊标签**——五种标准分诊角色使用的标签字符串
- **领域文档**——`CONTEXT.md` 和 ADR 的位置，以及消费它们的规则

这是一个由提示驱动的 skill，不是确定性脚本。先探索，展示发现，与用户确认，然后写入。

## 流程

### 1. 探索

查看当前仓库，了解其初始状态。阅读已有的内容；不要假设：

- `git remote -v` 和 `.git/config`——这是 GitHub 仓库吗？是哪一个？
- 仓库根目录的 `AGENTS.md` 和 `CLAUDE.md`——是否存在？其中是否已有 `## Agent skills` 部分？
- 仓库根目录的 `CONTEXT.md` 和 `CONTEXT-MAP.md`
- `docs/adr/` 和任何 `src/*/docs/adr/` 目录
- `docs/agents/`——此 skill 之前的输出是否已存在？
- `.scratch/`——本地 Markdown Issue 追踪器约定已被使用的标志

### 2. 展示发现并询问

总结已存在和缺失的内容。然后逐一引导用户完成三个决策**每次一个**——展示一个部分，获取用户回答，再继续下一个。不要一次性全部抛出。

假设用户不了解这些术语的含义。每个部分以简短说明开头（它是什么、为什么这些 skill 需要它、选择不同会有什么变化）。然后展示选项和默认值。

**A 部分 — Issue 追踪器。**

> 说明："Issue 追踪器"是此仓库 Issue 存储的地方。`to-issues`、`triage`、`to-prd`、`qa` 等 skill 会读写它——它们需要知道是调用 `gh issue create`、在 `.scratch/` 下写 Markdown 文件，还是遵循你描述的其他工作流。选择你实际跟踪此仓库工作的地方。

默认姿态：这些 skill 是为 GitHub 设计的。如果 `git remote` 指向 GitHub，提议使用它。如果 `git remote` 指向 GitLab（`gitlab.com` 或自托管），提议 GitLab。否则（或用户偏好不同），提供：

- **GitHub**——Issue 存储在仓库的 GitHub Issues（使用 `gh` CLI）
- **GitLab**——Issue 存储在仓库的 GitLab Issues（使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI）
- **本地 Markdown**——Issue 以文件形式存储在此仓库的 `.scratch/<feature>/` 下（适合个人项目或没有远程的仓库）
- **其他**（Jira、Linear 等）——让用户用一段话描述工作流；skill 将其作为自由格式文本记录

**B 部分 — 分诊标签词表。**

> 说明：当 `triage` skill 处理传入的 Issue 时，它会通过状态机移动——需要评估、等待报告者、可供离线 agent 处理、可供人类处理、或不会修复。为此，它需要应用与你*实际配置*匹配的标签（或 Issue 追踪器中的等价物）。如果你的仓库使用不同的标签名称（例如 `bug:triage` 而不是 `needs-triage`），在此映射以便 skill 应用正确的标签而不是创建重复。

五种标准角色：

- `needs-triage`——维护者需要评估
- `needs-info`——等待报告者
- `ready-for-agent`——规格完整，可离线处理（agent 可以在无需人类上下文的情况下接手）
- `ready-for-human`——需要人类实现
- `wontfix`——不会被处理

默认：每个角色的字符串等于其名称。询问用户是否要覆盖任何项。如果 Issue 追踪器没有现有标签，使用默认值即可。

**C 部分 — 领域文档。**

> 说明：某些 skill（`improve-codebase-architecture`、`diagnose`、`tdd`）读取 `CONTEXT.md` 文件来学习项目的领域语言，以及 `docs/adr/` 了解过去的架构决策。它们需要知道仓库是单一全局上下文还是多个上下文（例如前后端分离的 monorepo），以便在正确的位置查找。

确认布局：

- **单上下文**——仓库根目录一个 `CONTEXT.md` + `docs/adr/`。大多数仓库如此。
- **多上下文**——根目录 `CONTEXT-MAP.md` 指向每个上下文的 `CONTEXT.md` 文件（通常是 monorepo）。

### 3. 确认与编辑

向用户展示草稿：

- 要添加到 `CLAUDE.md` / `AGENTS.md` 的 `## Agent skills` 代码块（见步骤 4 的选择规则）
- `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` 的内容

在写入之前让用户编辑。

### 4. 写入

**选择要编辑的文件：**

- 如果存在 `CLAUDE.md`，编辑它。
- 否则如果存在 `AGENTS.md`，编辑它。
- 如果都不存在，询问用户创建哪一个——不要替用户选择。

永远不要在已有 `CLAUDE.md` 时创建 `AGENTS.md`（反之亦然）——始终编辑已有的那个。

如果所选文件中已有 `## Agent skills` 代码块，就地更新其内容而不是追加重复。不要覆盖用户对周围部分的编辑。

代码块：

```markdown
## Agent skills

### Issue tracker

[一行摘要：Issue 在哪里被追踪]。见 `docs/agents/issue-tracker.md`。

### Triage labels

[一行摘要：标签词表]。见 `docs/agents/triage-labels.md`。

### Domain docs

[一行摘要：布局——"single-context" 或 "multi-context"]。见 `docs/agents/domain.md`。
```

然后使用此 skill 文件夹中的种子模板作为起点，写入三个文档文件：

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub Issue 追踪器
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab Issue 追踪器
- [issue-tracker-local.md](./issue-tracker-local.md) — 本地 Markdown Issue 追踪器
- [triage-labels.md](./triage-labels.md) — 标签映射
- [domain.md](./domain.md) — 领域文档消费规则 + 布局

对于"其他" Issue 追踪器，根据用户描述从头编写 `docs/agents/issue-tracker.md`。

### 5. 完成

告知用户设置已完成，以及哪些工程类 skill 现在会读取这些文件。提及他们以后可以直接编辑 `docs/agents/*.md`——仅当需要切换 Issue 追踪器或从头开始时才需要重新运行此 skill。
