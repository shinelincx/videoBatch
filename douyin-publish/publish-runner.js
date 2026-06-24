/**
 * 浏览器发布执行器
 * 按 PublishAccountService.startPublish 推送的 payload 执行视频发布全流程
 */
const path = require('path');
const fs = require('fs');
const HumanSimulator = require('./human-simulator');
const apiClient = require('./api-client');
const { executePublish } = require('./publish-flow');
const { showLoginExpiredAlert } = require('./login-notify');
const { AccountPublishScheduler, resolvePublishConcurrency } = require('./account-publish-scheduler');

const UPLOAD_URL = 'https://creator.douyin.com/';
const HOME_URL = 'https://creator.douyin.com/creator-micro/home';

/** 当前处于「发布中」的发布记录，stop 时批量标为失败 */
const publishingTasks = new Map();

function taskRecordId(task) {
  const id = task?.id ?? task?.publishRecordId;
  return id != null ? String(id) : null;
}

function trackPublishingTask(task) {
  const id = taskRecordId(task);
  if (id) publishingTasks.set(id, task);
}

function untrackPublishingTask(task) {
  const id = taskRecordId(task);
  if (id) publishingTasks.delete(id);
}

function authTokenOf(ctx) {
  if (typeof ctx === 'string') return ctx;
  if (typeof ctx?.getToken === 'function') return ctx.getToken();
  return ctx?.token;
}

async function callApi(ctx, action) {
  try {
    return await action(authTokenOf(ctx));
  } catch (err) {
    if (!(err instanceof apiClient.SessionExpiredError) || typeof ctx?.refreshAuth !== 'function') {
      throw err;
    }
    const token = await ctx.refreshAuth();
    return action(token || authTokenOf(ctx));
  }
}

function localDateTimeString(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(':');
}

/**
 * stop 指令：将仍在「发布中」的记录更新为「发布失败」
 * @param {string} token
 */
