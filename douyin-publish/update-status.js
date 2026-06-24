/**
 * 批量更新发布记录状态（调试用）
 * 用法: node update-status.js
 */
const apiClient = require('./api-client');

const SERVER_CONFIG = {
  serverAccount: process.env.SERVER_ACCOUNT || 'admin',
  serverPassword: process.env.SERVER_PASSWORD || '123456',
};

// 发布记录 ID 列表
const RECORDS = [
  { id: 76, status: '待发布' },
];

async function main() {
  console.log('═'.repeat(55));
  console.log('📋 批量更新发布记录状态');
  console.log('═'.repeat(55));

  let token;
  try {
    token = await apiClient.login(SERVER_CONFIG.serverAccount, SERVER_CONFIG.serverPassword);
  } catch (err) {
    console.error(`❌ 登录失败: ${err.message}`);
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const item of RECORDS) {
    const ok = await apiClient.updatePublishRecordStatus(token, item.id, item.status, item.reason || '');
    if (ok) successCount++;
    else failCount++;
  }

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`📊 结果: 成功 ${successCount} / 失败 ${failCount} / 共 ${RECORDS.length}`);
  console.log('═'.repeat(55));
}

main().catch(err => {
  console.error('❌ 脚本异常:', err.message);
  process.exit(1);
});
