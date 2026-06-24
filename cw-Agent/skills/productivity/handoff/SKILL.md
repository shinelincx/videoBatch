---
name: handoff
description: 将当前对话压缩成交接文档，供其他 agent 接手继续工作。
argument-hint: "下一轮对话将用于什么目的？"
---

编写一份交接文档，总结当前对话内容，使新的 agent 能够继续工作。将其保存到由 `mktemp -t handoff-XXXXXX.md` 生成的路径（写入前先读取该文件确认内容）。

建议下一轮对话可能需要使用的 skill（如果有的话）。

不要重复其他 artifact（PRD、计划、ADR、issue、commit、diff 等）中已记录的内容。改为通过路径或 URL 引用它们。

如果用户传入了参数，将其视为对下一轮对话重点的描述，并据此调整文档内容。