async function markStoppedPublishingFailed(authContext) {
  if (!authTokenOf(authContext) || publishingTasks.size === 0) return;
  const tasks = [...publishingTasks.values()];
  publishingTasks.clear();
  console.log(`\n⏹️ 将 ${tasks.length} 条「发布中」记录更新为「发布失败」`);
  for (const task of tasks) {
    try {
      await callApi(authContext, token => apiClient.reportPublishOutcome(token, task, 'failed', '客户端停止任务'));
    } catch (e) {
      console.warn(`  ⚠️ 更新发布记录失败: ${e.message}`);
    }
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
}

function getVideoFile(dir) {
  const exts = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const file = files.find(f => exts.includes(path.extname(f).toLowerCase()));
  return file ? path.join(dir, file) : null;
}

function cleanDir(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolvePublishBaseDir(task, ctx) {
  const configuredDir = cleanDir(ctx?.publishDir || process.env.PUBLISH_DIR);
  if (configuredDir) {
    return { dir: configuredDir, source: '客户端配置' };
  }

  const taskDir = cleanDir(task?.publishDir);
  return {
    dir: taskDir,
    source: taskDir ? '服务端任务' : '未配置',
  };
}

/**
 * 校验 startPublish 推送结构
 * @param {object} payload
 */
function validateStartPublishPayload(payload) {
  if (!payload) throw new Error('发布指令 payload 为空');
  if (payload.type !== 'startPublish') {
    throw new Error(`不支持的指令类型: ${payload.type}，期望 startPublish`);
  }
  if (payload.requirement !== 'publish') {
    throw new Error(`不支持的 requirement: ${payload.requirement}，期望 publish`);
  }
  if (!Array.isArray(payload.accounts) || payload.accounts.length === 0) {
    throw new Error('发布指令缺少 accounts 任务列表');
  }
}

/**
 * 将 accountTask.products[] 中的商品规范化为发布任务
 */
function normalizeProductTask(product, accountTask) {
  return {
    id: pick(product, 'id', 'publishRecordId'),
    publishRecordId: pick(product, 'publishRecordId', 'id'),
    publishAccountId: pick(product, 'publishAccountId') ?? accountTask.publishAccountId,
    accountId: pick(product, 'accountId', 'account_id') ?? accountTask.accountId,
    userId: pick(product, 'userId', 'user_id'),
    clipConfigId: pick(product, 'clipConfigId', 'clip_config_id'),
    productId: pick(product, 'productId', 'product_id'),
    productTitle: pick(product, 'productTitle', 'product_title') || '',
    productContent: pick(product, 'productContent', 'product_content') || '',
    productLink: pick(product, 'productLink', 'product_link') || '',
    createTime: pick(product, 'createTime', 'create_time'),
    publishDir: pick(product, 'publishDir', 'publish_dir') || '',
    isCarrier: pick(product, 'isCarrier', 'is_carrier'),
    selfDeclaration: pick(product, 'selfDeclaration', 'self_declaration') || '无需添加自主声明',
    syncPublish: pick(product, 'syncPublish', 'sync_publish') || '不同时发布',
    visibility: pick(product, 'visibility') || '公开',
    savePermission: pick(product, 'savePermission', 'save_permission') || '允许',
    publishTime: pick(product, 'publishTime', 'publish_time') || '立即发布',
    publishDelay: Number(pick(product, 'publishDelay', 'publish_delay') ?? 0),
    nickname: pick(product, 'nickname', 'displayNickname', 'accountNickname')
      ?? pick(accountTask, 'nickname', 'displayNickname', 'accountNickname')
      ?? pick(accountTask?.account, 'nickname', 'displayNickname')
      ?? pick(accountTask?.publishAccount, 'displayNickname', 'nickname'),
  };
}

/** 清空浏览器上下文中的抖音 Cookie（换账号 / 重登前必须执行） */
async function clearDouyinCookies(context, page) {
  try {
    const cookies = await context.cookies();
    const douyinCount = cookies.filter(c => c.domain && c.domain.includes('douyin.com')).length;
    if (cookies.length > 0) {
      await context.clearCookies();
    }
    if (page) {
      try {
        await page.evaluate(() => {
          try { localStorage.clear(); sessionStorage.clear(); } catch { /* cross-origin */ }
        });
      } catch { /* ignore */ }
    }
    if (douyinCount > 0 || cookies.length > 0) {
      console.log(`  🧹 已清空本地 Cookie（抖音 ${douyinCount} 条，合计 ${cookies.length} 条）`);
    }
  } catch (err) {
    console.warn(`  ⚠️ 清空 Cookie 失败: ${err.message}`);
  }
}

/**
 * 检测是否处于登录页 / 未登录状态
 * @param {object} page
 * @param {{ waitMs?: number, verbose?: boolean }} [options]
 */
async function detectLoginRequired(page, options = {}) {
  const waitMs = options.waitMs ?? 2000;
  const verbose = options.verbose ?? false;
  const detection = { needLogin: true };

  if (verbose) {
    console.log('\n' + '═'.repeat(70));
    console.log('🔐 登录状态检测');
    console.log('═'.repeat(70) + '\n');
  }

  try {
    if (waitMs > 0) await delay(waitMs);

    const currentUrl = page.url();
    const loginUrlPatterns = [/\/login/i, /\/signin/i, /\/auth/i, /open\.douyin\.com.*oauth/i];
    if (loginUrlPatterns.some(p => p.test(currentUrl))) {
      if (verbose) console.log('   📊 判定: 【需要登录】(URL匹配登录页)\n');
      return detection;
    }

    const hasLoginUI = await page.getByText(/扫码登录|手机号登录|短信验证码登录/i).first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    if (hasLoginUI) {
      if (verbose) console.log('   📊 判定: 【需要登录】(检测到登录界面)\n');
      return detection;
    }

    const loggedInSelectors = [
      '[class*="avatar"] img, [class*="user-avatar"], [class*="Avatar"]',
      'input[type="file"][accept*="video"]',
      '[class*="unique_id-"]',
      '[class*="name-"]',
    ];

    let loggedInCount = 0;
    for (const selector of loggedInSelectors) {
      try {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          const visible = await elements.first().isVisible({ timeout: 2000 }).catch(() => false);
          if (visible) loggedInCount++;
        }
      } catch { /* skip */ }
    }

    if (loggedInCount >= 1) {
      detection.needLogin = false;
      if (verbose) console.log(`   📊 判定: 【已登录】(${loggedInCount} 个信号)\n`);
    } else if (verbose) {
      console.log('   📊 判定: 【需要登录】\n');
    }
  } catch (error) {
    console.error(`   💥 检测异常: ${error.message}`);
  }

  return detection;
}

async function checkLoginStatusImproved(page) {
  return detectLoginRequired(page, { waitMs: 10000, verbose: true });
}

async function syncAccountToServer(apiContext, accountId, page, context, extra = {}) {
  const accountInfo = await fetchAccountInfo(page);
  if (!accountInfo.douyinId && !accountInfo.nickname && !accountInfo.avatar) {
    console.warn('  ⚠️ 未能采集到任何账号信息，跳过同步到服务端');
    return false;
  }
  const ok = await callApi(apiContext, token => apiClient.updateAccount(token, accountId, {
    douyinId: accountInfo.douyinId,
    nickname: accountInfo.nickname,
    avatar: accountInfo.avatar,
    followers: accountInfo.followers,
    ...extra,
  }));
  if (ok) {
    console.log('  ✅ 账号信息已同步到服务端，登录 Cookie 保留在客户端本地');
  } else {
    console.warn('  ⚠️ 账号信息同步到服务端失败（接口返回异常或网络错误）');
  }
  return ok;
}

async function fetchAccountInfo(page) {
  const info = { douyinId: '', nickname: '', avatar: '', following: 0, followers: 0, likes: 0 };
  try {
    // 头像：多套选择器兜底
    const avatarSelectors = [
      '[class*="img-PeynF_"]',
      '[class*="avatar"] img',
      'img[class*="avatar"]',
      '[class*="Avatar"] img',
      'img[src*="douyinpic.com"]',
    ];
    for (const sel of avatarSelectors) {
      try {
        const src = await page.locator(sel).first()
          .getAttribute('src', { timeout: 2000 }).catch(() => '');
        if (src) { info.avatar = src; break; }
      } catch { /* try next */ }
    }

    // 抖音号：多套选择器兜底
    const douyinIdSelectors = [
      '[class*="unique_id-EuH8eA"]',
      '[class*="unique-id"]',
      '[class*="uniqueId"]',
      '[class*="douyin-id"]',
      'span:text-matches("抖音号") ~ span',
    ];
    for (const sel of douyinIdSelectors) {
      try {
        const text = await page.locator(sel).first()
          .textContent({ timeout: 2000 }).catch(() => '');
        if (text) {
          info.douyinId = text.replace(/抖音号[：:]\s*/, '').trim();
          if (info.douyinId) break;
        }
      } catch { /* try next */ }
    }

    // 昵称：多套选择器兜底
    const nicknameSelectors = [
      '[class*="name-_lSSDc"]',
      '[class*="nickname"]',
      '[class*="nickName"]',
      '[class*="profile"] [class*="name"]',
      'h1[class*="name"]',
    ];
    for (const sel of nicknameSelectors) {
      try {
        const text = await page.locator(sel).first()
          .textContent({ timeout: 2000 }).catch(() => '');
        if (text) { info.nickname = text.trim(); break; }
      } catch { /* try next */ }
    }

    // 粉丝数
    const followerSelectors = [
      '[class*="follower"] [class*="count"]',
      '[class*="follower-count"]',
      'span:text-matches("粉丝") + span',
      '[class*="follow-count"]',
    ];
    for (const sel of followerSelectors) {
      try {
        const text = await page.locator(sel).first()
          .textContent({ timeout: 2000 }).catch(() => '');
        if (text) {
          const num = parseInt(text.replace(/[^0-9万w亿]/gi, ''), 10);
          if (!isNaN(num) && num > 0) { info.followers = num; break; }
        }
      } catch { /* try next */ }
    }

    console.log(`  📋 采集账号信息: 昵称="${info.nickname}", 抖音号="${info.douyinId}", 粉丝=${info.followers}`);
  } catch (err) {
    console.warn(`  ⚠️ 采集账号信息出错: ${err.message}`);
  }
  return info;
}

/**
 * @param {object} loginOptions - { token, nickname, refreshAuth } 传入时会校验本地登录会话并处理过期重登
 */
async function ensureSession(sessionManager, accountId, loginOptions = null) {
  let session = sessionManager.getSession(accountId);
  if (session) {
    const alive = await sessionManager.isSessionAlive(accountId);
    if (!alive) {
      sessionManager.removeSession(accountId);
      session = null;
    }
  }

  if (!session) {
    const onDisk = sessionManager.hasSessionOnDisk(accountId);
    console.log(onDisk
      ? `  🔄 账号 [${accountId}] 复用已有登录数据`
      : `  🆕 账号 [${accountId}] 首次使用，创建新会话`);
    session = await sessionManager.createSession(accountId);
  }

  if (loginOptions?.token) {
    console.log('  🔐 使用客户端本地保存的登录会话');

    const ok = await verifyAndRecoverLogin(
      session.page,
      session.context,
      accountId,
      loginOptions,
      loginOptions.nickname,
      sessionManager
    );
    if (!ok) {
      throw new Error(`账号 [${accountId}] 登录失败或超时`);
    }
  }

  return session;
}

async function navigateHome(page) {
  try {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log(`  ✅ 首页已打开: ${page.url()}`);
  } catch (err) {
    console.warn(`  ⚠️ 首页导航警告: ${err.message}`);
  }
}

async function waitForLogin(page, accountId, nickname, options = {}) {
  if (!options.forceWait) {
    const loginStatus = await detectLoginRequired(page, { waitMs: 1000 });
    if (!loginStatus.needLogin) {
      console.log(`  ✅ 账号 [${accountId}] 已处于登录状态`);
      return true;
    }
  }

  try {
    await page.goto('https://creator.douyin.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    console.warn(`  ⚠️ 登录页导航警告: ${err.message}`);
  }

  console.log('💡 请在浏览器窗口中完成登录（扫码或手机号+验证码）');
  const maxWait = process.env.HEADLESS === 'true' ? 30 : 180;
  const iterations = Math.floor(maxWait / 10);

  for (let i = 0; i < iterations; i++) {
    await delay(10000);
    console.log(`  ⏳ 仍在等待... (${(i + 1) * 10} 秒)`);
    const hasLoginUI = await page.getByText(/扫码登录|手机号登录|短信验证码登录/i).first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    const hasUploadUI = await page.locator('input[type="file"][accept*="video"]').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    const hasDouyinId = await page.locator('[class*="unique_id-"]').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasLoginUI && (hasUploadUI || hasDouyinId)) {
      console.log(`  ✅ 登录成功 (第 ${(i + 1) * 10} 秒)\n`);
      return true;
    }
  }

  console.error(`  ❌ 账号 [${accountId}] 登录超时`);
  return false;
}

/**
 * 校验本地登录状态；失效时弹窗提醒并等待用户重新扫码登录。
 */
async function verifyAndRecoverLogin(page, context, accountId, apiContext, nickname, sessionManager = null) {
  if (sessionManager?.isAccountAuthenticated(accountId)) {
    await navigateHome(page);
    const loginStatus = await detectLoginRequired(page, { waitMs: 2000, verbose: false });
    if (!loginStatus.needLogin) {
      console.log(`  ✅ 账号 [${accountId}] 已登录（本批次已认证）`);
      return true;
    }
  }

  await navigateHome(page);
  const loginStatus = await detectLoginRequired(page, { waitMs: 3000, verbose: true });
  if (!loginStatus.needLogin) {
    console.log(`  ✅ 账号 [${accountId}] 本地登录会话有效`);
    if (sessionManager) sessionManager.markAccountAuthenticated(accountId);
    return true;
  }

  console.log(`  ⚠️ 账号 [${accountId}] 本地登录会话失效，需重新扫码`);
  showLoginExpiredAlert(nickname);

  const ok = await waitForLogin(page, accountId, nickname, { forceWait: true });
  if (!ok) return false;

  await delay(3000);
  await navigateHome(page);
  await delay(2000);
  try {
    await syncAccountToServer(apiContext, accountId, page, context);
  } catch (err) {
    console.warn(`  ⚠️ 账号信息同步异常（不阻断登录流程）: ${err.message}`);
  }
  if (sessionManager) sessionManager.markAccountAuthenticated(accountId);
  return true;
}

async function ensureLoggedIn(page, accountId, token, nickname, sessionManager = null) {
  const context = page.context();
  return verifyAndRecoverLogin(page, context, accountId, { token }, nickname, sessionManager);
}

async function runForcedLogin(accountId, nickname, ctx) {
  await ctx.sessionManager.closeOtherSessions(accountId);
  let session = ctx.sessionManager.getSession(accountId);
  if (!session || !(await ctx.sessionManager.isSessionAlive(accountId))) {
    session = await ctx.sessionManager.createSession(accountId);
  }
  const { page, context } = session;

  console.log('  🌐 打开创作中心登录页');
  try {
    await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    console.warn(`  ⚠️ 首次打开创作中心警告: ${err.message}`);
  }

  await clearDouyinCookies(context, page);

  console.log('  🔁 Cookie 已清空，重新打开创作中心');
  try {
    await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    console.warn(`  ⚠️ 重新打开创作中心警告: ${err.message}`);
  }

  showLoginExpiredAlert(nickname);
  const ok = await waitForLogin(page, accountId, nickname, { forceWait: true });
  if (!ok) {
    throw new Error(`账号 [${accountId}] 登录失败或超时`);
  }

  await delay(3000);
  await navigateHome(page);
  await delay(2000);
  try {
    await syncAccountToServer(ctx, accountId, page, context, {
      lastLoginTime: localDateTimeString(),
    });
  } catch (err) {
    console.warn(`  ⚠️ 账号信息同步异常（不阻断登录流程）: ${err.message}`);
  }
  ctx.sessionManager.markAccountAuthenticated(accountId);
  await ctx.sessionManager.closeSession(accountId);
  return true;
}

async function runPublishTask(task, ctx) {
  const sessionManager = ctx.sessionManager;
  const taskId = task.id ?? task.publishRecordId;
  const accountId = String(task.accountId || 'default');
  const productId = String(task.productId || '');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 发布记录 #${taskId} (账号: ${accountId})`);
  console.log(`   商品ID: ${productId}`);
  console.log(`   📝 标题: "${task.productTitle}"`);
  console.log(`   🔗 挂车: ${task.isCarrier == 1 ? '是' : '否'}`);
  console.log(`   ⏱️ 发布方式: ${task.publishTime}${task.publishTime === '定时发布' ? ` (+${task.publishDelay}小时)` : ''}`);
  console.log(`${'='.repeat(60)}`);

  await callApi(ctx, freshToken => apiClient.reportPublishOutcome(freshToken, task, 'publishing'));
  trackPublishingTask(task);

  const session = await ensureSession(sessionManager, accountId, {
    token: ctx.token,
    nickname: task.nickname,
    refreshAuth: ctx.refreshAuth,
  });
  const { page } = session;
  const human = new HumanSimulator(page);

  if (!page.url().includes('/creator-micro/home')) {
    await navigateHome(page);
    await delay(2000);
  }

  const publishBase = resolvePublishBaseDir(task, ctx);
  const materialDir = publishBase.dir && productId
    ? path.join(publishBase.dir, productId)
    : '';
  const videoPath = materialDir ? getVideoFile(materialDir) : null;

  if (!videoPath) {
    const failReason = `素材目录中未找到视频文件: ${materialDir || '-'}`;
    console.error(`  ❌ 发布目录: ${publishBase.dir || '-'} (${publishBase.source})`);
    console.error(`  ❌ ${failReason}`);
    untrackPublishingTask(task);
    await callApi(ctx, freshToken => apiClient.reportPublishOutcome(freshToken, task, 'failed', failReason));
    return false;
  }

  console.log(`  📁 发布目录: ${publishBase.dir} (${publishBase.source})`);
  console.log(`  📂 素材目录: ${materialDir}`);
  console.log(`  🎞️ 视频文件: ${path.basename(videoPath)}`);

  const taskParams = {
    videoPath,
    title: task.productTitle,
    description: task.productContent,
    visibility: task.visibility,
    uploadUrl: UPLOAD_URL,
    isCarrier: task.isCarrier,
    productLink: task.productLink,
    publishTime: task.publishTime,
    publishDelay: task.publishDelay,
    selfDeclaration: task.selfDeclaration,
    syncPublish: task.syncPublish,
    savePermission: task.savePermission,
  };

  const MAX_RETRIES = 2;
  let result = null;
  let attempt = 0;
  const failedStepsLog = [];
  const stepMap = {
    step1: '点击发布视频', step2: '点击上传视频', step3: '选择视频文件',
    step4: '填写标题描述', step5: '选择推荐标签', step6: '自主声明设置',
    step7: '谁可以看', step8: '定时发布设置', step9: '选择推荐封面',
    step10: '点击发布', carrier: '添加商品链接',
  };

  for (attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`🔄 发布尝试: ${attempt === 0 ? '首次' : `第${attempt}次重试`} (${attempt + 1}/${MAX_RETRIES + 1})`);
    console.log(`${'─'.repeat(50)}`);

    result = await executePublish(page, human, taskParams);

    if (!result.success) {
      const failedSteps = Object.entries(stepMap)
        .filter(([key]) => result.stepResults[key] === false)
        .map(([, desc]) => desc);
      failedStepsLog.push({ attempt: attempt + 1, failedSteps });
      console.log(`  ⚠️ 失败步骤: ${failedSteps.join('、') || '未知'}`);
    }

    if (result.success && result.publishClicked) {
      console.log('  ✅ 发布流程全部步骤成功！');
      break;
    }

    if (attempt < MAX_RETRIES) {
      console.log('  🔄 返回 Step 1，重新进入发布流程...');
      await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(3000);
    }
  }

  const stillPublishing = publishingTasks.has(taskRecordId(task));
  untrackPublishingTask(task);

  if (ctx.shouldAbort?.()) {
    if (stillPublishing) {
      await callApi(ctx, freshToken => apiClient.reportPublishOutcome(freshToken, task, 'failed', '客户端停止任务'));
    }
    console.log(`\n⏹️ 发布记录 #${taskId} 因 stop 指令标记为发布失败`);
    return false;
  }

  let success = false;
  if (result.success && result.publishClicked) {
    await callApi(ctx, freshToken => apiClient.reportPublishOutcome(freshToken, task, 'completed'));
    console.log(`\n✅ 发布记录 #${taskId} 发布成功`);
    success = true;
  } else if (result.error) {
    await callApi(ctx, freshToken => apiClient.reportPublishOutcome(freshToken, task, 'failed', result.error));
    console.log(`\n❌ 发布记录 #${taskId} 发布失败: ${result.error}`);
  } else {
    const uniqueFailed = [...new Set(failedStepsLog.flatMap(log => log.failedSteps))];
    const failReason = `发布步骤失败(重试${attempt}次后): ${uniqueFailed.join('、') || '未知'}`;
    await callApi(ctx, freshToken => apiClient.reportPublishOutcome(freshToken, task, 'failed', failReason));
    console.log(`\n❌ 发布记录 #${taskId} 发布失败: ${failReason}`);
  }

  try {
    await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);
  } catch (e) {
    console.warn(`  ⚠️ 页面重置导航失败: ${e.message}`);
  }

  return success;
}

