/**
 * 多账号会话管理器
 * 按抖音账号ID管理独立的 browser persistent context
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');
const { APP_ROOT } = require('./load-env');

const { chromium } = require('playwright');

/** 基础会话目录 */
const BASE_SESSION_DIR = path.join(APP_ROOT, '.douyin-session');

/**
 * 强制杀死占用指定 user-data-dir 的 Chrome 进程
 *
 * 当 context.close() 挂死 / 超时后，浏览器进程可能仍然存活并独占 session 目录。
 * 如果不杀死，下一次 launchPersistentContext 会因目录锁而阻塞，导致整个调度卡死。
 *
 * @param {string} sessionDir - 会话目录的绝对路径
 */
function forceKillChromeByUserDataDir(sessionDir) {
  const absDir = path.resolve(sessionDir);
  // 将路径写入临时 .ps1 脚本，避免内联转义问题
  const scriptPath = path.join(os.tmpdir(), `_kchrome_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.ps1`);
  try {
    fs.writeFileSync(scriptPath, [
      `$ErrorActionPreference = 'SilentlyContinue'`,
      `$dir = '${absDir.replace(/'/g, "''")}'`,
      `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*$dir*" } | ForEach-Object {`,
      `  Stop-Process -Id $_.ProcessId -Force`,
      `  Write-Host "  🗑️ 已强制终止残留 Chrome 进程 PID: $($_.ProcessId)"`,
      `}`,
    ].join('\n'));
    const result = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { timeout: 15000, encoding: 'utf-8', stdio: 'pipe', windowsHide: true }
    );
    const trimmed = result.trim();
    if (trimmed) console.log(trimmed);
  } catch (e) {
    // 没有匹配的进程时会抛非零退出码，属于正常情况
  } finally {
    try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }
  }
}

const { findChromeExecutable, getBrowserLaunchConfig } = require('./browser-path');

/** @returns {object} 浏览器配置对象 */
function getBrowserConfig() {
  return getBrowserLaunchConfig();
}

class SessionManager {
  constructor() {
    /** @type {Map<string, {context: object, page: object}>} */
    this.sessions = new Map();
    /** 当前正在准备登录态的账号（用于检测换账号） */
    this._lastAuthAccountId = null;
    /** 本批次内已完成扫码/同步的账号 */
    this._authenticatedAccountIds = new Set();
  }

  /**
   * 检测是否切换了账号（换账号时需清空本地 Cookie）
   * @param {string} accountId
   * @returns {boolean}
   */
  markAccountSwitch(accountId) {
    const id = String(accountId);
    const switched = this._lastAuthAccountId !== null && this._lastAuthAccountId !== id;
    this._lastAuthAccountId = id;
    return switched;
  }

  isAccountAuthenticated(accountId) {
    return this._authenticatedAccountIds.has(String(accountId));
  }

  markAccountAuthenticated(accountId) {
    this._authenticatedAccountIds.add(String(accountId));
  }

  resetAuthState() {
    this._lastAuthAccountId = null;
    this._authenticatedAccountIds.clear();
  }

  /**
   * 获取账号的 session 目录路径
   */
  _getSessionDir(accountId) {
    return path.join(BASE_SESSION_DIR, String(accountId));
  }

  /**
   * 检查磁盘上是否存在该账号的 session 数据
   * 用于区分"进程重启复用会话"和"真正首次创建"
   * @param {string} accountId
   * @returns {boolean}
   */
  hasSessionOnDisk(accountId) {
    const sessionDir = this._getSessionDir(accountId);
    return fs.existsSync(sessionDir);
  }

  /**
   * 获取指定账号的浏览器会话
   * @param {string} accountId - 账号唯一标识
   * @returns {{context: object, page: object}|null}
   */
  getSession(accountId) {
    return this.sessions.get(String(accountId)) || null;
  }

  getOpenAccountIds() {
    return Array.from(this.sessions.keys());
  }

  /**
   * 检测会话是否存活（浏览器未被手动关闭、page 未崩溃）
   * @param {string} accountId
   * @returns {Promise<boolean>}
   */
  async isSessionAlive(accountId) {
    const session = this.sessions.get(String(accountId));
    if (!session) return false;

    try {
      // 尝试在页面执行简单操作，验证 page/context 是否仍可用
      await session.page.evaluate(() => true);
      return true;
    } catch (e) {
      console.warn(`  ⚠️ 账号 [${accountId}] 会话检测失败: ${e.message.substring(0, 60)}`);
      return false;
    }
  }

  /**
   * 从内存中移除会话记录（不关闭浏览器，不删除磁盘数据）
   * 用于标记失效会话，以便下次任务重新创建
   * @param {string} accountId
   */
  removeSession(accountId) {
    this.sessions.delete(String(accountId));
  }

