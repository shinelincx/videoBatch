/**
 * 服务端 API 通信客户端
 * 服务端地址通过环境变量配置（见 .env / API_HOST / API_PORT）
 */
require('./load-env');

const http = require('http');
const crypto = require('crypto');
const { getRobotIdentity } = require('./robot-identity');

let SERVER_HOST = process.env.API_HOST || '47.113.125.61';
let SERVER_PORT = Number(process.env.API_PORT || 8180);
let BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

function configureServer(host, port) {
  SERVER_HOST = host;
  SERVER_PORT = Number(port);
  BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
}

// 签名密钥（与服务端约定）
const _SIGN_KEY = 's.0wl?.i_s43$i1_';

// 全局 session cookie（Shiro JSESSIONID，登录后由服务端返回）
let globalCookies = '';

const SESSION_EXPIRED_CODE = 4433;

class SessionExpiredError extends Error {
  constructor(response) {
    super(response?.msg || '登录已过期，请重新登录');
    this.name = 'SessionExpiredError';
    this.code = response?.code ?? SESSION_EXPIRED_CODE;
    this.response = response;
  }
}

function isSessionExpiredResponse(res) {
  return Number(res?.code) === SESSION_EXPIRED_CODE;
}

function ensureSessionValid(res) {
  if (isSessionExpiredResponse(res)) {
    throw new SessionExpiredError(res);
  }
  return res;
}

// Debug 模式：设置环境变量 API_DEBUG=1 开启原始数据打印
const DEBUG = process.env.API_DEBUG === '1';

/**
 * 生成请求签名头
 * @param {string} path - 接口路径
 * @returns {object} 包含 signature / timestamp / nonceStr / uri 的 headers
 */
function makeSignedHeaders(path) {
  const ts = String(Date.now());
  const nonce = crypto.randomBytes(12).toString('hex');

  // uri: 去掉 /api/ 前缀，去掉末尾 /
  let uri = path;
  if (uri.startsWith('/api/')) {
    uri = uri.slice(4);
  }
  if (uri.length > 1 && uri.endsWith('/')) {
    uri = uri.slice(0, -1);
  }

  // 按字母排序构建签名字符串 (与 Python sorted(params) 一致)
  const params = { nonceStr: nonce, timestamp: ts, uri: uri };
  const signStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + `&key=${_SIGN_KEY}`;
  const sign = crypto.createHash('md5').update(signStr).digest('hex');

  return {
    signature: sign,
    timestamp: ts,
    nonceStr: nonce,
    uri: uri,
  };
}

