const path = require('path');
const fs = require('fs');
const apiClient = require('./api-client');
const SessionManager = require('./session-manager');
const { AccountPublishScheduler } = require('./account-publish-scheduler');
const { GrpcHeartbeat } = require('./grpc-heartbeat');
const { loadConfig, applyConfig, saveConfig } = require('./client-config');
const {
  runPublishPayload,
  normalizeProductTask,
  accountIdOfTask,
  runPublishTaskSafely,
  runLoginPayload,
  parseCommandPayload,
  markStoppedPublishingFailed,
} = require('./publish-runner');
const { APP_ROOT } = require('./load-env');

const STATUS_STANDBY = '待机';
const STATUS_RUNNING = '运行中';
const STATUS_PAUSED = '暂停中';

const robotState = {
  status: STATUS_STANDBY,
  paused: false,
  stopped: false,
};

let sessionManager = null;
let authToken = null;
let commandBusy = false;
let connected = false;
let connecting = false;
let config = loadConfig();
let grpcHeartbeat = null;
let registeredRobot = null;
let connectPromise = null;
let pollingTimer = null;
let pollingActive = false;
let pollingBusy = false;
let pendingPublishScheduler = null;
let refreshAuthPromise = null;

const PENDING_PUBLISH_POLL_INTERVAL_MS = Number(process.env.PENDING_PUBLISH_POLL_INTERVAL_MS || 60000);

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function syncRobotStatus() {
  if (!grpcHeartbeat) return;
  grpcHeartbeat.setStatus(robotState.status);
  void grpcHeartbeat.sendHeartbeat().catch((err) => {
    console.warn(`  ⚠️ gRPC 状态同步失败: ${err.message}`);
  });
}

function setRobotStandby() {
  if (!robotState.paused && !robotState.stopped) {
    robotState.status = pollingActive ? STATUS_RUNNING : STATUS_STANDBY;
    syncRobotStatus();
  }
}

async function waitWhilePaused() {
  let logged = false;
  while (robotState.paused && !robotState.stopped) {
    if (!logged) {
      console.log('\n⏸️ 机器人已暂停，等待 resume 指令...');
      logged = true;
    }
    await delay(2000);
  }
}

function shouldAbortPublish() {
  return robotState.stopped;
}

function publishContext() {
  return {
    get token() { return authToken; },
    getToken: () => authToken,
    sessionManager,
    publishDir: config.publishDir || process.env.PUBLISH_DIR || '',
    publishConcurrency: config.publishConcurrency || 10,
    waitWhilePaused,
    shouldAbort: shouldAbortPublish,
    refreshAuth: refreshAuthSession,
  };
}

async function refreshAuthSession() {
  if (refreshAuthPromise) return refreshAuthPromise;
  refreshAuthPromise = (async () => {
    console.log('\n🔁 服务端登录已过期，正在重新登录...');
    authToken = await apiClient.login(
      config.serverAccount || process.env.SERVER_ACCOUNT,
      config.serverPassword || process.env.SERVER_PASSWORD
    );
    console.log(`  🔑 新 Token: ${authToken.substring(0, 16)}...`);
    registeredRobot = await apiClient.registerRobot(authToken);
    console.log('  ✅ 服务端会话已恢复');
    return authToken;
  })();
  try {
    return await refreshAuthPromise;
  } finally {
    refreshAuthPromise = null;
  }
}

async function withFreshAuth(action) {
  try {
    return await action(authToken);
  } catch (err) {
    if (!(err instanceof apiClient.SessionExpiredError)) {
      throw err;
    }
    const token = await refreshAuthSession();
    return action(token);
  }
}

function getPendingPublishScheduler() {
  if (pendingPublishScheduler) return pendingPublishScheduler;
  pendingPublishScheduler = new AccountPublishScheduler({
    getConcurrency: () => config.publishConcurrency || 10,
    sessionManager,
    runTask: task => runPublishTaskSafely(task, publishContext()),
    onAccountComplete: async (accountId) => {
      if (robotState.stopped) return;
      await withFreshAuth(token => apiClient.syncPublishAccountStatus(token, accountId, '姝ｅ湪寰呮満'));
    },
  });
  return pendingPublishScheduler;
}

