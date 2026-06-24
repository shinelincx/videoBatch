/**
 * 本地 GUI HTTP 服务（配置、控制、日志流）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const robotService = require('./robot-service');
const { subscribe, getRecent, readLogFileTail } = require('./log-hub');
const { APP_ROOT, SRC_ROOT } = require('./load-env');

const GUI_DIR = path.join(SRC_ROOT, 'gui');

function sendJson(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.ico': 'image/x-icon',
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  res.end(fs.readFileSync(filePath));
}

function runDialogCommand(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function normalizeSelectedDir(raw) {
  let selected = String(raw || '').trim();
  if (!selected) return '';
  selected = path.normalize(selected);

  const root = path.parse(selected).root;
  while (selected.length > root.length && /[\\/]+$/.test(selected)) {
    selected = selected.slice(0, -1);
  }

  return selected;
}

function isDialogCanceled(error) {
  const stderr = String(error?.stderr || '').trim();
  const message = `${error?.message || ''}\n${stderr}`.toLowerCase();
  return error?.code === 2
    || (error?.code === 1 && (!stderr || /cancel|canceled|cancelled|用户已取消|user canceled|no file selected/.test(message)));
}

function formatDialogError(error) {
  return String(error?.stderr || error?.message || error || '未知错误').trim();
}

async function selectDirectoryOnMac() {
  const script = 'POSIX path of (choose folder with prompt "请选择发布目录")';
  try {
    const stdout = await runDialogCommand('osascript', ['-e', script]);
    const selected = normalizeSelectedDir(stdout);
    return selected ? { canceled: false, path: selected } : { canceled: true };
  } catch (error) {
    if (isDialogCanceled(error)) return { canceled: true };
    throw new Error(`系统目录选择器打开失败: ${formatDialogError(error)}`);
  }
}

async function selectDirectoryOnWindows() {
  const script = [
    '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)',
    'Add-Type -AssemblyName System.Windows.Forms',
    '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
    '$dialog.Description = "请选择发布目录"',
    '$dialog.ShowNewFolderButton = $true',
    'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {',
    '  Write-Output $dialog.SelectedPath',
    '  exit 0',
    '}',
    'exit 2',
  ].join('; ');
  const args = ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', script];
  const commands = ['powershell.exe', 'powershell', 'pwsh'];
  let lastError = null;

  for (const command of commands) {
    try {
      const stdout = await runDialogCommand(command, args);
      const selected = normalizeSelectedDir(stdout);
      return selected ? { canceled: false, path: selected } : { canceled: true };
    } catch (error) {
      if (isDialogCanceled(error)) return { canceled: true };
      if (error.code === 'ENOENT') {
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }
  }

  throw new Error(`系统目录选择器打开失败: ${formatDialogError(lastError)}`);
}

async function selectDirectoryOnLinux() {
  const candidates = [
    { command: 'zenity', args: ['--file-selection', '--directory', '--title=选择发布目录'] },
    { command: 'kdialog', args: ['--getexistingdirectory', os.homedir(), '选择发布目录'] },
  ];
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const stdout = await runDialogCommand(candidate.command, candidate.args);
      const selected = normalizeSelectedDir(stdout);
      return selected ? { canceled: false, path: selected } : { canceled: true };
    } catch (error) {
      if (isDialogCanceled(error)) return { canceled: true };
      if (error.code === 'ENOENT') {
        lastError = error;
        continue;
      }
      lastError = error;
    }
  }

  if (lastError?.code === 'ENOENT') {
    throw new Error('当前系统未找到可用目录选择器，请安装 zenity 或 kdialog，或手动填写发布目录');
  }
  throw new Error(`系统目录选择器打开失败: ${formatDialogError(lastError)}`);
}

function selectDirectoryDialog() {
  if (process.platform === 'darwin') return selectDirectoryOnMac();
  if (process.platform === 'win32') return selectDirectoryOnWindows();
  if (process.platform === 'linux') return selectDirectoryOnLinux();
  throw new Error(`当前系统暂不支持目录选择: ${process.platform}`);
}

function startGuiServer(port) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/api/config') {
      return sendJson(res, 200, { ok: true, data: robotService.getConfig() });
    }

    if (req.method === 'POST' && pathname === '/api/config') {
      try {
        const body = await readBody(req);
        const saved = robotService.updateConfig(body);
        return sendJson(res, 200, { ok: true, data: saved });
      } catch (e) {
        return sendJson(res, 400, { ok: false, message: e.message });
      }
    }

    if (req.method === 'GET' && pathname === '/api/status') {
      const state = robotService.getPublicState();
      state.platform = process.platform;
      return sendJson(res, 200, { ok: true, data: state });
    }

    if (req.method === 'POST' && pathname === '/api/control') {
      try {
        const body = await readBody(req);
        const result = await robotService.localControl(body.action);
        return sendJson(res, 200, { ok: result.ok, data: result });
      } catch (e) {
        return sendJson(res, 500, { ok: false, message: e.message });
      }
    }

    if (req.method === 'POST' && pathname === '/api/dialog/select-directory') {
      try {
        const result = await selectDirectoryDialog();
        return sendJson(res, 200, { ok: true, data: result });
      } catch (e) {
        return sendJson(res, 500, { ok: false, message: e.message });
      }
    }

    if (req.method === 'GET' && pathname === '/api/logs/recent') {
      const limit = Number(url.searchParams.get('limit') || 500);
      const mem = getRecent(limit);
      const file = readLogFileTail(limit);
      const merged = file.length > mem.length ? file : mem;
      return sendJson(res, 200, { ok: true, data: merged });
    }

    if (req.method === 'GET' && pathname === '/api/logs/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('\n');

      const send = (entry) => {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
      };

      const unsub = subscribe(send);
      req.on('close', () => unsub());
      return;
    }

    if (pathname === '/' || pathname === '/index.html') {
      return serveStatic(res, path.join(GUI_DIR, 'index.html'));
    }

    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(GUI_DIR, safePath);
    if (filePath.startsWith(GUI_DIR) && fs.existsSync(filePath)) {
      return serveStatic(res, filePath);
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`\n🖥️  管理界面: http://127.0.0.1:${port}\n`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = { startGuiServer };
