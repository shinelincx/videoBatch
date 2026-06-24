/**
 * 单实例锁：同一台机器只允许运行一个发布客户端进程
 */
const path = require('path');
const fs = require('fs');
const { APP_ROOT } = require('./load-env');

const LOCK_FILE = path.join(APP_ROOT, '.douyin-publish.lock');

function isProcessRunning(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const content = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      if (content === String(process.pid)) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * 尝试获取单实例锁，失败时退出进程
 * @returns {boolean}
 */
function acquireSingleInstanceLock() {
  if (process.env.SKIP_SINGLE_INSTANCE === '1') {
    return true;
  }

  if (fs.existsSync(LOCK_FILE)) {
    const existingPid = Number.parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
    if (isProcessRunning(existingPid)) {
      console.error('\n❌ 发布客户端已在运行中，请勿重复启动。');
      console.error(`   运行中的进程 PID: ${existingPid}`);
      console.error(`   锁文件: ${LOCK_FILE}\n`);
      return false;
    }
    try {
      fs.unlinkSync(LOCK_FILE);
      console.warn('⚠️ 发现过期的单实例锁文件，已自动清理\n');
    } catch {
      /* ignore */
    }
  }

  fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');

  process.on('exit', releaseLock);
  process.on('SIGINT', releaseLock);
  process.on('SIGTERM', releaseLock);

  return true;
}

module.exports = { acquireSingleInstanceLock, releaseLock, LOCK_FILE };
