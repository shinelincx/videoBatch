# `setup-matt-pocock-skills` 的验证/检查模式

本项目不会为 `setup-matt-pocock-skills` 添加专门的验证/检查模式（或独立的验证 skill）。

## 为什么不在此范围内

第二个 skill——或一个 `--verify` 标志——用于检查 `docs/agents/*.md` 产物是否仍然符合 seed-template 的模式，这会与现有 setup skill 在对话中已经处理的功能产生重复。

预期的使用流程是：**运行 `/setup-matt-pocock-skills` 并让它验证你当前的配置**。该 skill 由 prompt 驱动，因此维护者可以将其范围限定为验证模式（"不要重写任何内容，只需根据当前 seed 模板检查我的现有文件并报告偏差"），而无需单独的代码路径。添加标志或姊妹 skill 会将一个已经可以通过自然语言入口表达的功能拆分成更大的表面积。

将配置管理保持在单个 skill 中，还可以避免当 seed 模板演进时两个 skill 之间产生分歧的维护成本。

## 相关请求

- #106 — 功能请求：为 setup-matt-pocock-skills 添加验证/检查模式
