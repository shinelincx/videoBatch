/**
 * 抖音发布客户端 - 命令行入口（无图形界面）
 * 图形界面请使用: node gui-main.js 或 npm start
 */
const { acquireSingleInstanceLock } = require('./single-instance');
const { installLogCapture } = require('./log-hub');
const robotService = require('./robot-service');

installLogCapture();

const args = process.argv.slice(2);
if (args.includes('--clear-session') || args.includes('--reset')) {
  robotService.clearAllSessions();
}

if (!acquireSingleInstanceLock()) {
  process.exit(1);
}

robotService.applyConfigOnLoad();
robotService.logSessionInfo();

console.log('\n🚀 启动抖音发布客户端（命令行模式）...\n');

process.on('SIGINT', async () => {
  console.log('\n🛑 收到退出信号，正在关闭...');
  await robotService.shutdown(true);
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 未捕获的Promise拒绝:', reason);
});

(async () => {
  const ok = await robotService.connect();
  if (!ok) process.exit(1);
  await robotService.localControl('start');

  while (true) {
    await new Promise(r => setTimeout(r, 60000));
  }
})().catch((err) => {
  console.error('❌ 程序异常:', err.message);
  robotService.shutdown(false).finally(() => process.exit(1));
});