function logCommandMeta(command, response) {
  const labels = {
    start: '启动', resume: '继续', pause: '暂停', stop: '停止', login: '登录', publish: '发布',
  };
  const robotId = response?.robot_id ?? response?.robotId;
  const cmdTime = response?.command_time_millis ?? response?.commandTimeMillis;
  console.log(`  ▶ 指令: ${labels[command] || command}`);
  if (robotId != null) {
    console.log(`     robot_id: ${robotId}, command_time_millis: ${cmdTime ?? '-'}`);
  }
}

function handleRobotCommand(command, response) {
  logCommandMeta(command, response);

  if (command === 'start') {
    robotState.status = STATUS_RUNNING;
    robotState.paused = false;
    robotState.stopped = false;
    syncRobotStatus();
    startPendingPublishPolling();
    console.log('  ✅ 机器人已启动，将每分钟轮询待发布商品');
    return;
  }

  if (command === 'resume') {
    robotState.status = STATUS_RUNNING;
    robotState.paused = false;
    robotState.stopped = false;
    syncRobotStatus();
    startPendingPublishPolling();
    console.log('  ✅ 已继续，暂停中的任务将恢复执行');
    return;
  }

  if (command === 'pause') {
    robotState.status = STATUS_PAUSED;
    robotState.paused = true;
    robotState.stopped = false;
    syncRobotStatus();
    console.log('  ⏸️ 已暂停：当前商品发布完成后将等待 resume');
    return;
  }

  if (command === 'stop') {
    robotState.status = STATUS_STANDBY;
    robotState.stopped = true;
    robotState.paused = false;
    syncRobotStatus();
    stopPendingPublishPolling();
    pendingPublishScheduler?.clearQueuedTasks();
    console.log('  ⏹️ 已停止：将中止后续发布并关闭浏览器');
    if (authToken) void markStoppedPublishingFailed(publishContext());
    if (sessionManager) {
      void sessionManager.closeAll().catch((e) => {
        console.warn(`  ⚠️ 关闭浏览器失败: ${e.message}`);
      });
    }
    return;
  }

  if (command === 'publish') {
    void executePublishCommand(response);
    return;
  }

  if (command === 'login') {
    void executeLoginCommand(response);
    return;
  }

  console.log(`  ⚠️ 未知指令: ${command}`);
}

async function executePublishCommand(response) {
  if (commandBusy) {
    console.warn('  ⚠️ 已有指令执行中，忽略重复发布指令');
    return;
  }
  if (pendingPublishScheduler?.hasWork?.()) {
    console.warn('  ⚠️ 当前轮询发布任务执行中，暂不执行新的发布指令');
    return;
  }
  if (!authToken || !sessionManager) {
    console.error('  ❌ 客户端未初始化，无法执行发布');
    return;
  }

  const payload = parseCommandPayload(response);
  if (!payload) {
    console.error('  ❌ 发布指令缺少 payload');
    return;
  }

  commandBusy = true;
  robotState.status = STATUS_RUNNING;
  robotState.paused = false;
  robotState.stopped = false;
  syncRobotStatus();

  try {
    await withFreshAuth(() => runPublishPayload(payload, publishContext()));
  } catch (err) {
    console.error(`  ❌ 发布指令执行失败: ${err.message}`);
  } finally {
    commandBusy = false;
    setRobotStandby();
  }
}

function startPendingPublishPolling() {
  if (pollingActive) {
    console.log('  ℹ️ 待发布商品轮询已在运行');
    return;
  }
  if (!authToken || !sessionManager) {
    console.warn('  ⚠️ 客户端未初始化，暂不能启动待发布商品轮询');
    return;
  }

  pollingActive = true;
  sessionManager?.resetAuthState?.();
  getPendingPublishScheduler();
  runPendingPublishPollOnce();
  pollingTimer = setInterval(runPendingPublishPollOnce, PENDING_PUBLISH_POLL_INTERVAL_MS);
}

