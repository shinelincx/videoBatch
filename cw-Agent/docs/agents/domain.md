# Domain Docs（领域文档）

工程类 skill 在探索代码库时应如何消费此仓库的领域文档。

## 布局

**single-context**：仓库根目录一个 `CONTEXT.md` + `docs/adr/`。

## 探索前先阅读

- 仓库根目录的 **`CONTEXT.md`**，或者
- 如果存在，仓库根目录的 **`CONTEXT-MAP.md`**——它指向每个上下文一个 `CONTEXT.md`。阅读与主题相关的每一个。
- **`docs/adr/`**——阅读涉及你即将工作区域的 ADR。在多上下文仓库中，同时检查 `src/<context>/docs/adr/` 了解上下文范围的决策。

如果这些文件不存在，**静默继续**。不要标记它们的缺失；不要建议提前创建它们。生产 skill（`/grill-with-docs`）会在术语或决策真正确定时延迟创建它们。

## 文件结构

单上下文仓库（大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文特定决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用词汇表的词汇

当你的输出命名领域概念时（在 Issue 标题、重构提案、假设、测试名称中），使用 `CONTEXT.md` 中定义的术语。不要漂移为词汇表明确避免的同义词。

如果你需要的概念尚未在词汇表中，这是一个信号——要么你在发明项目不使用的语言（重新考虑），要么确实存在空白（为 `/grill-with-docs` 做记录）。

## 标记 ADR 冲突

如果你的输出与现有 ADR 矛盾，明确标注而不是静默覆盖：

> _与 ADR-0007（事件溯源 Order）矛盾——但值得重新打开，因为…_