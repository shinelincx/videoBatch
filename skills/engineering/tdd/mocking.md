# When to Mock（何时使用模拟）

仅在**系统边界**使用模拟：

- 外部 API（支付、邮件等）
- 数据库（有时——优先使用测试数据库）
- 时间/随机数
- 文件系统（有时）

不要模拟：

- 自己的类/模块
- 内部协作者
- 你能控制的任何东西

## 为可模拟性设计

在系统边界，设计易于模拟的接口：

**1. 使用依赖注入**

传入外部依赖而非在内部创建：

```typescript
// 易于模拟
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// 难以模拟
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. 优先使用 SDK 风格接口而非通用获取器**

为每个外部操作创建特定函数，而非使用一个带条件逻辑的通用函数：

```typescript
// 好：每个函数可独立模拟
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// 差：模拟需要在 mock 内部使用条件逻辑
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK 方式意味着：
- 每个 mock 返回一个特定的形状
- 测试设置中不需要条件逻辑
- 更容易看出测试使用了哪些端点
- 每个端点具有类型安全