function stopPendingPublishPolling() {
  pollingActive = false;
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function runPendingPublishPollOnce() {
  if (!pollingActive || pollingBusy) return;
  if (!authToken || !sessionManager) return;
  if (robotState.paused || robotState.stopped) return;
  if (commandBusy) {
    console.log('  ⏳ 当前有指令执行中，本轮待发布商品轮询跳过');
    return;
  }

  pollingBusy = true;
  robotState.status = STATUS_RUNNING;
  syncRobotStatus();

  try {
    const macAddress = registeredRobot?.macAddress
      ?? registeredRobot?.mac_address
      ?? grpcHeartbeat?.identity?.macAddress
      ?? null;
    const rawTasks = await withFreshAuth(token => apiClient.fetchPendingTasks(token, macAddress));
    const pendingTasks = (Array.isArray(rawTasks) ? rawTasks : [])
      .map(product => normalizeProductTask(product, product || {}));
    const fetchedAccountIds = new Set(pendingTasks.map(accountIdOfTask));
    const scheduler = getPendingPublishScheduler();
    const added = scheduler.enqueueTasks(pendingTasks);
    if (added > 0) {
      console.log(`  📥 已投递 ${added} 个待发布任务到账号并发调度器`);
    }
    await scheduler.closeIdleSessionsAfterPoll(fetchedAccountIds);
  } catch (err) {
    console.error(`  ❌ 轮询待发布商品失败: ${err.message}`);
  } finally {
    pollingBusy = false;
    if (!pollingActive || robotState.stopped) {
      setRobotStandby();
    } else if (!robotState.paused) {
      robotState.status = STATUS_RUNNING;
      syncRobotStatus();
    }
  }
}

async function executeLoginCommand(response) {
  if (commandBusy) {
    console.warn('  ⚠️ 已有指令执行中，忽略重复登录指令');
    return;
  }
  if (pendingPublishScheduler?.hasWork?.()) {
    console.warn('  ⚠️ 当前轮询发布任务执行中，暂不执行登录指令');
    return;
  }
  if (!authToken || !sessionManager) {
    console.error('  ❌ 客户端未初始化，无法执行登录');
    return;
  }

  const payload = parseCommandPayload(response);
  commandBusy = true;
  robotState.status = STATUS_RUNNING;
  syncRobotStatus();

  try {
    await withFreshAuth(() => runLoginPayload(payload, publishContext()));
  } catch (err) {
    console.error(`  ❌ 登录指令执行失败: ${err.message}`);
  } finally {
    commandBusy = false;
    setRobotStandby();
  }
}

async function connect() {
  if (connected) return true;
  if (connecting && connectPromise) return connectPromise;

  connecting = true;
  connectPromise = (async () => {
    config = applyConfig(config, apiClient);
    console.log('\n' + '█'.repeat(70));
    console.log('█  🎬 抖音发布客户端 - 服务端调度版 v4.1');
    console.log(`█  🔧 服务端: ${apiClient.BASE_URL}`);
    console.log(`█  🔌 gRPC:   ${config.grpcHost}:${config.grpcPort}`);
    console.log('█'.repeat(70));
    console.log(`⏰ ${new Date().toLocaleString('zh-CN')}\n`);

    if (!sessionManager) sessionManager = new SessionManager();

    console.log('【初始化】登录服务端...');
    authToken = await apiClient.login(
      config.serverAccount || process.env.SERVER_ACCOUNT,
      config.serverPassword || process.env.SERVER_PASSWORD
    );
    console.log(`  🔑 Token: ${authToken.substring(0, 16)}...\n`);

    console.log('【初始化】注册机器人到后台...');
    registeredRobot = await apiClient.registerRobot(authToken);
    console.log('');

    console.log('【初始化】连接 gRPC 服务并注册机器人...');
    grpcHeartbeat = new GrpcHeartbeat({
      host: config.grpcHost,
      port: config.grpcPort,
      onCommand: handleRobotCommand,
      onError: (msg) => console.warn(`  ⚠️ ${msg}`),
    });
    grpcHeartbeat.setStatus(robotState.status);
    await grpcHeartbeat.start();

    connected = true;
    console.log('【待机】客户端已完成 gRPC 握手，可接收服务端指令');
    return true;
  })();

  try {
    return await connectPromise;
  } catch (err) {
    console.error(`❌ 连接失败: ${err.message}`);
    if (grpcHeartbeat) {
      await grpcHeartbeat.stop(false).catch(() => {});
      grpcHeartbeat = null;
    }
    connected = false;
    registeredRobot = null;
    return false;
  } finally {
    connecting = false;
    connectPromise = null;
  }
}

async function localControl(action) {
  const map = { start: 'start', pause: 'pause', resume: 'resume', stop: 'stop' };
  const command = map[action];
  if (!command) throw new Error(`未知操作: ${action}`);

  if (!connected) {
    const ok = await connect();
    if (!ok) return { ok: false, message: '连接服务端失败' };
  }

  handleRobotCommand(command, {});
  return { ok: true, status: getPublicState() };
}

function getPublicState() {
  return {
    connected,
    connecting,
    commandBusy,
    status: robotState.status,
    paused: robotState.paused,
    stopped: robotState.stopped,
    serverUrl: config.serverUrl,
    publishDir: config.publishDir || '',
    publishConcurrency: config.publishConcurrency || 10,
    apiBaseUrl: apiClient.BASE_URL,
    grpcEnabled: Boolean(grpcHeartbeat),
    grpcHost: config.grpcHost || config.apiHost || apiClient.SERVER_HOST,
    grpcPort: Number(config.grpcPort) || 9090,
    grpcRobotId: grpcHeartbeat?.robotId ?? null,
    backendRobotId: registeredRobot?.id ?? null,
    pollingActive,
    pollingBusy,
    pendingPublishActive: Boolean(pendingPublishScheduler?.hasWork?.()),
    pollIntervalMs: PENDING_PUBLISH_POLL_INTERVAL_MS,
    dispatchMode: 'grpc',
  };
}

function getConfig() {
  return { ...config };
}

function updateConfig(patch) {
  config = saveConfig({ ...config, ...patch });
  config = applyConfig(config, apiClient);
  return getConfig();
}

async function shutdown(sendOffline = true) {
  stopPendingPublishPolling();
  pendingPublishScheduler?.clearQueuedTasks();
  if (sessionManager) await sessionManager.closeAll();
  if (grpcHeartbeat) {
    await grpcHeartbeat.stop(sendOffline).catch((err) => {
      console.warn(`  ⚠️ 关闭 gRPC 连接失败: ${err.message}`);
    });
    grpcHeartbeat = null;
  }
  connected = false;
  authToken = null;
  registeredRobot = null;
}

function getDirSize(dirPath) {
  try {
    let totalSize = 0;
    for (const file of fs.readdirSync(dirPath)) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      totalSize += stat.isDirectory() ? getDirSize(filePath) : stat.size;
    }
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / 1024 / 1024).toFixed(1)} MB`;
  } catch {
    return '未知';
  }
}

function clearAllSessions() {
  const sessionBaseDir = path.join(APP_ROOT, '.douyin-session');
  try {
    if (fs.existsSync(sessionBaseDir)) {
      fs.rmSync(sessionBaseDir, { recursive: true, force: true });
      console.log('🗑️ 所有登录会话已清除\n');
    }
  } catch (e) {
    console.error('⚠️ 清除会话失败:', e.message);
  }
}

function logSessionInfo() {
  const sessionBaseDir = path.join(APP_ROOT, '.douyin-session');
  if (fs.existsSync(sessionBaseDir)) {
    console.log(`💾 发现已保存的登录会话 (${getDirSize(sessionBaseDir)})`);
    console.log(`   📂 ${sessionBaseDir}\n`);
  } else {
    console.log('🆕 未发现已保存的登录会话\n');
  }
}

module.exports = {
  connect,
  localControl,
  shutdown,
  getPublicState,
  getConfig,
  updateConfig,
  clearAllSessions,
  logSessionInfo,
  applyConfigOnLoad: () => {
    config = applyConfig(loadConfig(), apiClient);
  },
};
