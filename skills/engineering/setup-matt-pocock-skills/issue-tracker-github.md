# Issue Tracker: GitHub

此仓库的 Issue 和 PRD 存储在 GitHub Issues 中。所有操作使用 `gh` CLI。

## 约定

- **创建 Issue**：`gh issue create --title "..." --body "..."`。多行内容使用 heredoc。
- **阅读 Issue**：`gh issue view <number> --comments`，使用 `jq` 过滤评论，同时获取标签。
- **列出 Issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，配合适当的 `--label` 和 `--state` 过滤。
- **评论 Issue**：`gh issue comment <number> --body "..."`
- **添加/移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭**：`gh issue close <number> --comment "..."`

从 `git remote -v` 推断仓库——在 clone 中运行时 `gh` 会自动完成。

## 当 skill 说"发布到 Issue 追踪器"时

创建一个 GitHub Issue。

## 当 skill 说"获取相关工单"时

运行 `gh issue view <number> --comments`。
