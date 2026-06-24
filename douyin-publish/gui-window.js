/**
 * 跨平台打开 GUI 窗口（优先 Chrome 应用模式，回退系统浏览器）
 */
const { spawn, exec } = require('child_process');
const { findChromeExecutable } = require('./browser-path');

function openWithSystemBrowser(url) {
  return new Promise((resolve, reject) => {
    if (process.platform === 'darwin') {
      exec(`open "${url}"`, (err) => (err ? reject(err) : resolve()));
      return;
    }
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`, { shell: true, windowsHide: true }, (err) => (err ? reject(err) : resolve()));
      return;
    }
    exec(`xdg-open "${url}"`, (err) => (err ? reject(err) : resolve()));
  });
}

/**
 * @param {string} url
 * @returns {Promise<{ mode: string }>}
 */
async function openGuiWindow(url) {
  const chromePath = findChromeExecutable();

  if (chromePath) {
    try {
      const args = [
        `--app=${url}`,
        '--disable-session-crashed-bubble',
        '--disable-infobars',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=900,720',
      ];

      const child = spawn(chromePath, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();

      const platformLabel = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : process.platform;
      console.log(`  🖥️  已打开客户端窗口 (${platformLabel} · Chrome 应用模式)`);
      return { mode: 'chrome-app' };
    } catch (err) {
      console.warn(`  ⚠️ Chrome 应用模式打开失败: ${err.message}`);
    }
  } else {
    console.warn('  ⚠️ 未检测到 Google Chrome，将使用系统默认浏览器');
    if (process.platform === 'darwin') {
      console.warn('     建议安装: https://www.google.com/chrome/');
      console.warn('     或设置 CHROME_PATH 指向 Chrome 可执行文件');
    }
  }

  await openWithSystemBrowser(url);
  console.log('  🌐 已在系统浏览器中打开管理界面');
  return { mode: 'system-browser' };
}

module.exports = { openGuiWindow, openWithSystemBrowser };
