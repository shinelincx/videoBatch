<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/total-typescript/image/upload/v1777382277/skills-repo-dark_2x.png">
    <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/total-typescript/image/upload/v1777382277/skill-repo-light_2x.png">
    <img alt="Skills" src="https://res.cloudinary.com/total-typescript/image/upload/v1777382277/skill-repo-light_2x.png" width="369">
  </picture>
</p>

# 面向真实工程师的 Skills

[![skills.sh](https://skills.sh/b/mattpocock/skills)](https://skills.sh/mattpocock/skills)

这是我每天用来做真实工程的 agent skills——而不是随便 vibe coding。

开发真实应用很难。像 GSD、BMAD 和 Spec-Kit 这类方法试图通过固定流程来帮忙，但它们在掌控流程的同时，也剥夺了你的控制权，导致过程中的 bug 难以解决。

这些 skills 的设计理念是：小巧、易于调整、可组合。它们适用于任何模型，基于数十年的工程实践经验。你可以随意折腾它们，按自己的方式定制。玩得开心。

如果你想随时了解这些 skills 的更新，以及我未来创建的新 skills，可以加入我的 newsletter，和大约 60,000 名开发者一起：

[注册 Newsletter](https://www.aihero.dev/s/skills-newsletter)

## 快速开始（30 秒搞定）

1. 运行 skills.sh 安装器：

```bash
npx skills@latest add mattpocock/skills
```

2. 选择你想要的 skills，以及要安装到哪些 coding agent 上。**记得勾选 `/setup-matt-pocock-skills`**。

3. 在 agent 中运行 `/setup-matt-pocock-skills`，它会：
   - 询问你想用哪个 issue 追踪器（GitHub、Linear 或本地文件）
   - 询问你 triage 时给 ticket 打什么标签（`/triage` 会使用这些标签）
   - 询问你想把创建的文档保存在哪里

4. 搞定，可以开工了。

## 为什么存在这些 Skills

我创建这些 skills 是为了解决我在 Claude Code、Codex 和其他 coding agent 上常见的失败模式。

### #1：Agent 做的事情不是我想要的

> "Nobody ever knows exactly what they want."
>
> David Thomas & Andrew Hunt, [The Pragmatic Programmer](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)

**问题所在**。软件开发中最常见的失败模式就是"理解偏差"。你以为开发人员知道你想要什么，结果看到他们做出来的东西，才发现他们完全没理解你。

AI 时代也一样。你和 agent 之间存在沟通鸿沟。解决办法是 **"深度追问"（grilling session）**——让 agent 向你提出详细的问题，充分了解你要构建的东西。

**解决方案**是使用：

- [`/grill-me`](./skills/productivity/grill-me/SKILL.md) — 用于非代码场景
- [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) — 功能与 [`/grill-me`](./skills/productivity/grill-me/SKILL.md) 相同，但增加了更多实用功能（见下文）

这是我最受欢迎的 skills。它们能帮你在使用 agent 前充分对齐思路，深入思考你要做的改动。**每次**要做改动时都应该使用它们。

### #2：Agent 的输出太啰嗦了

> With a ubiquitous language, conversations among developers and expressions of the code are all derived from the same domain model.
>
> Eric Evans, [Domain-Driven-Design](https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

**问题所在**：项目初期，开发人员和业务方（领域专家）通常说的不是同一种"语言"。

我在用 agent 时也感受到了同样的张力。Agent 通常被直接丢进一个项目，然后被要求自己在过程中搞懂专业术语，结果它们总是用 20 个词去表达 1 个词就能说清的意思。

**解决方案**是建立一套共享语言。这是一份文档，帮助 agent 理解项目中使用的专业术语。

<details>
<summary>
示例
</summary>

这是来自我的 `course-video-manager` 仓库的一个 [`CONTEXT.md`](https://github.com/mattpocock/course-video-manager/blob/076a5a7a182db0fe1e62971dd7a68bcadf010f1c/CONTEXT.md) 示例。哪个更容易理解？

- **修改前**："There's a problem when a lesson inside a section of a course is made 'real' (i.e. given a spot in the file system)"
- **修改后**："There's a problem with the materialization cascade"

这种简洁性在每次对话中都能带来回报。

</details>

这个功能已内置于 [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) 中。它是一次深度追问 session，同时帮你与 AI 建立共享语言，并在 ADR 中记录那些难以解释的决策。

它有多强大，很难用言语描述。这可能是本仓库里最酷的技巧。试试看就知道了。

> [!TIP]
> 共享语言的好处远不止减少啰嗦：
>
> - **变量、函数和文件的命名保持一致**，基于共享语言
> - 因此，**代码库对 agent 来说更易于浏览**
> - Agent **在思考上消耗的 token 也更少**，因为它可以使用更简洁的语言

### #3：代码跑不起来

> "Always take small, deliberate steps. The rate of feedback is your speed limit. Never take on a task that's too big."
>
> David Thomas & Andrew Hunt, [The Pragmatic Programmer](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)

**问题所在**：假设你和 agent 对要构建的东西已经达成一致，但 agent 写出来的代码还是很烂怎么办？

这时候该审视你的反馈循环了。如果缺乏对代码实际运行情况的反馈，agent 就只能盲人摸象。

**解决方案**：你需要常规的反馈循环——静态类型检查、浏览器访问和自动化测试。

对于自动化测试，red-green-refactor 循环至关重要。也就是让 agent 先写一个失败的测试，然后再修复它。这能让 agent 获得持续的反馈，从而产出更好的代码。

我构建了一个 **[`/tdd`](./skills/engineering/tdd/SKILL.md) skill**，可以接入任何项目。它鼓励 red-green-refactor 模式，并为 agent 提供大量关于什么是好测试、什么是坏测试的指导。

对于调试，我还构建了一个 **[`/diagnose`](./skills/engineering/diagnose/SKILL.md)** skill，将最佳调试实践封装成一个简洁的循环。

### #4：代码变成了一团泥

> "Invest in the design of the system _every day_."
>
> Kent Beck, [Extreme Programming Explained](https://www.amazon.co.uk/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)

> "The best modules are deep. They allow a lot of functionality to be accessed through a simple interface."
>
> John Ousterhout, [A Philosophy Of Software Design](https://www.amazon.co.uk/Philosophy-Software-Design-2nd/dp/173210221X)

**问题所在**：大多数用 agent 开发的应用都很复杂且难以修改。因为 agent 能大幅加快编码速度，它们也会加速软件熵增。代码库以前所未有的速度变得复杂。

**解决方案**是采用一种全新的 AI 开发方式：重视代码设计。

这贯穿于这些 skills 的每一层：

- [`/to-prd`](./skills/engineering/to-prd/SKILL.md) 在创建 PRD 之前，会向你确认要涉及哪些模块
- [`/zoom-out`](./skills/engineering/zoom-out/SKILL.md) 让 agent 从整个系统的上下文来解释代码

最关键的是，[`/improve-codebase-architecture`](./skills/engineering/improve-codebase-architecture/SKILL.md) 能帮你拯救已经变成一团泥的代码库。我建议每隔几天就在你的代码库上运行一次。

### 总结

软件工程的基本功比以往任何时候都更重要。这些 skills 是我将这些基本功浓缩为可重复实践的最佳尝试，希望能帮你构建出职业生涯中最优秀的应用。享受吧。

## 参考

### Engineering

我每天用于代码工作的 skills。

- **[diagnose](./skills/engineering/diagnose/SKILL.md)** — 针对疑难 bug 和性能回归的结构化诊断循环：复现 → 最小化 → 假设 → 插桩 → 修复 → 回归测试。
- **[grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md)** — 深度追问 session，根据现有领域模型审视你的计划，打磨术语，并就地更新 `CONTEXT.md` 和 ADR。
- **[triage](./skills/engineering/triage/SKILL.md)** — 通过状态机化的 triage 角色流程处理 issue。
- **[improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md)** — 在代码库中寻找深化机会，参考 `CONTEXT.md` 中的领域语言和 `docs/adr/` 中的决策。
- **[setup-matt-pocock-skills](./skills/engineering/setup-matt-pocock-skills/SKILL.md)** — 为每个仓库搭建配置文件（issue 追踪器、triage 标签词汇、领域文档布局），供其他工程 skills 使用。在使用 `to-issues`、`to-prd`、`triage`、`diagnose`、`tdd`、`improve-codebase-architecture` 或 `zoom-out` 之前，每个仓库只需运行一次。
- **[tdd](./skills/engineering/tdd/SKILL.md)** — 采用 red-green-refactor 循环的测试驱动开发。一次构建或修复一个垂直切片。
- **[to-issues](./skills/engineering/to-issues/SKILL.md)** — 使用垂直切片方法，将任何计划、规格或 PRD 拆分为可独立处理的 GitHub issues。
- **[to-prd](./skills/engineering/to-prd/SKILL.md)** — 将当前对话上下文转化为 PRD 并以 GitHub issue 提交。无需访谈——直接综合你们已经讨论过的内容。
- **[zoom-out](./skills/engineering/zoom-out/SKILL.md)** — 让 agent 退后一步，对不熟悉的代码段提供更广泛的上下文或更高层的视角。
- **[prototype](./skills/engineering/prototype/SKILL.md)** — 构建一个一次性原型来验证设计——可以是用于验证状态/业务逻辑的终端可运行应用，也可以是多个差异巨大的 UI 变体，通过一个路由切换。

### Productivity

通用工作流工具，与代码无关。

- **[caveman](./skills/productivity/caveman/SKILL.md)** — 极致精简的沟通模式。通过剔除冗余内容，减少约 75% 的 token 使用量，同时保持完整的技术准确性。
- **[grill-me](./skills/productivity/grill-me/SKILL.md)** — 接受对计划或设计的深度追问，直到决策树的每个分支都得到明确。
- **[handoff](./skills/productivity/handoff/SKILL.md)** — 将当前对话压缩成交接文档，让另一个 agent 可以无缝接手继续工作。
- **[write-a-skill](./skills/productivity/write-a-skill/SKILL.md)** — 创建新 skills，包含规范的结构、渐进式披露和配套资源。

### Misc

我保留但很少使用的工具。

- **[git-guardrails-claude-code](./skills/misc/git-guardrails-claude-code/SKILL.md)** — 设置 Claude Code hooks，在危险 git 命令（push、reset --hard、clean 等）执行前拦截。
- **[migrate-to-shoehorn](./skills/misc/migrate-to-shoehorn/SKILL.md)** — 将测试文件从 `as` 类型断言迁移到 @total-typescript/shoehorn。
- **[scaffold-exercises](./skills/misc/scaffold-exercises/SKILL.md)** — 创建练习目录结构，包含章节、题目、解决方案和讲解文档。
- **[setup-pre-commit](./skills/misc/setup-pre-commit/SKILL.md)** — 使用 Husky 配置 pre-commit hooks，集成 lint-staged、Prettier、类型检查和测试。
