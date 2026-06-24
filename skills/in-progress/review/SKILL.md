---
name: review
description: 审阅自某个固定点（commit、branch、tag 或 merge-base）以来的变更，从两个维度进行 —— Standards（代码是否符合仓库文档化编码规范？）和 Spec（代码是否符合原始 issue/PRD 的要求？）。两个审阅在并行子 agent 中运行，然后并排报告结果。当用户需要审阅某个 branch、PR、进行中的变更，或要求"审阅自 X 以来"时使用。
---

# Review

对用户提供的固定点与 `HEAD` 之间的 diff 进行双轴审阅：

- **Standards** —— 代码是否符合仓库文档化的编码规范？
- **Spec** —— 代码是否忠实实现了原始 issue / PRD / spec 的要求？

两个轴都作为**并行子 agent**运行，这样不会互相污染上下文，然后本 skill 会聚合它们的发现。

issue tracker 应该已经提供给你 —— 如果 `docs/agents/issue-tracker.md` 缺失，运行 `/setup-matt-pocock-skills`。

## 流程

### 1. 固定参考点

无论用户说什么作为固定点 —— commit SHA、branch 名称、tag、`main`、`HEAD~5` 等。不要带主观判断，直接传递。如果他们没指定，问："以什么为基准 —— 某个 branch、commit 还是 `main`？"在获取之前不要继续。

只捕获一次 diff 命令：`git diff <fixed-point>...HEAD`（三点语法，以便对比基于 merge-base）。同时通过 `git log <fixed-point>..HEAD --oneline` 记录 commit 列表。

### 2. 识别 spec 来源

按以下顺序查找原始 spec：

1. commit message 中的 issue 引用（`#123`、`Closes #45`、GitLab `!67` 等）—— 通过 `docs/agents/issue-tracker.md` 中的工作流获取。
2. 用户传入的路径。
3. `docs/`、`specs/` 或 `.scratch/` 下与 branch 名称或功能匹配的 PRD/spec 文件。
4. 如果都没找到，问用户 spec 在哪里。如果他们说没有，**Spec** 子 agent 会跳过并报告"未提供 spec"。

### 3. 识别 standards 来源

仓库中任何记录代码应如何编写的文档。常见位置：

- `CLAUDE.md`、`AGENTS.md`
- `CONTRIBUTING.md`
- `CONTEXT.md`、`CONTEXT-MAP.md`、每个上下文的 `CONTEXT.md` 文件
- `docs/adr/`（架构决策属于 standards）
- `.editorconfig`、`eslint.config.*`、`biome.json`、`prettier.config.*`、`tsconfig.json`（机器强制执行的 standards —— 记录但不要重复检查工具已检查的内容）
- 仓库根目录或 `docs/` 下的任何 `STYLE.md`、`STANDARDS.md`、`STYLEGUIDE.md` 或类似文件

收集文件列表。**Standards** 子 agent 会读取它们。

### 4. 并行启动两个子 agent

发送一条包含两个 `Agent` 工具调用的消息。两个都使用 `general-purpose` subagent。

**Standards 子 agent prompt** —— 包含：

- 完整的 diff 命令和 commit 列表。
- 步骤 3 中找到的 standards 来源文件列表。
- 简要说明："阅读 standards 文档。然后阅读 diff。报告 —— 按文件/hunk 划分 —— diff 中违反已记录 standards 的每处问题。引用 standard（文件 + 规则）。区分硬性违规和主观判断。跳过工具已检查的内容。400 字以内。"

**Spec 子 agent prompt** —— 包含：

- diff 命令和 commit 列表。
- spec 的路径或已获取的内容。
- 简要说明："阅读 spec。然后阅读 diff。报告：（a）spec 要求但缺失或部分实现的功能；（b）diff 中未被要求的行为（范围蔓延）；（c）看起来已实现但实现方式有问题的需求。每个发现引用 spec 行号。400 字以内。"

如果 spec 缺失，跳过 Spec 子 agent，并在最终报告中注明。

### 5. 聚合

在 `## Standards` 和 `## Spec` 标题下呈现两份报告，原样或轻微清理。不要**合并或重新排序**发现 —— 两个轴刻意分开，以便用户独立查看。

最后用一行总结：每个轴的发现总数，以及标记的最严重问题（如果有）。

## 为什么是双轴

一个变更可能通过一个轴但失败另一个：

- 代码符合每项 standard 但实现了错误的东西 → **Standards 通过，Spec 失败。**
- 代码恰好实现了 issue 要求但破坏了项目约定 → **Spec 通过，Standards 失败。**

分别报告可以防止一个轴掩盖另一个。
