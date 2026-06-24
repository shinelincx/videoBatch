/**
 * 跨平台 Chrome 路径检测（macOS / Windows / Linux）
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

function findChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  if (process.platform === 'darwin') {
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
    for (const chromePath of macPaths) {
      if (fs.existsSync(chromePath)) return chromePath;
    }
    return null;
  }

  if (process.platform === 'win32') {
    const winPaths = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    for (const chromePath of winPaths) {
      if (chromePath && fs.existsSync(chromePath)) return chromePath;
    }
    return null;
  }

  const linuxPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];
  for (const chromePath of linuxPaths) {
    if (fs.existsSync(chromePath)) return chromePath;
  }
  return null;
}

/**
 * Playwright / 自动化用浏览器启动配置
 */
function getBrowserLaunchConfig() {
  const chromePath = findChromeExecutable();
  const baseConfig = {
    headless: process.env.HEADLESS === 'true',
    viewport: { width: 1440, height: 900 },
    userAgent: process.platform === 'darwin'
      ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    slowMo: 50,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      process.platform === 'win32' ? '--start-maximized' : '--window-size=1440,900',
    ],
  };

  if (chromePath) {
    return { ...baseConfig, executablePath: chromePath };
  }
  return { ...baseConfig, channel: 'chrome' };
}

module.exports = {
  findChromeExecutable,
  getBrowserLaunchConfig,
};