async function runPublishTaskSafely(task, ctx) {
  try {
    return await runPublishTask(task, ctx);
  } catch (err) {
    console.error(`\n鉂?鍙戝竷寮傚父: ${err.message}`);
    untrackPublishingTask(task);
    try {
      await callApi(ctx, token => apiClient.reportPublishOutcome(token, task, 'failed', `鍙戝竷寮傚父: ${err.message}`));
    } catch (e) {
      console.error(`  鈿狅笍 鐘舵€佷笂鎶ュけ璐? ${e.message}`);
    }
    return false;
  }
}

function accountIdOfTask(task) {
  return String(task?.accountId || 'default');
}

function createBatchScheduler(ctx, counters) {
  return new AccountPublishScheduler({
    getConcurrency: () => ctx.publishConcurrency,
    runTask: async (task) => {
      await ctx.waitWhilePaused?.();
      if (ctx.shouldAbort?.()) return false;
      counters.processed++;
      const ok = await runPublishTaskSafely(task, ctx);
      if (ok) counters.successCount++;
      return ok;
    },
    onAccountComplete: async (accountId) => {
      if (accountId != null && !ctx.shouldAbort?.()) {
        await callApi(ctx, token => apiClient.syncPublishAccountStatus(token, accountId, '姝ｅ湪寰呮満'));
      }
    },
  });
}

