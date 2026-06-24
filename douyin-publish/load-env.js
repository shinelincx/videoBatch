/**
 * 应用根目录：开发时为项目目录；便携包/可执行文件为发布目录（由启动脚本设置 DOUYIN_PUBLISH_ROOT）
 */
const path = require('path');
const fs = require('fs');

function resolveAppRoot() {
  if (process.env.DOUYIN_PUBLISH_ROOT) {
    return path.resolve(process.env.DOUYIN_PUBLISH_ROOT);
  }
  if (process.pkg) {
    return path.dirname(process.execPath);
  }
  return __dirname;
}

const APP_ROOT = resolveAppRoot();

// 资源根目录：pkg 模式下指向虚拟文件系统 /snapshot（esbuild 打包输出在 dist/，需回退一级）
const SRC_ROOT = process.pkg ? path.resolve(__dirname, '..') : APP_ROOT;

function loadEnvFile() {
  const envPath = path.join(APP_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

module.exports = { APP_ROOT, SRC_ROOT, resolveAppRoot };
