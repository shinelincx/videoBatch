# Issue Tracker: GitLab

此仓库的 Issue 和 PRD 存储在 GitLab Issues 中。所有操作使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI。

## 约定

- **创建 Issue**：`glab issue create --title "..." --description "..."`。多行描述使用 heredoc。传递 `--description -` 打开编辑器。
- **阅读 Issue**：`glab issue view <number> --comments`。使用 `-F json` 获取机器可读输出。
- **列出 Issue**：`glab issue list -F json`，配合适当的 `--label` 过滤。
- **评论 Issue**：`glab issue note <number> --message "..."`。GitLab 将评论称为 "notes"。
- **添加/移除标签**：`glab issue update <number> --label "..."` / `--unlabel "..."`。多个标签可用逗号分隔或重复标志。
- **关闭**：`glab issue close <number>`。`glab issue close` 不接受关闭评论，所以先用 `glab issue note <number> --message "..."` 发布解释，然后关闭。
- **Merge Request**：GitLab 将 PR 称为 "merge request"。使用 `glab mr create`、`glab mr view`、`glab mr note` 等——与 `gh pr ...` 形状相同，用 `mr` 替代 `pr`，用 `note`/`--message` 替代 `comment`/`--body`。

从 `git remote -v` 推断仓库——在 clone 中运行时 `glab` 会自动完成。

## 当 skill 说"发布到 Issue 追踪器"时

创建一个 GitLab Issue。

## 当 skill 说"获取相关工单"时

运行 `glab issue view <number> --comments`。
