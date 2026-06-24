# 仅在强依赖场景下显式指向 `/setup-matt-pocock-skills`

Engineering skill 依赖每个仓库的配置（issue tracker、triage 标签体系、领域文档布局），这些配置由 `/setup-matt-pocock-skills` 初始化。有些 skill 没有该配置就无法正常运行——它们必须发布到特定的 issue tracker 或应用特定的标签字符串。而另一些 skill 只是用它来优化输出效果（词汇表、ADR 感知），即使没有也能降级运行。

我们将这些分为**强依赖（hard-dependency）**和**弱依赖（soft-dependency）**两类 skill：

- **强依赖**（`to-issues`、`to-prd`、`triage`）——包含明确的一句话提示："……应该已经提供给你了——如果没有，请运行 `/setup-matt-pocock-skills`。"没有该映射时，输出会是**错误的**，而不仅仅是模糊。
- **弱依赖**（`diagnose`、`tdd`、`improve-codebase-architecture`、`zoom-out`）——仅在描述性文字中提及"项目的领域术语表"和"你所修改区域的 ADR"。如果文档不存在，skill 仍然可以工作，只是输出不够精准。

这种分类让弱依赖 skill 保持 token 精简，避免把 setup 提示像搬运货物一样塞到不需要它的地方。