  /**
   * 为指定账号创建新的持久化浏览器上下文
   * @param {string} accountId - 账号唯一标识
   * @returns {Promise<{context: object, page: object}>}
   */
  async createSession(accountId) {
    const id = String(accountId);

    const sessionDir = this._getSessionDir(id);

    console.log(`\n🔑 创建账号 [${id}] 的浏览器会话...`);
    console.log(`  📂 会话目录: ${sessionDir}`);

    // 确保目录存在
    fs.mkdirSync(sessionDir, { recursive: true });

    // 清理 Chrome 锁文件，防止残留进程导致启动失败
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    for (const lockFile of lockFiles) {
      const lockPath = path.join(sessionDir, lockFile);
      try {
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
          console.log(`  🗑️ 已清理锁文件: ${lockFile}`);
        }
      } catch (e) {
        console.warn(`  ⚠️ 清理锁文件失败: ${lockFile} - ${e.message}`);
      }
    }

    // 启动前强制清理可能残留的 Chrome 进程（上一轮 close 超时后留下的僵尸进程）
    forceKillChromeByUserDataDir(sessionDir);

    // 获取浏览器配置（内部已调用 findChromeExecutable 检测路径）
    const browserConfig = getBrowserConfig();
    const chromePath = browserConfig.executablePath || null;
    if (chromePath) {
      console.log(`  🌐 检测到 Chrome 浏览器: ${chromePath}`);
    } else {
      console.log(`  ⚠️ 未检测到系统 Chrome，将尝试使用 channel: 'chrome'`);
    }

