---
name: scaffold-exercises
description: 创建练习目录结构，包含章节、练习题、解决方案和说明文档，并确保通过 lint 检查。适用于搭建练习框架、创建练习模板或设置新课程章节的场景。
---

# 搭建练习框架

创建练习目录结构，使其通过 `pnpm ai-hero-cli internal lint` 检查，然后使用 `git commit` 提交。

## 目录命名规范

- **章节**：`XX-section-name/`，位于 `exercises/` 下（如 `01-retrieval-skill-building`）
- **练习**：`XX.YY-exercise-name/`，位于对应章节下（如 `01.03-retrieval-with-bm25`）
- 章节编号 = `XX`，练习编号 = `XX.YY`
- 名称使用短横线分隔的小写格式（dash-case）

## 练习变体

每个练习至少需要以下一个子目录：

- `problem/` - 学生工作区，包含 TODO 任务
- `solution/` - 参考答案实现
- `explainer/` - 概念性讲解材料，不含 TODO

创建模板时，默认使用 `explainer/`，除非计划中有特别说明。

## 必需文件

每个子目录（`problem/`、`solution/`、`explainer/`）都需要一个 `readme.md`，要求：

- **不能为空**（必须有实际内容，哪怕只有一行标题也可以）
- 不能有失效链接

创建模板时，生成包含标题和简要说明的最小 readme：

```md
# 练习标题

简要描述内容
```

如果子目录包含代码文件，还需要一个 `main.ts`（至少 1 行内容）。但对于模板来说，仅有 readme 也是可以接受的。

## 工作流程

1. **解析计划** - 提取章节名称、练习名称和变体类型
2. **创建目录** - 使用 `mkdir -p` 创建每个路径
3. **创建 readme 模板** - 每个变体目录下创建一个包含标题的 `readme.md`
4. **运行 lint** - 执行 `pnpm ai-hero-cli internal lint` 进行验证
5. **修复错误** - 迭代修复直到 lint 通过

## Lint 规则汇总

Lint 检查（`pnpm ai-hero-cli internal lint`）会验证：

- 每个练习是否包含子目录（`problem/`、`solution/`、`explainer/`）
- 至少存在 `problem/`、`explainer/` 或 `explainer.1/` 之一
- 主要子目录中的 `readme.md` 是否存在且非空
- 不存在 `.gitkeep` 文件
- 不存在 `speaker-notes.md` 文件
- readme 中没有失效链接
- readme 中不包含 `pnpm run exercise` 命令
- 每个子目录需要 `main.ts`，除非是纯 readme 练习

## 移动或重命名练习

重编号或移动练习时：

1. 使用 `git mv`（而非 `mv`）重命名目录 - 保留 Git 历史记录
2. 更新数字前缀以保持顺序
3. 移动后重新运行 lint

示例：

```bash
git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings
```

## 示例：从计划创建模板

给定如下计划：

```
Section 05: Memory Skill Building
- 05.01 Introduction to Memory
- 05.02 Short-term Memory (explainer + problem + solution)
- 05.03 Long-term Memory
```

创建目录：

```bash
mkdir -p exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer
mkdir -p exercises/05-memory-skill-building/05.02-short-term-memory/{explainer,problem,solution}
mkdir -p exercises/05-memory-skill-building/05.03-long-term-memory/explainer
```

然后创建 readme 模板：

```
exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer/readme.md -> "# Introduction to Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/explainer/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/problem/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/solution/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.03-long-term-memory/explainer/readme.md -> "# Long-term Memory"
```
