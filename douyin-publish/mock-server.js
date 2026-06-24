/**
 * Mock 服务端 — 模拟 http://47.113.125.61:8180 接口
 * 用于本地开发调试
 *
 * 接口列表:
 *   POST /auth/login                                   → 返回 mock token
 *   GET  /publish/account/pending_publish/matches      → 返回模拟待发布任务
 *   POST /publish/record/update_status → 接收发布记录状态同步
 *
 * 启动方式:
 *   node mock-server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8180;
const HOST = '0.0.0.0';

// 模拟 token 和任务数据
const MOCK_TOKEN = 'mock-jwt-token-abc123-def456';

// 模拟待发布任务列表（匹配真实 API 数据结构 — camelCase 字段名）
const mockTasks = [
  {
    accountId: '4',
    userId: '56418017570',
    productId: '3819868504316838326',
    productTitle: '韩国LILYBYRED爱心腮红膏细腻韩系少女水光感显白提升气色裸妆',
    productContent: '这是一款超好用的腮红膏，显白提气色',
    productLink: 'https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=3821850913228849209&origin_type=pc_buyin_selection_decision',
    createTime: '2026-05-26T02:14:11',
    publishDir: 'D:\\test\\output',
    isCarrier: 0,
    selfDeclaration: '内容含营销推广信息',
    syncPublish: '不同时发布',
    visibility: '仅自己可见',
    savePermission: '不允许',
    publishTime: '定时发布',
    publishDelay: 60,
  },
  {
    accountId: '5',
    userId: '56418015470',
    productId: '3682372189383950653',
    productTitle: '韩国LILYBYRED爱心腮红膏',
    productContent: '限量版腮红膏',
    productLink: 'https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=3821850913228849209&origin_type=pc_buyin_selection_decision',
    createTime: '2026-05-26T02:14:11',
    publishDir: 'D:\\test\\output',
    isCarrier: 0,
    selfDeclaration: '无需添加自主声明',
    syncPublish: '同时发布',
    visibility: '公开',
    savePermission: '允许',
    publishTime: '定时发布',
    publishDelay: 24,
  },
];

// 已发送的任务缓存（避免重复返回）
let sentTaskIds = new Set();
let statusLog = [];

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  console.log(`📥 ${method} ${pathname}`);

  // ========== POST /auth/login ==========
  if (method === 'POST' && pathname === '/auth/login') {
    const body = await parseBody(req);
    console.log(`  🔐 登录请求: uname=${body.uname || body.account}`);
    // 设置模拟 JSESSIONID cookie（模拟 Shiro session）
    res.setHeader('Set-Cookie', [
      'JSESSIONID=mock-session-' + Date.now() + '; Path=/; HttpOnly',
      'rememberMe=deleteMe; Path=/; Max-Age=0; Expires=Thu, 01-Jan-1970 00:00:00 GMT',
    ]);
    jsonResponse(res, 200, {
      code: 0,
      msg: '登录成功',
      data: {
        token: MOCK_TOKEN,
        account: body.uname || body.account || 'admin',
      },
    });
    return;
  }

  // ========== GET /publish/account/pending_publish/matches ==========
  if (method === 'GET' && pathname === '/publish/account/pending_publish/matches') {
    const auth = req.headers['authorization'] || '';
    if (!auth.includes(MOCK_TOKEN)) {
      jsonResponse(res, 401, { code: -1, msg: '未授权' });
      return;
    }

    // 返回尚未发送过的任务
    const pendingTasks = mockTasks.filter(t => !sentTaskIds.has(t.productId));

    if (pendingTasks.length > 0) {
      // 标记为已发送（模拟服务端已分配）
      pendingTasks.forEach(t => sentTaskIds.add(t.productId));
      console.log(`  📋 返回 ${pendingTasks.length} 个待发布任务: ${pendingTasks.map(t => '#' + t.accountId).join(', ')}`);
      jsonResponse(res, 200, {
        code: 0,
        msg: '操作成功',
        data: pendingTasks,
      });
    } else {
      console.log('  ⏳ 暂无待发布任务');
      jsonResponse(res, 200, {
        code: 0,
        msg: '操作成功',
        data: [],
      });
    }
    return;
  }

  // ========== POST /publish/record/update_status ==========
  if (method === 'POST' && pathname === '/publish/record/update_status') {
    const auth = req.headers['authorization'] || '';
    if (!auth.includes(MOCK_TOKEN)) {
      jsonResponse(res, 401, { code: -1, msg: '未授权' });
      return;
    }

    const body = await parseBody(req);
    const logEntry = {
      id: body.id,
      status: body.status || 'unknown',
      reason: body.reason || '',
      time: new Date().toISOString(),
    };
    statusLog.push(logEntry);
    console.log(`  📡 发布记录状态: id=${body.id} → ${body.status}${body.reason ? ` (${body.reason})` : ''}`);
    jsonResponse(res, 200, {
      code: 0,
      msg: '状态已更新',
      data: {
        id: body.id,
        status: body.status,
        reason: body.reason || '',
        publishRecordUpdated: 1,
        selectionRecordUpdated: 1,
        publishAccountUpdated: body.status === '发布成功' ? 1 : 0,
      },
    });
    return;
  }

  // ========== GET /mock/reset — 重置 Mock 状态 ==========
  if (method === 'GET' && pathname === '/mock/reset') {
    sentTaskIds.clear();
    statusLog = [];
    console.log('  🔄 Mock 状态已重置');
    jsonResponse(res, 200, { code: 0, msg: 'Mock 状态已重置，任务可重新获取' });
    return;
  }

  // ========== GET /mock/status — 查看当前状态 ==========
  if (method === 'GET' && pathname === '/mock/status') {
    jsonResponse(res, 200, {
      sentTaskIds: Array.from(sentTaskIds),
      statusLog,
      pendingCount: mockTasks.filter(t => !sentTaskIds.has(t.productId)).length,
    });
    return;
  }

  // 404
  jsonResponse(res, 404, { code: -1, msg: 'Not Found: ' + pathname });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  🧪 Mock 服务端已启动');
  console.log(`  📡 地址: http://localhost:${PORT}`);
  console.log('═'.repeat(60));
  console.log('');
  console.log('  接口列表:');
  console.log(`    POST /auth/login`);
  console.log(`    GET  /publish/account/pending_publish/matches`);
  console.log(`    POST /publish/record/update_status`);
  console.log('');
  console.log('  管理接口:');
  console.log(`    GET  /mock/reset  — 重置Mock状态`);
  console.log(`    GET  /mock/status — 查看当前状态`);
  console.log('');
  console.log(`  模拟任务: ${mockTasks.length} 个`);
  mockTasks.forEach(t => {
    console.log(`    • #${t.accountId} (账号: ${t.userId}) — "${t.productTitle.substring(0, 20)}..."`);
  });
  console.log('');
  console.log(`  💡 启动主程序前请设置环境变量:`);
  console.log(`     $env:API_HOST='localhost'`);
  console.log('');
  console.log('  按 Ctrl+C 停止服务端');
  console.log('═'.repeat(60) + '\n');
});
