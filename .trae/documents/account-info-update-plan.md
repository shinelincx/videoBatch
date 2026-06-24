# 计划：登录后采集账号信息并同步到服务端

## 摘要

在「登录检测 → 用户扫码/验证码登录成功」之后，在创作者中心首页 (`creator.douyin.com`) 上采集抖音账号的 **抖音号、别名（昵称）、头像URL、关注数、粉丝数、获赞数**，然后调用服务端接口 `/base/account/create` 同步账号信息。

---

## 当前状态分析

### 现有流程（`index.js` 第 296–341 行）
```
checkLoginStatusImproved(page) → 检测是否已登录
  ├─ 已登录 → 跳过登录等待，进入发布流程
  └─ 未登录 → 等待用户手动登录（轮询，最多 180 秒）
       └─ 登录成功 (第 323 行 loginSuccess = true)
            └─ await delay(3000)   ← ★ 第 340 行，插入点
            └─ 进入发布流程
```

### 关键文件

| 文件 | 路径 | 修改范围 |
|------|------|----------|
| **index.js** | `d:\project\video-batch\douyin-publish\index.js` | 新增 `fetchAccountInfo()` 函数；在登录成功后调用 |
| **api-client.js** | `d:\project\video-batch\douyin-publish\api-client.js` | 新增 `updateAccount()` 函数 |

### 现有 API 模式（`api-client.js`）
- 使用 Node.js 内置 `http` 模块
- 请求签名：MD5(nonceStr + timestamp + uri + 密钥)
- Session：通过 `JSESSIONID` cookie 维持
- Authorization：`Bearer {token}` 头
- 响应格式：`{ code: 0, msg: "...", data: ... }`

---

## 实现方案

### 修改 1：`api-client.js` — 新增 `updateAccount()` 函数

**位置**：`d:\project\video-batch\douyin-publish\api-client.js`，在 `reportTaskStatus` 之后、`module.exports` 之前

**内容**：
```js
/**
 * 同步账号信息到服务端
 * @param {string} token - 授权 token
 * @param {object} accountData - 账号数据
 * @param {string} accountData.douyinId - 抖音号
 * @param {string} accountData.nickname - 别名/昵称
 * @param {string} accountData.avatar - 头像 URL
 * @param {number} accountData.following - 关注数
 * @param {number} accountData.followers - 粉丝数
 * @param {number} accountData.likes - 获赞数
 * @returns {Promise<boolean>}
 */
async function updateAccount(token, accountData) {
  console.log(`\n📤 同步账号信息: ${accountData.nickname || accountData.douyinId}`);
  try {
    const res = await request('POST', '/base/account/create', accountData, {
      'Authorization': `Bearer ${token}`,
    });
    if (res.code === 0) {
      console.log('  ✅ 账号信息同步成功');
      return true;
    } else {
      console.warn(`  ⚠️ 账号同步返回非0: code=${res.code}, msg=${res.msg || ''}`);
      return false;
    }
  } catch (err) {
    console.error(`  ❌ 账号同步失败: ${err.message}`);
    return false;
  }
}
```

**同时更新 `module.exports`**，导出 `updateAccount`。

---

### 修改 2：`index.js` — 新增 `fetchAccountInfo()` 函数

**位置**：`d:\project\video-batch\douyin-publish\index.js`，在 `checkLoginStatusImproved` 函数之后、`main` 函数之前（约第 186 行后）

**采集策略**（基于抖音创作者中心首页 DOM 结构）：

创作者中心首页 (`creator.douyin.com/creator-micro/home`) 的左侧或顶部通常显示创作者信息：
- 头像：用户头像 `<img>` 元素
- 昵称（别名）：显眼的用户名文本
- 抖音号：通常格式为 "抖音号：xxxxx"
- 关注 / 粉丝 / 获赞：通常格式为 "关注 123"、"粉丝 456"、"获赞 789"

由于抖音 class 名为动态生成，采用**文本匹配 + 父级遍历**的容错策略：