/**
 * 通用 HTTP 请求封装
 * @param {string} method - GET/POST
 * @param {string} path - 接口路径
 * @param {object|null} data - 请求体数据
 * @param {object} headers - 额外请求头
 * @returns {Promise<object>} 解析后的响应数据
 */
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const body = data ? JSON.stringify(data) : null;

    // 签名头 + 默认头 + 外部传入头（外部优先级最高）
    const signedHeaders = makeSignedHeaders(url.pathname);
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...signedHeaders,
      ...headers,
    };
    // 如果存在 session cookie，自动附加
    if (globalCookies) {
      defaultHeaders['Cookie'] = globalCookies;
    }
    if (body) {
      defaultHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: url.pathname + url.search,
      method,
      headers: defaultHeaders,
      timeout: 30000,
    };

    if (DEBUG) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📤 [DEBUG] 请求 → ${method} ${path}`);
      console.log(`📤 [DEBUG] 完整URL: ${url.href}`);
      console.log(`📤 [DEBUG] 请求头:`, JSON.stringify(options.headers, null, 2));
      if (body) {
        console.log(`📤 [DEBUG] 请求体:`, body);
      }
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (DEBUG) {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📥 [DEBUG] 响应 ← ${res.statusCode} ${res.statusMessage}`);
          console.log(`📥 [DEBUG] 响应头:`, JSON.stringify(res.headers, null, 2));
          try {
            console.log(`📥 [DEBUG] 响应体:`, JSON.stringify(JSON.parse(responseData), null, 2));
          } catch (e) {
            console.log(`📥 [DEBUG] 响应体(raw):`, responseData);
          }
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        }
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, headers: res.headers, ...parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, raw: responseData });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时: ${method} ${path}`));
    });

    req.on('error', (err) => {
      reject(new Error(`请求失败 [${method} ${path}]: ${err.message}`));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * 登录获取授权 token
 * @param {string} account - 账号
 * @param {string} password - 密码
 * @returns {Promise<{token: string}>}
 */
async function login(account, password) {
  console.log(`\n🔐 正在登录服务端... (${account})`);
  const res = await request('POST', '/auth/login', { uname: account, pwd: password });

  if (res.code !== 0) {
    throw new Error(`登录失败: code=${res.code}, msg=${res.msg || '未知错误'}`);
  }

  const token = res.data?.token || res.token;
  if (!token) {
    throw new Error('登录响应中未找到 token');
  }

  // 从响应中提取 JSESSIONID cookie（Shiro session）
  const setCookie = res.headers && res.headers['set-cookie'];
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const c of cookies) {
      const match = c.match(/^(JSESSIONID=[^;]+)/);
      if (match) {
        globalCookies = match[1];
        break;
      }
    }
  }

  console.log('  ✅ 登录成功，已获取 token');
  return token;
}

/**
 * 向服务端注册机器人客户端
 * @param {string} token - 授权 token
 * @returns {Promise<object>} 注册后的机器人信息
 */
async function registerRobot(token) {
  const { machineName, macAddress } = getRobotIdentity();
  console.log(`\n🤖 正在注册机器人客户端...`);
  console.log(`   机器名称: ${machineName}`);
  console.log(`   MAC 地址: ${macAddress}`);

  const res = await request('POST', '/base/robot/register', {
    machineName,
    macAddress,
  }, {
    'Authorization': `Bearer ${token}`,
  });
  ensureSessionValid(res);

  if (res.code !== 0) {
    throw new Error(`机器人注册失败: code=${res.code}, msg=${res.msg || '未知错误'}`);
  }

  const robot = res.data || {};
  console.log(`  ✅ 机器人注册成功 (ID: ${robot.id ?? '未知'}, 状态: ${robot.status ?? '待机'})`);
  return robot;
}

/**
 * 获取待发布任务列表
 * @param {string} token - 授权 token
 * @param {string} macAddress - MAC 地址
 * @returns {Promise<Array>} 任务列表
 */
async function fetchPendingTasks(token, macAddress = null) {
  console.log('\n📋 正在获取待发布任务...');
  const resolvedMacAddress = macAddress || getRobotIdentity().macAddress;
  const query = resolvedMacAddress == null || resolvedMacAddress === ''
    ? ''
    : `?macAddress=${encodeURIComponent(String(resolvedMacAddress))}`;
  const res = await request('GET', `/publish/account/pending_publish/matches${query}`, null, {
    'Authorization': `Bearer ${token}`,
  });
  ensureSessionValid(res);

  if (res.code !== 0) {
    console.warn(`  ⚠️ 获取任务返回非0: code=${res.code}, msg=${res.msg || ''}`);
    return [];
  }

  // 实际数据结构: data 直接是任务数组
  const tasks = Array.isArray(res.data) ? res.data : [];
  console.log(`  ✅ 获取到 ${tasks.length} 个待发布任务`);
  return tasks;
}

const PUBLISH_STATUS_MAP = {
  completed: '发布成功',
  failed: '发布失败',
  publishing: '发布中',
};

function localDateTimeString(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(':');
}

function normalizeReason(reason) {
  if (reason == null) return '';
  const value = String(reason).trim();
  return value.length > 500 ? value.slice(0, 500) : value;
}

function isFailedStatus(status) {
  return typeof status === 'string' && status.trim().endsWith('失败');
}

/**
 * 更新发布记录状态（PublishRecordController.updateStatus）
 * @param {string} token
 * @param {number|string} publishRecordId - 发布记录 ID（startPublish 推送的 id / publishRecordId）
 * @param {string} status - completed | failed | publishing | 发布成功 等
 * @param {string} [reason] - 失败原因
 * @returns {Promise<boolean>}
 */
async function updatePublishRecordStatus(token, publishRecordId, status, reason = '') {
  const recordId = Number(publishRecordId);
  if (!recordId) {
    console.warn('  ⚠️ 缺少发布记录 ID，跳过 /publish/record/update_status');
    return false;
  }

  const mappedStatus = PUBLISH_STATUS_MAP[status] || status;
  const body = {
    id: recordId,
    status: mappedStatus,
  };
  const normalizedReason = normalizeReason(reason);
  if (isFailedStatus(mappedStatus)) {
    body.reason = normalizedReason || '客户端上报失败，未提供具体原因';
  }
  console.log(`\n📡 [发布记录状态] id=${recordId}, status=${mappedStatus}`);
  console.log(`   接口: POST /publish/record/update_status`);

  try {
    const res = await request('POST', '/publish/record/update_status', body, {
      'Authorization': `Bearer ${token}`,
    });
    ensureSessionValid(res);

    if (res.code === 0) {
      const data = res.data || {};
      console.log(`   ✅ 发布记录已更新 (publishRecordUpdated=${data.publishRecordUpdated}, selectionRecordUpdated=${data.selectionRecordUpdated}, publishAccountUpdated=${data.publishAccountUpdated})`);
      return true;
    }
    console.warn(`   ⚠️ 更新失败: code=${res.code}, msg=${res.msg || ''}`);
    return false;
  } catch (err) {
    if (err instanceof SessionExpiredError) throw err;
    console.error(`   ❌ 更新异常: ${err.message}`);
    return false;
  }
}

/**
 * 上报发布结果（POST /publish/record/update_status）
 * @param {string} token
 * @param {object} task - 含 id / publishRecordId
 * @param {string} status - completed | failed | publishing
 * @param {string} [reason] - 失败原因
 */
async function reportPublishOutcome(token, task, status, reason = '') {
  const recordId = task?.id ?? task?.publishRecordId;
  if (!recordId) {
    console.warn('  ⚠️ 无法上报发布状态：缺少 publishRecordId');
    return false;
  }
  return updatePublishRecordStatus(token, recordId, status, reason);
}

/**
 * 同步/更新账号信息到服务端
 * @param {string} token - 授权 token
 * @param {number|string} accountId - 账号ID
 * @param {object} accountData - 账号数据
 * @param {string} accountData.douyinId - 抖音号
 * @param {string} accountData.nickname - 昵称
 * @param {string} accountData.avatar - 头像 URL
 * @param {number} accountData.followers - 粉丝数
 * @param {string} [accountData.lastLoginTime] - 最近登录时间
 * @returns {Promise<boolean>}
 */
async function updateAccount(token, accountId, accountData) {
  console.log(`\n📤 同步账号信息: ${accountData.nickname || accountData.douyinId}`);
  try {
    // 字段映射: 客户端字段 → 服务端字段
    const body = {
      id: accountId,                            // → id
      douyinAccount: accountData.douyinId,       // → douyinAccount
      fansCount: accountData.followers,          // → fansCount
      avatarUrl: accountData.avatar,             // → avatarUrl
      nickname: accountData.nickname,            // → nickname
      updateTime: localDateTimeString(),         // → updateTime (当前本地时间)
    };
    if (accountData.lastLoginTime) {
      body.lastLoginTime = accountData.lastLoginTime;
    }
    const res = await request('POST', '/base/account/update', body, {
      'Authorization': `Bearer ${token}`,
    });
    ensureSessionValid(res);
    if (res.code === 0) {
      console.log('  ✅ 账号信息同步成功');
      return true;
    } else {
      console.warn(`  ⚠️ 账号同步返回非0: code=${res.code}, msg=${res.msg || ''}`);
      return false;
    }
  } catch (err) {
    if (err instanceof SessionExpiredError) throw err;
    console.error(`  ❌ 账号同步失败: ${err.message}`);
    return false;
  }
}

/**
 * 同步发布账号运行状态（对应 PublishAccountService.syncStatus）
 * @param {string} token
 * @param {number|string} accountId
 * @param {string} status - 如 正在发布、正在待机
 */
async function syncPublishAccountStatus(token, accountId, status) {
  console.log(`\n📤 同步发布账号状态: accountId=${accountId}, status=${status}`);
  try {
    const res = await request('POST', '/publish/account/sync/status', {
      accountId: Number(accountId),
      status,
    }, {
      'Authorization': `Bearer ${token}`,
    });
    ensureSessionValid(res);
    if (res.code === 0) {
      console.log('  ✅ 发布账号状态同步成功');
      return true;
    }
    console.warn(`  ⚠️ 发布账号状态同步返回非0: code=${res.code}, msg=${res.msg || ''}`);
    return false;
  } catch (err) {
    if (err instanceof SessionExpiredError) throw err;
    console.error(`  ❌ 发布账号状态同步失败: ${err.message}`);
    return false;
  }
}

/**
 * 同步发布账号登录状态（未登录、已登录、异常）
 * @param {string} token
 * @param {number|string} accountId
 * @param {'未登录'|'已登录'|'异常'|string} loginStatus
 * @param {string} [errorReason]
 */
async function syncPublishAccountLoginStatus(token, accountId, loginStatus, errorReason = '') {
  console.log(`\n📤 同步发布账号登录状态: accountId=${accountId}, loginStatus=${loginStatus}`);
  const body = {
    accountId: Number(accountId),
    loginStatus,
  };
  const reason = normalizeReason(errorReason);
  if (loginStatus === '异常') {
    body.loginErrorReason = reason || '客户端登录异常，未提供具体原因';
  }

  try {
    const res = await request('POST', '/publish/account/sync/status', body, {
      'Authorization': `Bearer ${token}`,
    });
    ensureSessionValid(res);
    if (res.code === 0) {
      console.log('  ✅ 发布账号登录状态同步成功');
      return true;
    }
    console.warn(`  ⚠️ 登录状态同步返回非0: code=${res.code}, msg=${res.msg || ''}`);
    return false;
  } catch (err) {
    if (err instanceof SessionExpiredError) throw err;
    console.error(`  ❌ 登录状态同步失败: ${err.message}`);
    return false;
  }
}

module.exports = {
  login,
  SessionExpiredError,
  isSessionExpiredResponse,
  registerRobot,
  fetchPendingTasks,
  updatePublishRecordStatus,
  reportPublishOutcome,
  syncPublishAccountStatus,
  syncPublishAccountLoginStatus,
  updateAccount,
  configureServer,
  getServerHost: () => SERVER_HOST,
  getServerPort: () => SERVER_PORT,
  getBaseUrl: () => BASE_URL,
  get SERVER_HOST() { return SERVER_HOST; },
  get SERVER_PORT() { return SERVER_PORT; },
  get BASE_URL() { return BASE_URL; },
};
