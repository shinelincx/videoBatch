/**
 * 检查 Playwright 浏览器是否已安装（打包客户端前需要）
 */
const path = require('path');
const fs = require('fs');

const cachePaths = [
  path.join(process.env.LOCALAPPDATA || '', 'ms-playwright'),
  path.join(process.env.HOME || '', 'Library', 'Caches', 'ms-playwright'),
  path.join(process.env.HOME || '', '.cache', 'ms-playwright'),
];

const hasBrowser = cachePaths.some(p => p && fs.existsSync(p));
if (!hasBrowser) {
  console.log('\n💡 发布/打包前请安装浏览器: npx playwright install chromium\n');
}