/**
 * 执行 startPublish 推送的完整发布任务
 * payload 结构见 PublishAccountService.startPublish
 */
async function runPublishPayloadLegacy(payload, ctx) {
  validateStartPublishPayload(payload);

  const total = Number(payload.totalProductCount || 0);
  console.log('\n🚀 收到 startPublish 指令');
  console.log(`   robotId: ${payload.robotId}`);
  console.log(`   发布账号: ${JSON.stringify(payload.publishAccountIds || [])}`);
  console.log(`   商品总数: ${total || '未知'}`);
  console.log(`   账号任务数: ${payload.accounts.length}`);

  ctx.sessionManager?.resetAuthState?.();

  let processed = 0;
  let successCount = 0;

  for (const accountTask of payload.accounts) {
    await ctx.waitWhilePaused?.();
    if (ctx.shouldAbort?.()) {
      console.log('\n⏹️ 收到 stop 指令，停止后续发布');
      break;
    }

    const accountId = accountTask.accountId;
    const products = Array.isArray(accountTask.products) ? accountTask.products : [];
    const categoryName = accountTask.productCategoryName || accountTask.productCategoryId || '-';

    console.log(`\n${'█'.repeat(60)}`);
    console.log(`👤 账号 [${accountId}] 品类: ${categoryName}`);
    console.log(`   今日已发: ${accountTask.todayPublishCount ?? 0} / 每日上限: ${accountTask.dailyMaxPublishCount ?? '-'}`);
    console.log(`   本批商品: ${products.length} 个`);
    console.log(`${'█'.repeat(60)}`);

    for (const product of products) {
      await ctx.waitWhilePaused?.();
      if (ctx.shouldAbort?.()) {
        console.log('\n⏹️ 收到 stop 指令，停止当前账号后续商品');
        break;
      }

      processed++;
      const task = normalizeProductTask(product, accountTask);
      console.log(`\n📦 总进度: ${processed}/${total || products.length}`);

      try {
        const ok = await runPublishTask(task, ctx);
        if (ok) successCount++;
      } catch (err) {
        console.error(`\n❌ 发布异常: ${err.message}`);
        untrackPublishingTask(task);
        try {
          await callApi(ctx, token => apiClient.reportPublishOutcome(token, task, 'failed', `发布异常: ${err.message}`));
        } catch (e) {
          console.error(`  ⚠️ 状态上报失败: ${e.message}`);
        }
      }
    }

    if (accountId != null && !ctx.shouldAbort?.()) {
      await callApi(ctx, token => apiClient.syncPublishAccountStatus(token, accountId, '正在待机'));
    }
  }

  if (ctx.shouldAbort?.()) {
    await markStoppedPublishingFailed(ctx);
    console.log(`\n⏹️ 发布批次因 stop 指令中止: 成功 ${successCount} / 处理 ${processed}`);
  } else {
    console.log(`\n✅ startPublish 执行完毕: 成功 ${successCount} / 处理 ${processed}`);
  }
}

