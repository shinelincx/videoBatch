# Issue tracker 集成仅限于主流工具

`setup-matt-pocock-skills` 仅为**主流** issue tracker 提供一等支持。添加对小众、新兴或单一供应商实验性 tracker 支持的请求不在范围内。

## 为什么不在此范围内

每个 issue tracker 后端都会将 CLI 的形态硬编码到 skill 中（命令、标志、输出解析）。每个新后端都是永久性的维护成本——随着工具 CLI 的演进，它必须持续正常工作，还必须针对 `/to-prd`、`/to-issues`、`/triage` 等进行测试。只有当足够多比例的用户实际使用某个 tracker 时，这种成本才是值得的。

"主流"是一种主观判断，而非数字标准：

- GitHub、GitLab 和 Backlog.md 这类工具会被认为是主流的——广为人知、广泛使用、早已过了实验阶段。
- 一个全新的面向 agent 的工具，即便只有几百个 GitHub star，也不算主流，无论其设计多么有趣。

star 数量、年龄和下载量是做出判断时的有用参考指标，但没有哪一个是硬性规则。真正的标准是：一个典型的工程师是否能识别这个工具，并可能为自己的团队选择它？

对于非主流 tracker，现有的替代方案已经存在：

- `local markdown`：用于轻量级的仓库内跟踪。
- `other/custom`：适用于想要自行接入的用户。

这两种方式都不需要核心 skill 了解具体的工具。

## 相关请求

- #99 — "添加 dex 作为 issue tracker 后端"（提出该请求时 dex 仅有约 3 个月的历史和约 300 个 star）
