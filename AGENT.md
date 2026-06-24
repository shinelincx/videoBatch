Skills 按类别组织在 `skills/` 目录下的各个 bucket 文件夹中：

- `engineering/` — 日常代码工作
- `productivity/` — 日常非代码工作流工具
- `misc/` — 保留但极少使用
- `personal/` — 与个人配置相关，不做推广
- `in-progress/` — 尚未准备好发布的草稿
- `deprecated/` — 不再使用

`engineering/`、`productivity/` 或 `misc/` 中的每个 skill 都必须在顶层 `README.md` 中有引用，并在 `.claude-plugin/plugin.json` 中有对应条目。`personal/`、`in-progress/` 和 `deprecated/` 中的 skill 不得出现在上述任何位置。

顶层 `README.md` 中的每个 skill 条目必须将 skill 名称链接到其 `SKILL.md`。

每个 bucket 文件夹都包含一个 `README.md`，列出该 bucket 中的所有 skill 及一行简介描述，skill 名称需链接到其 `SKILL.md`。

## 中文支持

- 文档输出：使用简体中文，保持专业术语、代码名称、技术命令等保留英文原文
- 代码注释：使用简体中文编写注释，变量名、函数名、类名等保持英文命名规范
- 表达风格：简洁明了，避免生硬翻译，确保中文用户易阅读、易理解

## Agent skills

### Issue tracker

Issue 存储在 `.scratch/` 目录下的 Markdown 文件中。见 `docs/agents/issue-tracker.md`。

### Triage labels

使用标准标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。见 `docs/agents/triage-labels.md`。

### Domain docs

single-context：仓库根目录一个 `CONTEXT.md` + `docs/adr/`。见 `docs/agents/domain.md`。
