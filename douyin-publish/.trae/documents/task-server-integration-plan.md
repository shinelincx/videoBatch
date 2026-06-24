# 抖音自动化发布 - 服务端任务调度集成方案

## 摘要

将 `index.js` 中写死的 CONFIG 测试数据替换为服务端驱动的任务调度模式。服务启动后持续从服务端拉取待发布任务，按队列逐条执行自动化发布并同步状态。

## 当前状态分析

- **主文件**：[index.js](file:///d:/project/test/index.js) — 约1850行，单文件单体脚本
- **辅助模块**：[human-simulator.js](file:///d:/project/test/human-simulator.js) — 拟人化行为模拟器
- **依赖**：playwright ^1.60.0
- **会话管理**：使用 `chromium.launchPersistentContext` 保持登录态，session 目录固定为 `.douyin-session`
- **发布流程**：10步完整流程（登录检测 → 点击发布视频 → 上传视频 → 填写信息 → 标签 → 声明 → 可见性 → 定时发布 → 封面 → 发布）
- **问题**：所有发布参数（videoDir、title、description、visibility 等）写死在 CONFIG 对象中，每次只能发布一条固定内容

## 目标架构

```
index.js (入口 + 主循环)
├── api-client.js (新增) —— 服务端API通信
├── task-queue.js (新增) —— 待发布任务队列
├── session-manager.js (新增) —— 多账号会话管理
└── human-simulator.js (已有，不改动)
```

## 新增文件

### 1. `api-client.js` — 服务端 API 客户端

**职责**：封装与服务端 `http://122.51.115.150:8180` 的所有 HTTP 通信

**核心方法**：

| 方法 | 接口 | 说明 |
|------|------|------|
| `login(account, password)` | `POST /auth/login` | 获取授权 token，返回 `{ token, ... }` |
| `fetchPendingTasks(token)` | `POST /publish/account/pending_publish/matches` | 获取待发布任务列表，返回 `{ tasks: [...] }` |
| `reportTaskStatus(token, taskId, status)` | `POST /publish/account/pending_publish/{taskId}/status` | 同步任务状态（完成/失败） |

**假设**（待服务端确认后调整）：
- 登录接口返回 `{ code: 0, data: { token: "xxx" } }`
- 任务接口返回 `{ code: 0, data: { tasks: [{ id, account, accountId, title, description, videoUrl, visibility, ... }] } }`
- 状态同步接口路径格式为 `/publish/account/pending_publish/{taskId}/status`
- 请求头使用 `Authorization: Bearer <token>`

### 2. `task-queue.js` — 待发布任务队列

**职责**：管理待发布任务的内存队列，按任务ID去重

**核心方法**：

| 方法 | 说明 |
|------|------|
| `enqueue(tasks)` | 批量入列，根据任务ID去重（已存在则忽略） |
| `dequeue()` | 取出队列头部任务，返回 `task` 或 `null` |
| `isEmpty()` | 判断队列是否为空 |
| `size()` | 获取队列长度 |

**数据结构**：
```js
class TaskQueue {
  constructor() {
    this.queue = [];           // 任务数组
    this.taskIdSet = new Set(); // 任务ID集合（去重用）
  }
}
```

### 3. `session-manager.js` — 多账号会话管理器

**职责**：按抖音账号管理独立的 browser context / session，实现多账号切换

**核心方法**：

| 方法 | 说明 |
|------|------|
| `getSession(accountId)` | 获取指定账号的 `{ context, page }`，不存在返回 null |
| `createSession(accountId)` | 为指定账号创建新的持久化 context（目录：`.douyin-session/{accountId}`） |
| `requireLogin(accountId, page)` | 检测登录状态，未登录则等待用户手动登录 |
| `closeSession(accountId)` | 关闭指定账号的 context |
| `closeAll()` | 关闭所有账号的 context |

**会话目录结构**：
```
.douyin-session/
├── default/          ← 原 .douyin-session 的内容
├── account_001/      ← 账号1的独立 session
├── account_002/      ← 账号2的独立 session
```

### 4. `publish-flow.js` — 发布流程模块（从 index.js 抽离）

**职责**：将 index.js 中的10步发布流程抽离为独立模块，接收任务参数执行发布

**核心函数**：
```js
async function executePublish(page, human, taskParams) {
  // taskParams: { videoPath, title, description, visibility, scheduleTime, ... }
  // 执行10步发布流程
  // 返回 { success: boolean, error?: string }
}
```

**说明**：将 [index.js](file:///d:/project/test/index.js) 中 542-1716 行的发布步骤抽离，用 `taskParams` 替代 `CONFIG` 引用。

## 修改文件

### `index.js` — 主入口重构

**改动范围**：替换整个 main 函数逻辑

**新主流程**：

```
1. 解析命令行参数
2. 调用 apiClient.login() 获取 token
3. 进入主循环：
   a. 调用 apiClient.fetchPendingTasks(token)
   b. 如果返回任务列表：
      - taskQueue.enqueue(tasks)  // 去重入列
      - 遍历队列逐条处理（步骤 c-f）
   c. 从队列取任务 taskQueue.dequeue()
   d. 通过 sessionManager 获取/创建对应账号的 session
   e. 如果未登录 → 打开登录页等待用户登录
   f. 调用 publishFlow.executePublish(page, human, taskParams)
   g. 调用 apiClient.reportTaskStatus(token, taskId, 'completed')
   h. 队列处理完后回到步骤 a
   i. 如果步骤 a 返回空列表 → 等待60秒后重试
```

**保留不变的部分**：
- 命令行参数解析（`--clear-session` / `--reset`）
- `getVideoFile()`, `delay()`, `getDirSize()` 工具函数
- 人机交互模拟器初始化

**删除的部分**：
- `CONFIG` 对象（第39-54行）→ 由服务端任务参数替代
- 硬编码的发布流程调用 → 改用 `publishFlow.executePublish()`
- 固定的单次执行逻辑 → 改为持续循环

## 假设与决策

| 事项 | 决策 | 备注 |
|------|------|------|
| API 接口契约 | 基于用户描述推断 | 联调时可能需要微调字段名和响应格式 |
| 视频文件来源 | 任务中包含 `videoUrl` 字段下载 | 或本地路径 `videoPath` 直接使用 |
| 多账号会话 | 每个账号独立 session 目录 | 目录名用账号ID |
| 登录方式 | 复用现有扫码/手动登录逻辑 | 每个新账号首次需要手动登录 |
| 错误处理 | 单任务失败不阻塞后续任务 | 上报失败状态后继续处理下一条 |
| HTTP 客户端 | 使用 Node.js 内置 `https`/`http` 模块 | 不引入额外依赖 |

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `api-client.js` | 新建 | 服务端API通信封装 |
| `task-queue.js` | 新建 | 任务队列管理 |
| `session-manager.js` | 新建 | 多账号会话管理 |
| `publish-flow.js` | 新建 | 从 index.js 抽离的10步发布流程 |
| `index.js` | 修改 | 主入口重构：删除 CONFIG，改为服务端调度循环 |

## 验证步骤

1. 启动程序后确认调用 `/auth/login` 成功并打印 token
2. 确认调用 `/publish/account/pending_publish/matches` 获取任务
3. 确认相同任务ID不会重复入列
4. 确认按账号加载对应 session，无 session 时弹出登录页
5. 确认登录后自动执行发布流程，发布参数使用服务端任务数据
6. 确认发布完成后调用状态同步接口
7. 确认队列清空后重新拉取，无任务时60秒间隔轮询
8. 运行 `node index.js` 整体验证主循环稳定性