```js
/**
 * 从创作中心首页采集账号信息
 * @param {object} page - Playwright page 对象
 * @returns {Promise<object>} { douyinId, nickname, avatar, following, followers, likes }
 */
async function fetchAccountInfo(page) {
  console.log('\n📊 采集账号信息...');

  const info = {
    douyinId: '',
    nickname: '',
    avatar: '',
    following: 0,
    followers: 0,
    likes: 0,
  };

  try {
    // 1. 采集头像 URL
    // 头像通常在页面左侧个人信息区，img 元素
    const avatarImg = page.locator('img[src*="douyinpic.com"], img[src*="douyincdn.com"], [class*="avatar"] img').first();
    info.avatar = await avatarImg.getAttribute('src', { timeout: 3000 }).catch(() => '');

    // 2. 采集抖音号 — 匹配 "抖音号：xxx" 或 "抖音号: xxx" 文本
    const douyinIdText = await page.locator('text=/抖音号[：:]/').first().textContent({ timeout: 3000 }).catch(() => '');
    if (douyinIdText) {
      info.douyinId = douyinIdText.replace(/抖音号[：:]\s*/, '').trim();
    }

    // 3. 采集昵称 — 抖音号附近的突出文本，或页面 title
    // 尝试从页面标题提取
    const pageTitle = await page.title().catch(() => '');
    if (pageTitle && pageTitle.includes('创作')) {
      // 标题格式通常为 "xxx-创作者中心" 或类似
      info.nickname = pageTitle.split(/[-—|]/)[0].trim();
    }

    // 4. 采集关注数 — 匹配 "关注 XXX" 文本（排除"关注"按钮）
    const followingEl = page.locator('text=/关注\s*\d/').first();
    const followingText = await followingEl.textContent({ timeout: 3000 }).catch(() => '');
    if (followingText) {
      const match = followingText.match(/(\d[\d,]*)/);
      if (match) info.following = parseInt(match[1].replace(/,/g, ''), 10);
    }

    // 5. 采集粉丝数 — 匹配 "粉丝 XXX" 文本
    const fansText = await page.locator('text=/粉丝\s*\d/').first().textContent({ timeout: 3000 }).catch(() => '');
    if (fansText) {
      const match = fansText.match(/(\d[\d,]*)/);
      if (match) info.followers = parseInt(match[1].replace(/,/g, ''), 10);
    }

    // 6. 采集获赞数 — 匹配 "获赞 XXX" 文本
    const likesText = await page.locator('text=/获赞\s*\d/').first().textContent({ timeout: 3000 }).catch(() => '');
    if (likesText) {
      const match = likesText.match(/(\d[\d,]*)/);
      if (match) info.likes = parseInt(match[1].replace(/,/g, ''), 10);
    }

    console.log(`  👤 抖音号: ${info.douyinId || '-'}`);
    console.log(`  📛 昵称:   ${info.nickname || '-'}`);
    console.log(`  🖼️ 头像:   ${info.avatar ? '已获取' : '-'}`);
    console.log(`  👥 关注:   ${info.following || 0}`);
    console.log(`  📈 粉丝:   ${info.followers || 0}`);
    console.log(`  ❤️ 获赞:   ${info.likes || 0}`);
  } catch (err) {
    console.warn(`  ⚠️ 采集账号信息出错: ${err.message}`);
  }

  return info;
}
```

---

### 修改 3：`index.js` — 在登录成功后调用账号信息同步

**位置**：`d:\project\video-batch\douyin-publish\index.js` 第 339–341 行附近

**现有代码**：
```js
        if (!loginSuccess) {
          console.error(`  ❌ 账号 [${accountId}] 登录超时，跳过此任务`);
          await apiClient.reportTaskStatus(token, task.productId, 'failed', '登录超时', taskId);
          continue;
        }

        await delay(3000);    // ← 第 340 行
```

**改为**：
```js
        if (!loginSuccess) {
          console.error(`  ❌ 账号 [${accountId}] 登录超时，跳过此任务`);
          await apiClient.reportTaskStatus(token, task.productId, 'failed', '登录超时', taskId);
          continue;
        }

        await delay(3000);

        // ★ 新增：登录成功后采集账号信息并同步到服务端
        await delay(2000); // 等待页面稳定
        const accountInfo = await fetchAccountInfo(page);
        await apiClient.updateAccount(token, accountInfo);
```

---

### 修改 4：`index.js` — require 引入

**位置**：`d:\project\video-batch\douyin-publish\index.js` 第 4 行之后

确保 `apiClient` 已正确导入（当前已存在 `const apiClient = require('./api-client');`，无需额外修改）。

---

## 变更文件清单

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `d:\project\video-batch\douyin-publish\api-client.js` | 修改 | 新增 `updateAccount()` 函数 + 导出 |
| 2 | `d:\project\video-batch\douyin-publish\index.js` | 修改 | 新增 `fetchAccountInfo()` 函数（约第 186 行后） |
| 3 | `d:\project\video-batch\douyin-publish\index.js` | 修改 | 在登录成功后（第 340 行 `await delay(3000)` 之后）插入账号采集与同步调用 |

---

## 假设与决策

1. **采集时机**：仅在「检测到未登录 → 用户完成手动登录」后执行，已登录（session 复用）时**不重复采集**——因为 session 有效期内信息不会变，且避免每个任务都触发额外 API 调用。
2. **页面等待**：登录成功后已有 `delay(3000)`，再追加 `delay(2000)` 确保页面渲染完成再采集。
3. **API 参数**：`/base/account/create` 使用 POST + JSON body，字段名采用驼峰命名（`douyinId`, `nickname`, `avatar`, `following`, `followers`, `likes`），与服务端 Java 端保持一致。
4. **容错**：采集失败不影响主流程，仅打印 warn 日志并继续发布任务。API 调用失败同样不阻塞后续流程。
5. **选择器策略**：基于正则文本匹配（`text=/抖音号[：:]/`），不依赖动态 class 名，适应抖音页面更新。

---

## 验证步骤

1. 启动 mock-server：`node mock-server.js`
2. 设置环境变量指向本地 mock：`$env:API_HOST='localhost'`
3. 启动主程序：`node index.js`
4. 观察日志输出：
   - 登录成功后是否打印 `📊 采集账号信息...` 及六项数据
   - 是否打印 `📤 同步账号信息: ...` 及结果
   - 发布流程是否正常继续（不受采集/同步影响）
5. 在 mock-server 日志中确认收到 `POST /base/account/create` 请求
