# 授权功能实现方案

## 概述

为电商文案智能体增加授权功能：API 接口和 CLI 工具均需携带有效 token 才能调用。采用动态 API Key 方案，支持通过管理接口增删 token，token 持久化到 JSON 文件。

***

## 当前状态分析

* **Web 框架**: FastAPI，入口 [main.py](file:///d:/project/cw-Agent/main.py)

* **API 路由**: [app/routes.py](file:///d:/project/cw-Agent/app/routes.py)，4 个端点，无任何认证

* **CLI 入口**: [cli.py](file:///d:/project/cw-Agent/cli.py)，argparse 实现，无认证

* **前端**: [static/app.js](file:///d:/project/cw-Agent/static/app.js) 直接 fetch API，不传任何认证头

* **配置**: [app/config.py](file:///d:/project/cw-Agent/app/config.py) 仅有 LLM 相关配置

* **依赖**: 无 jwt 库，仅标准库 + fastapi/pydantic/uvicorn 等

***

## 设计方案

### Token 存储

* 文件: `tokens.json`（项目根目录）

* 结构: 每个 token 包含 `key`、`description`、`created_at`、`enabled`

* 内存缓存 + 文件持久化，启动时加载，变更时写回

```json
{
  "tokens": [
    {
      "key": "cw-xxxxxxxxxxxxxxxx",
      "description": "默认管理员 token",
      "created_at": "2026-06-03T10:00:00",
      "enabled": true
    }
  ]
}
```

### API 认证方式

* 请求头: `Authorization: Bearer <token_key>`

* 通过 FastAPI `Depends` 注入依赖，对 `/api/*` 路由进行统一拦截

### CLI 认证方式

* 参数优先级: `--token` 参数 > `AUTH_TOKEN` 环境变量

* 启动时校验 token 有效性，无效则退出

### Token 管理接口

| 方法       | 路径                 | 说明                            |
| -------- | ------------------ | ----------------------------- |
| `POST`   | `/api/token`       | 创建新 token（返回完整 token，仅此一次可见）  |
| `GET`    | `/api/tokens`      | 列出所有 token（不返回 key 完整值，仅返回前缀） |
| `DELETE` | `/api/token/{key}` | 撤销（禁用）指定 token                |

> 管理接口同样需要携带有效 token 才能调用。

***

## 文件变更清单

### 1. 新增 [app/auth.py](file:///d:/project/cw-Agent/app/auth.py)

核心认证模块，包含：

* `TokenStore` 类:

  * `__init__(file_path)`: 从 JSON 文件加载 tokens

  * `validate(key) -> bool`: 校验 token 是否有效且启用

  * `create(description) -> str`: 创建新 token，返回完整 key

  * `list_tokens() -> list`: 列出所有 token（脱敏）

  * `revoke(key) -> bool`: 禁用指定 token

  * `_save()`: 写回 JSON 文件

* `get_token_store() -> TokenStore`: 单例工厂函数

* `verify_token(authorization: str = Header(None)) -> str`: FastAPI 依赖函数

  * 解析 `Bearer <token>` 格式

  * 调用 `TokenStore.validate()` 校验

  * 失败抛出 `HTTPException(401)`

* `validate_cli_token(token: str, store: TokenStore) -> bool`: CLI 专用校验函数

### 2. 修改 [app/config.py](file:///d:/project/cw-Agent/app/config.py)

新增配置项:

```python
AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "false").lower() == "true"
TOKEN_FILE = os.environ.get("TOKEN_FILE", "tokens.json")
```

### 3. 修改 [app/routes.py](file:///d:/project/cw-Agent/app/routes.py)

* 所有现有路由注入 `Depends(verify_token)` 依赖（当 `AUTH_ENABLED` 为 True 时）

* 新增 3 个 token 管理路由，同样受认证保护

### 4. 修改 [main.py](file:///d:/project/cw-Agent/main.py)

启动时初始化 TokenStore，生成默认 token（如果 tokens.json 为空且 AUTH\_ENABLED 启用）。

### 5. 修改 [cli.py](file:///d:/project/cw-Agent/cli.py)

* 新增 `--token` 参数

* 支持 `AUTH_TOKEN` 环境变量

* 在 main() 执行前先校验 token

### 6. 修改 [static/index.html](file:///d:/project/cw-Agent/static/index.html)

在表单区域上方添加 token 输入框。

### 7. 修改 [static/app.js](file:///d:/project/cw-Agent/static/app.js)

所有 fetch 请求添加 `Authorization: Bearer <token>` 请求头。token 从输入框读取。

### 8. 修改 [.env](file:///d:/project/cw-Agent/.env)

新增:

```
AUTH_ENABLED=true
TOKEN_FILE=tokens.json
```

***

## 假设与决策

* **AUTH\_ENABLED 默认为 false**: 向后兼容，需显式启用

* **默认生成管理员 token**: 首次启用时自动生成一个 `cw-` 前缀的随机 token

* **token 格式**: `cw-` + 32 位 hex 随机字符串

* **管理接口同样受保护**: 只有已有 token 的用户才能管理 token

* **Token 撤销为软删除**: 将 `enabled` 设为 `false`，不物理删除

***

## 验证步骤

1. 启动服务，确认控制台输出默认 token
2. 不带 token 调用 `POST /api/generate` → 返回 401
3. 带无效 token 调用 → 返回 401
4. 带正确 token 调用 → 正常返回结果
5. CLI 不带 token 运行 → 报错退出
6. CLI 带 `--token` 或 `AUTH_TOKEN` 运行 → 正常执行
7. POST `/api/token` 创建新 token → 成功
8. 用新 token 调用接口 → 正常
9. DELETE `/api/token/{key}` 撤销 → 该 token 无法再使用
10. 前端输入 token 后正常生成文案