/**
 * 执行 /publish/account/pending_publish/matches 返回的扁平待发布任务列表
 */
async function runPendingPublishTasksLegacy(tasks, ctx) {
  const pendingTasks = Array.isArray(tasks) ? tasks : [];
  if (pendingTasks.length === 0) {
    console.log('  ⏳ 暂无待发布商品');
    return { processed: 0, successCount: 0 };
  }

  console.log(`\n🚀 开始处理待发布商品: ${pendingTasks.length} 个`);
  ctx.sessionManager?.resetAuthState?.();

  let processed = 0;
  let successCount = 0;

  for (const product of pendingTasks) {
    await ctx.waitWhilePaused?.();
    if (ctx.shouldAbort?.()) {
      console.log('\n⏹️ 收到 stop 指令，停止后续待发布商品');
      break;
    }

    processed++;
    const task = normalizeProductTask(product, product || {});
    console.log(`\n📦 轮询发布进度: ${processed}/${pendingTasks.length}`);

    try {
      const ok = await runPublishTask(task, ctx);
      if (ok) successCount++;
    } catch (err) {
      console.error(`\n❌ 发布异常: ${err.message}`);
      untrackPublishingTask(task);
      try {
        await callApi(ctx, token => apiClient.reportPublishOutcome(token, task, 'failed', `发布异常: ${err.message}`));
      } catch (e) {
        console.error(`  ⚠️ 状态上报失败: ${e.message}`);
      }
    }
  }

  if (ctx.shouldAbort?.()) {
    await markStoppedPublishingFailed(ctx);
    console.log(`\n⏹️ 轮询发布中止: 成功 ${successCount} / 处理 ${processed}`);
  } else {
    console.log(`\n✅ 轮询发布完成: 成功 ${successCount} / 处理 ${processed}`);
  }

  return { processed, successCount };
}

