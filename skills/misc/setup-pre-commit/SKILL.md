---
name: setup-pre-commit
description: 在当前仓库中配置 Husky pre-commit 钩子，集成 lint-staged（Prettier）、类型检查和测试。适用于添加 pre-commit 钩子、配置 Husky、设置 lint-staged 或在提交时执行格式化/类型检查/测试的场景。
---

# 配置 Pre-Commit 钩子

## 配置内容

- **Husky** pre-commit 钩子
- **lint-staged** 对所有暂存文件执行 Prettier 格式化
- **Prettier** 配置文件（如缺失则自动创建）
- Pre-commit 钩子中的 **typecheck** 和 **test** 脚本

## 操作步骤

### 1. 检测包管理器

检查是否存在 `package-lock.json`（npm）、`pnpm-lock.yaml`（pnpm）、`yarn.lock`（yarn）、`bun.lockb`（bun）。使用检测到的包管理器。如无法确定，默认使用 npm。

### 2. 安装依赖

作为 devDependencies 安装：

```
husky lint-staged prettier
```

### 3. 初始化 Husky

```bash
npx husky init
```

这将创建 `.husky/` 目录，并在 package.json 中添加 `prepare: "husky"` 脚本。

### 4. 创建 `.husky/pre-commit`

写入此文件（Husky v9+ 不需要 shebang）：

```
npx lint-staged
npm run typecheck
npm run test
```

**适配说明**：将 `npm` 替换为检测到的包管理器。如果仓库的 package.json 中没有 `typecheck` 或 `test` 脚本，则省略对应行并告知用户。

### 5. 创建 `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. 创建 `.prettierrc`（如缺失）

仅在不存在 Prettier 配置文件时创建。使用以下默认配置：

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. 验证

- [ ] `.husky/pre-commit` 存在且具有可执行权限
- [ ] `.lintstagedrc` 存在
- [ ] package.json 中 `prepare` 脚本为 `"husky"`
- [ ] `prettier` 配置已存在
- [ ] 运行 `npx lint-staged` 确认正常工作

### 8. 提交

暂存所有更改的文件并提交，提交信息：`Add pre-commit hooks (husky + lint-staged + prettier)`

此操作会触发新的 pre-commit 钩子——这是验证一切是否正常的绝佳冒烟测试。

## 注意事项

- Husky v9+ 不需要在钩子文件中添加 shebang
- `prettier --ignore-unknown` 会跳过 Prettier 无法解析的文件（如图片等）
- Pre-commit 会先运行 lint-staged（快速，仅处理暂存文件），然后执行完整的类型检查和测试
