/**
 * 客户端界面配置持久化（client-settings.json）
 */
const path = require('path');
const fs = require('fs');
const { APP_ROOT } = require('./load-env');

function normalizePort(value, fallback) {
  const port = Number(value);
  if (Number.isInteger(port) && port >= 1 && port <= 65535) return port;
  return fallback;
}

function normalizePublishConcurrency(value) {
  const concurrency = Math.floor(Number(value));
  if (!Number.isFinite(concurrency) || concurrency < 1) return 10;
  return Math.min(concurrency, 10);
}

const CONFIG_FILE = path.join(APP_ROOT, 'client-settings.json');

const DEFAULTS = {
  serverUrl: 'http://47.113.125.61:8180',
  grpcPort: normalizePort(process.env.GRPC_PORT || process.env.GRPC_SERVER_PORT, 9090),
  publishDir: process.env.PUBLISH_DIR || '',
  serverAccount: 'admin',
  serverPassword: '123456',
  guiPort: 17890,
  publishConcurrency: normalizePublishConcurrency(process.env.PUBLISH_CONCURRENCY || 10),
};

function parseServerUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return { host: '47.113.125.61', port: 8180, serverUrl: DEFAULTS.serverUrl };

  let urlStr = raw;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `http://${urlStr}`;
  }
  try {
    const url = new URL(urlStr);
    const port = Number(url.port) || (url.protocol === 'https:' ? 443 : 80);
    const host = url.hostname;
    const serverUrl = `${url.protocol}//${host}:${port}`;
    return { host, port, serverUrl };
  } catch {
    const hostPort = raw.replace(/^https?:\/\//, '');
    const [host, portStr] = hostPort.split(':');
    const port = Number(portStr) || 8180;
    const serverUrl = `http://${host}:${port}`;
    return { host, port, serverUrl };
  }
}

function loadConfig() {
  let data = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn(`  ⚠️ 读取配置失败，使用默认值: ${err.message}`);
  }
  const merged = { ...DEFAULTS, ...data };
  merged.serverUrl = String(merged.serverUrl || DEFAULTS.serverUrl).trim();
  merged.grpcPort = normalizePort(merged.grpcPort, DEFAULTS.grpcPort);
  merged.publishConcurrency = normalizePublishConcurrency(merged.publishConcurrency);
  return merged;
}

function saveConfig(config) {
  const grpcPort = normalizePort(config.grpcPort, DEFAULTS.grpcPort);
  const publishConcurrency = normalizePublishConcurrency(config.publishConcurrency);
  const serverUrl = String(config.serverUrl || '').trim() || DEFAULTS.serverUrl;
  const toSave = {
    serverUrl,
    grpcPort,
    publishDir: String(config.publishDir || '').trim(),
    serverAccount: config.serverAccount || DEFAULTS.serverAccount,
    serverPassword: config.serverPassword || DEFAULTS.serverPassword,
    guiPort: Number(config.guiPort) || DEFAULTS.guiPort,
    publishConcurrency,
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(toSave, null, 2), 'utf8');
  return toSave;
}

/**
 * 将配置写入 process.env 并更新 API 客户端
 * @param {object} config
 * @param {object} [apiClient]
 */
function applyConfig(config, apiClient) {
  const serverUrl = String(config.serverUrl || '').trim() || DEFAULTS.serverUrl;
  const parsed = parseServerUrl(serverUrl);
  const publishDir = String(config.publishDir || '').trim();
  const grpcPort = normalizePort(config.grpcPort, DEFAULTS.grpcPort);
  const publishConcurrency = normalizePublishConcurrency(config.publishConcurrency);
  process.env.API_HOST = parsed.host;
  process.env.API_PORT = String(parsed.port);
  process.env.GRPC_HOST = parsed.host;
  process.env.GRPC_PORT = String(grpcPort);
  process.env.PUBLISH_CONCURRENCY = String(publishConcurrency);
  if (publishDir) {
    process.env.PUBLISH_DIR = publishDir;
  } else {
    delete process.env.PUBLISH_DIR;
  }
  process.env.SERVER_ACCOUNT = config.serverAccount || DEFAULTS.serverAccount;
  process.env.SERVER_PASSWORD = config.serverPassword || DEFAULTS.serverPassword;

  if (apiClient?.configureServer) {
    apiClient.configureServer(parsed.host, parsed.port);
  }

  return {
    ...config,
    serverUrl,
    publishDir,
    apiHost: parsed.host,
    apiPort: parsed.port,
    grpcHost: parsed.host,
    grpcPort,
    publishConcurrency,
  };
}

module.exports = {
  CONFIG_FILE,
  DEFAULTS,
  loadConfig,
  saveConfig,
  applyConfig,
  parseServerUrl,
  normalizePublishConcurrency,
};
