---
name: migrate-to-shoehorn
description: 将测试文件中的 `as` 类型断言迁移到 @total-typescript/shoehorn。适用于用户提到 shoehorn、需要在测试中替换 `as` 或处理部分测试数据的场景。
---

# 迁移到 Shoehorn

## 为什么选择 shoehorn？

`shoehorn` 允许在测试中传入部分数据，同时保持 TypeScript 类型安全。它提供了替代 `as` 断言的类型安全方案。

**仅限测试代码。** 绝不要在生产代码中使用 shoehorn。

在测试中使用 `as` 的问题：

- 需要刻意避免使用它
- 必须手动指定目标类型
- 处理故意错误数据时需要双重断言（`as unknown as Type`）

## 安装

```bash
npm i @total-typescript/shoehorn
```

## 迁移模式

### 大型对象只需少量属性

迁移前：

```ts
type Request = {
  body: { id: string };
  headers: Record<string, string>;
  cookies: Record<string, string>;
  // ...还有 20 多个属性
};

it("gets user by id", () => {
  // 只关心 body.id，但必须伪造整个 Request 对象
  getUser({
    body: { id: "123" },
    headers: {},
    cookies: {},
    // ...伪造全部 20 个属性
  });
});
```

迁移后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

it("gets user by id", () => {
  getUser(
    fromPartial({
      body: { id: "123" },
    }),
  );
});
```

### `as Type` → `fromPartial()`

迁移前：

```ts
getUser({ body: { id: "123" } } as Request);
```

迁移后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

getUser(fromPartial({ body: { id: "123" } }));
```

### `as unknown as Type` → `fromAny()`

迁移前：

```ts
getUser({ body: { id: 123 } } as unknown as Request); // 故意传入错误类型
```

迁移后：

```ts
import { fromAny } from "@total-typescript/shoehorn";

getUser(fromAny({ body: { id: 123 } }));
```

## 各函数的使用场景

| 函数            | 使用场景                       |
| --------------- | ------------------------------ |
| `fromPartial()` | 传入部分数据，仍保持类型检查   |
| `fromAny()`     | 故意传入错误数据（保留自动补全）|
| `fromExact()`   | 强制传入完整对象（后续可替换为 fromPartial）|

## 工作流程

1. **收集需求** - 询问用户：
   - 哪些测试文件的 `as` 断言导致了问题？
   - 是否在处理大型对象但只关心部分属性？
   - 是否需要传入故意错误的数据来测试错误处理？

2. **安装并迁移**：
   - [ ] 安装：`npm i @total-typescript/shoehorn`
   - [ ] 查找包含 `as` 断言的测试文件：`grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
   - [ ] 将 `as Type` 替换为 `fromPartial()`
   - [ ] 将 `as unknown as Type` 替换为 `fromAny()`
   - [ ] 添加来自 `@total-typescript/shoehorn` 的 import
   - [ ] 运行类型检查验证迁移结果