/**
 * 执行 login 指令（publishAccountLogin）
 */
async function runLoginPayload(payload, ctx) {
  if (!payload || payload.type !== 'publishAccountLogin') {
    console.warn(`  ⚠️ 非 publishAccountLogin 指令: ${payload?.type}`);
  }

  const accountId = String(pick(payload, 'accountId', 'account_id') || '');
  if (!accountId) {
    console.warn('  ⚠️ 登录指令缺少 accountId');
    return;
  }

  const nickname = pick(payload, 'nickname', 'displayNickname', 'accountNickname')
    ?? pick(payload?.account, 'nickname', 'displayNickname')
    ?? pick(payload?.publishAccount, 'displayNickname', 'nickname');
  console.log(`\n🔐 执行登录指令，账号: ${accountId}`);
  let ok = false;
  let errorReason = '';
  await callApi(ctx, token => apiClient.syncPublishAccountLoginStatus(token, accountId, '未登录'));
  try {
    await runForcedLogin(accountId, nickname, ctx);
    ok = true;
  } catch (err) {
    errorReason = err?.message || '登录失败';
    console.error(`  ❌ 登录失败: ${errorReason}`);
  }
  if (ok) {
    await callApi(ctx, token => apiClient.syncPublishAccountLoginStatus(token, accountId, '已登录'));
    console.log(`\n✅ 账号 [${accountId}] 登录流程完成`);
  } else {
    await callApi(ctx, token => apiClient.syncPublishAccountLoginStatus(token, accountId, '异常', errorReason));
  }
}

