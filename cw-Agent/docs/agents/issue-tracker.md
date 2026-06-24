# Issue Tracker: 本地 Markdown

此仓库的 Issue 和 PRD 存储在 `.scratch/` 中的 Markdown 文件里。

## 约定

- 每个功能一个目录：`.scratch/<feature-slug>/`
- PRD 位于 `.scratch/<feature-slug>/PRD.md`
- 实现 Issue 位于 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号
- 分诊状态记录在每个 Issue 文件顶部的 `Status:` 行（角色字符串见 `triage-labels.md`）
- 评论和对话历史追加到文件底部 `## Comments` 标题下

## 当 skill 说"发布到 Issue 追踪器"时

在 `.scratch/<feature-slug>/` 下创建新文件（如需要则创建目录）。

## 当 skill 说"获取相关工单"时

读取引用路径的文件。用户通常会直接传递路径或 Issue 编号。