    // 带重试的浏览器启动
    const MAX_LAUNCH_RETRIES = 2;
    let context = null;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_LAUNCH_RETRIES; attempt++) {
      try {
        context = await chromium.launchPersistentContext(sessionDir, browserConfig);
        break;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_LAUNCH_RETRIES) {
          console.warn(`  ⚠️ 浏览器启动失败 (第${attempt}次)，${2 * attempt}秒后重试...`);
          console.warn(`     错误: ${err.message.split('\n')[0]}`);
          await new Promise(r => setTimeout(r, 2000 * attempt));

          // 重试前再次清理锁文件
          for (const lockFile of lockFiles) {
            const lockPath = path.join(sessionDir, lockFile);
            try { fs.unlinkSync(lockPath); } catch (e) { /* ignore */ }
          }
          // 重试前再次强制清理残留 Chrome 进程
          forceKillChromeByUserDataDir(sessionDir);
        }
      }
    }

    if (!context) {
      const errorMsg = this._formatBrowserError(lastError);
      throw new Error(errorMsg);
    }

    // 注入反检测脚本
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {}, loadTimes: function () { }, csi: function () { } };
    });

    const page = context.pages()[0] || await context.newPage();
    this._bindSingleWindowGuard(context, page);
    this.sessions.set(id, { context, page });

    console.log(`  ✅ 账号 [${id}] 会话已创建（单窗口模式）`);
    return { context, page };
  }

  /**
   * 格式化浏览器启动错误信息，提供友好的提示
   * @param {Error} error - 原始错误对象
   * @returns {string} 格式化后的错误信息
   */
  _formatBrowserError(error) {
    const originalMsg = error?.message || '未知错误';
    
    if (originalMsg.includes('Executable doesn\'t exist')) {
      return `\n${'='.repeat(70)}
🚨 Chrome 浏览器启动失败
${'='.repeat(70)}

原因：系统中未找到 Chrome 浏览器

解决方案：

1️⃣ 安装 Google Chrome 浏览器
   → 下载地址: https://www.google.cn/chrome/

2️⃣ 如果 Chrome 已安装但仍报错，请设置环境变量：
   set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"

3️⃣ 或修改系统 PATH，确保 chrome.exe 所在目录在 PATH 中

常见 Chrome 安装路径：
   • C:\Program Files\Google\Chrome\Application\chrome.exe
   • C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
   • C:\Users\<用户名>\AppData\Local\Google\Chrome\Application\chrome.exe

${'='.repeat(70)}
原始错误: ${originalMsg}`;
    }
    
    return originalMsg;
  }

  /**
   * 检测并等待登录（复用 index.js 中已有的登录检测逻辑）
   * @param {string} accountId - 账号ID
   * @param {object} page - Playwright page 对象
   * @param {Function} checkLoginFn - 登录检测函数（由调用方传入）
   * @returns {Promise<boolean>} 是否已登录
   */
  async requireLogin(accountId, page, checkLoginFn) {
    const id = String(accountId);

    console.log(`\n🔐 检查账号 [${id}] 登录状态...`);
    const loginStatus = await checkLoginFn(page);

    if (!loginStatus.needLogin) {
      console.log(`  ✅ 账号 [${id}] 已登录，无需重新登录`);
      return true;
    }

    console.log(`\n⚠️ 账号 [${id}] 需要登录！`);
    console.log('💡 请在浏览器窗口中完成以下操作:');
    console.log('   方式1: 扫码登录 → 使用抖音APP扫描屏幕上的二维码');
    console.log('   方式2: 手机号+验证码登录\n');
    console.log('⏳ 等待登录完成（最多180秒）...\n');

    // 轮询等待登录
    for (let i = 0; i < 18; i++) { // 18 * 10秒 = 180秒
      await new Promise(r => setTimeout(r, 10000));

      try {
        const hasLoginUI = await page.getByText(/扫码登录|手机号登录|短信验证码登录/i).first()
          .isVisible({ timeout: 2000 }).catch(() => false);
        const hasUploadUI = await page.locator('input[type="file"][accept*="video"]').first()
          .isVisible({ timeout: 2000 }).catch(() => false);
        const hasDouyinId = await page.locator('[class*="unique_id-"]').first()
          .isVisible({ timeout: 2000 }).catch(() => false);

        if (!hasLoginUI && (hasUploadUI || hasDouyinId)) {
          console.log(`  ✅ 账号 [${id}] 登录成功！ (第 ${(i + 1) * 10} 秒)\n`);
          return true;
        }
        console.log(`  ⏳ 账号 [${id}] 仍在等待... (已等待 ${(i + 1) * 10} 秒)`);
      } catch (e) {
        console.log(`  ⚠️ 检测异常: ${e?.message?.substring?.(0, 40) || '未知错误'}`);
      }
    }

    console.log(`  ⚠️ 账号 [${id}] 登录等待超时 (180秒)`);
    return false;
  }

  /**
   * 关闭指定账号的会话
   * @param {string} accountId
   */
  async closeSession(accountId) {
    const id = String(accountId);
    const session = this.sessions.get(id);
    if (session) {
      const sessionDir = this._getSessionDir(id);
      let closeTimedOut = false;

      try {
        // 使用 Promise.race 添加超时保护，防止 context.close() 挂死
        const CLOSE_TIMEOUT = 15000; // 15秒超时
        await Promise.race([
          session.context.close(),
          new Promise((_, reject) =>
            setTimeout(() => {
              closeTimedOut = true;
              reject(new Error(`关闭超时(${CLOSE_TIMEOUT / 1000}秒)`));
            }, CLOSE_TIMEOUT)
          ),
        ]);
        console.log(`  🔒 账号 [${id}] 会话已关闭`);
      } catch (e) {
        console.warn(`  ⚠️ 关闭账号 [${id}] 会话时出错: ${e.message}`);
        // 超时或 close() 失败后，强制杀掉仍占用 session 目录的 Chrome 进程
        if (closeTimedOut) {
          console.log(`  🔧 超时未关闭，强制终止残留浏览器进程...`);
          forceKillChromeByUserDataDir(sessionDir);
          console.log(`  ✅ 残留进程清理完成`);
        }
      }
      this.sessions.delete(id);
    }
  }

  /**
   * 关闭除指定账号外的所有会话（保证同一时间只有一个浏览器窗口）
   * @param {string} accountId - 要保留的账号 ID
   */
  async closeOtherSessions(accountId) {
    const keepId = String(accountId);
    const otherIds = Array.from(this.sessions.keys()).filter(id => id !== keepId);
    if (otherIds.length === 0) return;

    console.log(`\n🪟 切换账号，关闭其他浏览器窗口 (保留账号 [${keepId}])...`);
    for (const id of otherIds) {
      await this.closeSession(id);
    }
  }

  /**
   * 绑定单窗口限制：自动关闭用户手动打开的新标签页/窗口
   * @param {object} context - Playwright BrowserContext
   * @param {object} mainPage - 主页面
   */
  _bindSingleWindowGuard(context, mainPage) {
    context.on('page', async (newPage) => {
      if (newPage === mainPage) return;
      console.log('  🚫 检测到额外窗口/标签页，已自动关闭（仅允许单窗口）');
      try {
        await newPage.close();
      } catch {
        /* ignore */
      }
    });
  }

  /**
   * 关闭所有账号的会话
   */
  async closeAll() {
    console.log('\n🔒 正在关闭所有账号会话...');
    const ids = Array.from(this.sessions.keys());
    for (const id of ids) {
      await this.closeSession(id);
    }
    console.log('✅ 所有会话已关闭');
  }
}

module.exports = SessionManager;
