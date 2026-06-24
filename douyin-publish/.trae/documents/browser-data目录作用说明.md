# .browser-data 目录作用说明

## 📁 目录定义

`.browser-data` 是 **Playwright 浏览器持久化上下文（Persistent Context）** 的用户数据存储目录。

## 🔧 技术原理

### 在代码中的使用位置

#### 1️⃣ **douyin-publish.js（旧版本）**

```javascript
// 第 185 行
const userDataDir = path.join(__dirname, '.browser-data');

// 第 194 行
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: CONFIG.headless,
  // ...其他配置
});
```

#### 2️⃣ **visual-flow-v2.js（新版本）**

```javascript
// 第 52 行 - 配置
sessionDir: path.join(__dirname, '.douyin-session'),  // ✅ 新版使用 .douyin-session

// 第 400 行 - 使用
context = await chromium.launchPersistentContext(CONFIG.sessionDir, { ... });
```

## 💡 核心作用

### 什么是 Persistent Context？

`launchPersistentContext` 是 Playwright 提供的一个特殊功能，它会：

1. **启动一个持久的浏览器实例**

   * 类似于打开一个"常驻"的 Chrome 窗口

   * 浏览器关闭后，所有数据都会保存到指定目录

2. **保存完整的浏览器状态**

   * ✅ **Cookies 和登录会话**（最重要！）

   * ✅ localStorage / sessionStorage

   * ✅ 缓存数据（Cache）

   * ✅ 浏览器历史记录

   * ✅ 表单自动填充数据

   * ✅ 扩展程序数据

3. **下次启动时自动恢复**

   * 无需重新登录抖音账号

   * 保持之前的浏览器设置和偏好

## 🎯 实际应用场景

### 在你的项目中：

| 使用场景     | 说明                           |
| -------- | ---------------------------- |
| **登录保持** | 扫码登录一次后，后续运行无需重新登录           |
| **会话复用** | 多次执行发布任务时，保持同一个浏览器身份         |
| **反检测**  | 保存浏览器指纹，避免每次都是"全新浏览器"被识别为机器人 |
| **性能优化** | 利用缓存加速页面加载                   |

## 📊 目录内容详解

`.browser-data/` 目录包含标准的 Chromium 用户配置文件结构：

```
.browser-data/
├── Default/                    # 默认用户配置文件
│   ├── Cache/                  # 页面缓存（可占 50-200MB）
│   │   └── Cache_Data/         # 缓存数据文件
│   ├── Cookies                 # Cookie 数据库
│   ├── History                 # 浏览历史
│   ├── Login Data              # 保存的密码
│   ├── Preferences             # 浏览器设置
│   ├── Session Storage/        # 会话存储
│   ├── Local Storage/          # 本地存储（含登录token）
│   ├── Web Data                # Web数据库
│   ├── GPUCache/               # GPU缓存
│   └── ...                     # 其他Chrome数据
├── Crashpad/                   # 崩溃报告
├── GrShaderCache/              # 图形着色器缓存
└── ShaderCache/                # 着色器缓存
```

## ⚠️ 重要发现：你的项目有**两套**浏览器数据！

### 对比两个目录：

| 目录                     | 使用者                      | 当前状态          | 建议       |
| ---------------------- | ------------------------ | ------------- | -------- |
| **`.browser-data/`**   | `douyin-publish.js` (旧版) | 可能包含旧的登录数据    | ⚠️ 可清理   |
| **`.douyin-session/`** | `visual-flow-v2.js` (新版) | ✅ **当前主程序使用** | **必须保留** |

### 关键区别：

* **`.douyin-session/`** - 这是 **visual-flow-v2.js**（你当前的主程序）使用的目录

* **`.browser-data/`** - 这是 **douyin-publish.js**（旧版本）使用的目录

## 🗑️ 清理建议

### 可以安全删除的情况：

1. **如果你只用** **`visual-flow-v2.js`**（推荐）：

   ```bash
   # .browser-data 不再需要，可以删除释放 50-200MB 空间
   rmdir /s /q .browser-data
   ```

2. **如果你想重置登录状态**：

   ```bash
   # 删除后下次运行需要重新扫码登录
   rmdir /s /q .douyin-session
   ```

### 必须保留的情况：

* ✅ **`.douyin-session/`** - 只要你想保持免登录功能，就必须保留

## 🔍 如何验证哪个目录在用？

查看当前运行的脚本：

* 运行 `node douyin-publish.js` → 使用 `.browser-data`

* 运行 `node visual-flow-v2.js` → 使用 `.douyin-session` （**推荐**）

## 💡 最佳实践建议

### 推荐方案：统一使用 `.douyin-session/`

因为：

1. ✅ `visual-flow-v2.js` 是更完善的新版本（10步拟人化流程）
2. ✅ 已经包含了登录状态保持功能
3. ✅ `.browser-data` 只是旧版本的遗留物

### 操作步骤：

1. **确认当前使用的是 visual-flow-v2.js**
2. **删除 .browser-data 目录**（可选，释放空间）
3. **保留 .douyin-session 目录**（重要！）

***

## 总结

**一句话解释：**

> `.browser-data` 是 Playwright 的浏览器"记忆"文件夹，用来保存登录状态、Cookies、缓存等数据，让你不用每次都重新登录抖音。

**对你的项目来说：**

* 它是**旧版本** (`douyin-publish.js`) 的浏览器数据目录

* 你现在用的是**新版本** (`visual-flow-v2.js`)，它使用 `.douyin-session/`

* 所以 `.browser-data` **可以安全删除**来节省 50-200MB 空间

