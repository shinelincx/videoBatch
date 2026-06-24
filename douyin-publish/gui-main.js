/**
 * 抖音发布客户端 - GUI 入口
 */
const { acquireSingleInstanceLock } = require('./single-instance');
const { installLogCapture } = require('./log-hub');
const robotService = require('./robot-service');
const { startGuiServer } = require('./gui-server');
const { loadConfig } = require('./client-config');
const { openGuiWindow } = require('./gui-window');

installLogCapture();

if (!acquireSingleInstanceLock()) {
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes('--clear-session') || args.includes('--reset')) {
  robotService.clearAllSessions();
}

robotService.applyConfigOnLoad();
robotService.logSessionInfo();

console.log('\n🚀 启动抖音发布客户端（图形界面）...\n');

const config = loadConfig();
const guiPort = Number(config.guiPort) || 17890;

process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭...');
  await robotService.shutdown(true);
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 未捕获的Promise拒绝:', reason);
});

startGuiServer(guiPort).then(() => {
  const url = `http://127.0.0.1:${guiPort}`;
  void robotService.connect().then((ok) => {
    if (!ok) {
      console.warn('  ⚠️ 启动后自动注册失败，可检查配置后点击「启动」重试');
    }
  });
  return openGuiWindow(url);
}).catch((err) => {
  console.error('❌ GUI 服务启动失败:', err.message);
  process.exit(1);
});
