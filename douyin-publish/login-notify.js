/**
 * 登录过期时的系统弹窗提醒（macOS / Windows）
 */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * 弹窗提醒账号 Cookie 过期，需重新扫码登录
 * @param {string} nickname - 账号昵称
 */
function showLoginExpiredAlert(nickname) {
  const name = (nickname && String(nickname).trim()) || '账号';
  const message = name === '账号'
    ? '账号过期，请重新扫码登录。'
    : `${name}账号过期，请重新扫码登录。`;
  const title = '抖音发布客户端';

  console.log(`\n🔔 ${message}\n`);

  try {
    if (process.platform === 'darwin') {
      const escapedMsg = message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const escapedTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      execSync(
        `osascript -e "display dialog \\"${escapedMsg}\\" with title \\"${escapedTitle}\\" buttons {\\"OK\\"} default button 1 with icon caution"`,
        { timeout: 60000, stdio: 'ignore' }
      );
      return;
    }

    if (process.platform === 'win32') {
      const scriptPath = path.join(os.tmpdir(), `_login_alert_${Date.now()}.ps1`);
      const ps = [
        'Add-Type -AssemblyName PresentationFramework',
        `$msg = '${message.replace(/'/g, "''")}'`,
        `$title = '${title.replace(/'/g, "''")}'`,
        '[System.Windows.MessageBox]::Show($msg, $title, "OK", "Warning")',
      ].join('\n');
      fs.writeFileSync(scriptPath, ps);
      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
        { timeout: 60000, stdio: 'ignore', windowsHide: true }
      );
      try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
      return;
    }

    console.log('  💡 请在浏览器窗口中扫码完成登录');
  } catch (err) {
    console.warn(`  ⚠️ 弹窗提醒失败: ${err.message}`);
    console.log('  💡 请在浏览器窗口中扫码完成登录');
  }
}

module.exports = { showLoginExpiredAlert };