function parseCommandPayload(response) {
  const raw = response?.payload;
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    console.warn(`  ⚠️ 指令 payload 解析失败: ${err.message}`);
    return null;
  }
}

async function runPublishPayload(payload, ctx) {
  validateStartPublishPayload(payload);

  const total = Number(payload.totalProductCount || 0);
  console.log('\n🚀 收到 startPublish 指令');
  console.log(`   robotId: ${payload.robotId}`);
  console.log(`   发布账号: ${JSON.stringify(payload.publishAccountIds || [])}`);
  console.log(`   商品总数: ${total || '未知'}`);
  console.log(`   账号任务数: ${payload.accounts.length}`);
  console.log(`   账号并发数: ${resolvePublishConcurrency(ctx.publishConcurrency)}`);

  ctx.sessionManager?.resetAuthState?.();

  const counters = { processed: 0, successCount: 0 };
  const scheduler = createBatchScheduler(ctx, counters);

  for (const accountTask of payload.accounts) {
    await ctx.waitWhilePaused?.();
    if (ctx.shouldAbort?.()) {
      console.log('\n⏹️ 收到 stop 指令，停止后续发布');
      break;
    }

    const accountId = accountTask.accountId;
    const products = Array.isArray(accountTask.products) ? accountTask.products : [];
    const categoryName = accountTask.productCategoryName || accountTask.productCategoryId || '-';

    console.log(`\n${'▰'.repeat(60)}`);
    console.log(`👤 账号 [${accountId}] 品类: ${categoryName}`);
    console.log(`   今日已发: ${accountTask.todayPublishCount ?? 0} / 每日上限: ${accountTask.dailyMaxPublishCount ?? '-'}`);
    console.log(`   本批商品: ${products.length} 个`);
    console.log(`${'▰'.repeat(60)}`);

    scheduler.enqueueTasks(products.map(product => normalizeProductTask(product, accountTask)));
  }

  await scheduler.waitForIdle();

  if (ctx.shouldAbort?.()) {
    await markStoppedPublishingFailed(ctx);
    console.log(`\n⏹️ 发布批次因 stop 指令中止: 成功 ${counters.successCount} / 处理 ${counters.processed}`);
  } else {
    console.log(`\n✅ startPublish 执行完毕: 成功 ${counters.successCount} / 处理 ${counters.processed}`);
  }
}

