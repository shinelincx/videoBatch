# CONTEXT.md 格式

## 结构

```md
# {上下文名称}

{一两句话描述该上下文是什么以及为什么存在。}

## Language（领域术语）

**Order（订单）**:
{对该术语的简明描述}
_避免使用_: Purchase, transaction

**Invoice（发票）**:
交付后发送给客户的付款请求。
_避免使用_: Bill, payment request

**Customer（客户）**:
下达订单的个人或组织。
_避免使用_: Client, buyer, account

## Relationships（关系）

- 一个 **Order（订单）** 产生一个或多个 **Invoice（发票）**
- 一张 **Invoice（发票）** 属于恰好一个 **Customer（客户）**

## Example dialogue（示例对话）

> **Dev:** "当 **Customer（客户）** 下达 **Order（订单）** 时，我们是立即创建 **Invoice（发票）** 吗？"
> **Domain expert:** "不是——只有在确认 **Fulfillment（履约）** 后才会生成 **Invoice（发票）**。"

## Flagged ambiguities（标注歧义）

- "account" 被同时用来表示 **Customer** 和 **User**——已解决：这两个是不同的概念。
```

## 规则

- **明确表达倾向。** 当同一个概念有多个用词时，选定最优的一个，并将其余列为应避免使用的别名。
- **显式标注冲突。** 如果某个术语在使用中存在歧义，在"Flagged ambiguities"中指出并给出明确的解决方案。
- **定义要精炼。** 最多一句话。定义它**是什么**，而不是它能做什么。
- **展示关系。** 使用加粗的术语名称，在能判断基数时明确表达出来（如"一个对应多个"）。
- **仅包含本项目上下文特有的术语。** 通用的编程概念（超时、错误类型、工具函数模式等）不属于这里，即使项目大量使用也不应收录。添加术语前先问自己：这是该上下文独有的概念，还是通用编程概念？只有前者才应收录。
- **当术语自然形成聚类时，使用子标题分组。** 如果所有术语都属于一个内聚的领域，平铺列表即可。
- **编写示例对话。** 一段开发者与领域专家之间的对话，自然展示术语之间的交互方式，并澄清相关概念之间的边界。

## 单上下文 vs 多上下文仓库

**单上下文（大多数仓库）：** 仓库根目录放置一个 `CONTEXT.md`。

**多上下文：** 仓库根目录放置一个 `CONTEXT-MAP.md`，列出所有上下文、它们的位置以及相互关系：

```md
# Context Map

## Contexts

- [Ordering（下单）](./src/ordering/CONTEXT.md) — 接收和追踪客户订单
- [Billing（计费）](./src/billing/CONTEXT.md) — 生成发票并处理付款
- [Fulfillment（履约）](./src/fulfillment/CONTEXT.md) — 管理仓库拣货和发货

## Relationships

- **Ordering → Fulfillment**: Ordering 发出 `OrderPlaced` 事件；Fulfillment 消费该事件以开始拣货
- **Fulfillment → Billing**: Fulfillment 发出 `ShipmentDispatched` 事件；Billing 消费该事件以生成发票
- **Ordering ↔ Billing**: 共享 `CustomerId` 和 `Money` 类型
```

skill 会自动判断适用哪种结构：

- 如果存在 `CONTEXT-MAP.md`，读取它以找到所有上下文
- 如果只有根目录的 `CONTEXT.md`，则为单上下文
- 如果两者都不存在，则在需要解析第一个术语时延迟创建根目录 `CONTEXT.md`

当存在多个上下文时，推断当前话题关联到哪个上下文。如果不明确，则询问用户。