async function runPendingPublishTasks(tasks, ctx) {
  const pendingTasks = Array.isArray(tasks) ? tasks : [];
  if (pendingTasks.length === 0) {
    console.log('  ⏳ 暂无待发布商品');
    return { processed: 0, successCount: 0 };
  }

  console.log(`\n🚀 开始处理待发布商品: ${pendingTasks.length} 个`);
  console.log(`   账号并发数: ${resolvePublishConcurrency(ctx.publishConcurrency)}`);
  ctx.sessionManager?.resetAuthState?.();

  const counters = { processed: 0, successCount: 0 };
  const scheduler = createBatchScheduler(ctx, counters);
  scheduler.enqueueTasks(pendingTasks.map(product => normalizeProductTask(product, product || {})));
  await scheduler.waitForIdle();

  if (ctx.shouldAbort?.()) {
    await markStoppedPublishingFailed(ctx);
    console.log(`\n⏹️ 轮询发布中止: 成功 ${counters.successCount} / 处理 ${counters.processed}`);
  } else {
    console.log(`\n✅ 轮询发布完成: 成功 ${counters.successCount} / 处理 ${counters.processed}`);
  }

  return counters;
}

module.exports = {
  runPublishPayload,
  runLoginPayload,
  parseCommandPayload,
  validateStartPublishPayload,
  normalizeProductTask,
  accountIdOfTask,
  runPublishTask,
  runPublishTaskSafely,
  runPendingPublishTasks,
  markStoppedPublishingFailed,
  resolvePublishConcurrency,
};
