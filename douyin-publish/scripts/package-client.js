/**
 * 客户端打包：便携版（内置 Node 运行时）+ 可选 pkg 单文件
 *
 * 用法:
 *   node scripts/package-client.js           # 当前平台便携包（推荐）
 *   node scripts/package-client.js --win   # Windows 便携包
 *   node scripts/package-client.js --mac    # macOS 便携包
 *   node scripts/package-client.js --pkg    # 额外尝试 pkg 单文件（需网络下载 Node 二进制）
 */
const { execSync } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseRoot = path.join(distDir, 'release');
const NODE_VERSION = '20.18.0';
const CACHE_DIR = path.join(rootDir, '.build-cache');

const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const buildWin = args.includes('--win') || buildAll;
const buildMac = args.includes('--mac') || buildAll;
const buildCurrent = !buildWin && !buildMac;
const usePkg = args.includes('--pkg');

function log(msg) {
  console.log(msg);
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) copyDirSync(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
  return true;
}

function getDirSizeSync(dir) {
  let size = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      const stat = fs.statSync(fp);
      size += stat.isDirectory() ? getDirSizeSync(fp) : stat.size;
    }
  } catch { /* ignore */ }
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function resolveTarget() {
  if (process.platform === 'win32') {
    return { platform: 'win32', arch: 'x64', label: 'win-x64' };
  }
  if (process.platform === 'darwin') {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    return { platform: 'darwin', arch, label: `mac-${arch}` };
  }
  return { platform: 'linux', arch: process.arch === 'arm64' ? 'arm64' : 'x64', label: `linux-${process.arch}` };
}

function findBrowserCacheDir() {
  const possible = [
    path.join(process.env.LOCALAPPDATA || '', 'ms-playwright'),
    path.join(process.env.HOME || '', 'Library', 'Caches', 'ms-playwright'),
    path.join(process.env.HOME || '', '.cache', 'ms-playwright'),
  ];
  for (const p of possible) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function copyBrowserAssets(outDir) {
  const cache = findBrowserCacheDir();
  const dest = path.join(outDir, 'browsers');
  if (!cache) {
    log('  ⚠️ 未找到 Playwright 浏览器，请先执行: npx playwright install chromium');
    return false;
  }
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(cache)) {
    const src = path.join(cache, entry);
    if (fs.statSync(src).isDirectory()) {
      copyDirSync(src, path.join(dest, entry));
      log(`  ✅ 浏览器: ${entry} (${getDirSizeSync(path.join(dest, entry))})`);
    }
  }
  return true;
}

function copyClientAssets(outDir) {
  fs.mkdirSync(path.join(outDir, 'app'), { recursive: true });
  fs.copyFileSync(path.join(distDir, 'bundle.js'), path.join(outDir, 'app', 'bundle.js'));
  copyDirSync(path.join(rootDir, 'gui'), path.join(outDir, 'gui'));
  copyDirSync(path.join(rootDir, 'proto'), path.join(outDir, 'proto'));

  const envExample = path.join(rootDir, '.env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, path.join(outDir, '.env.example'));
    if (!fs.existsSync(path.join(outDir, '.env'))) {
      fs.copyFileSync(envExample, path.join(outDir, '.env'));
    }
  }
}

function copyNodeModules(outDir) {
  const src = path.join(rootDir, 'node_modules');
  if (!fs.existsSync(path.join(src, 'playwright'))) {
    log('  📥 安装生产依赖...');
    execSync('npm install --omit=dev', { cwd: rootDir, stdio: 'inherit' });
  }
  log('  📦 复制 node_modules（playwright / grpc）...');
  copyDirSync(src, path.join(outDir, 'node_modules'));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`下载失败 HTTP ${res.statusCode}: ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', reject);
    file.on('error', reject);
  });
}

function nodeDistFolder(platform, arch) {
  if (platform === 'win32') return `node-v${NODE_VERSION}-win-${arch}`;
  if (platform === 'darwin') return `node-v${NODE_VERSION}-darwin-${arch}`;
  return `node-v${NODE_VERSION}-linux-${arch}`;
}

function nodeDistFile(platform, arch) {
  const folder = nodeDistFolder(platform, arch);
  const ext = platform === 'win32' ? 'zip' : 'tar.gz';
  return `${folder}.${ext}`;
}

async function ensureNodeRuntime(outDir, platform, arch) {
  const nodeBinDir = path.join(outDir, 'node', 'bin');
  const nodeExe = platform === 'win32'
    ? path.join(nodeBinDir, 'node.exe')
    : path.join(nodeBinDir, 'node');

  if (fs.existsSync(nodeExe)) {
    log(`  ✅ Node 运行时已存在: ${nodeExe}`);
    return nodeExe;
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const fileName = nodeDistFile(platform, arch);
  const archivePath = path.join(CACHE_DIR, fileName);
  const url = `https://nodejs.org/dist/v${NODE_VERSION}/${fileName}`;

  if (!fs.existsSync(archivePath)) {
    log(`  📥 下载 Node.js ${NODE_VERSION} (${platform}-${arch})...`);
    await downloadFile(url, archivePath);
  } else {
    log(`  ♻️  使用缓存: ${archivePath}`);
  }

  const extractDir = path.join(CACHE_DIR, nodeDistFolder(platform, arch));
  const extractedBin = platform === 'win32'
    ? path.join(CACHE_DIR, nodeDistFolder(platform, arch), 'node.exe')
    : path.join(CACHE_DIR, nodeDistFolder(platform, arch), 'bin', 'node');
  const extractArchive = () => {
    fs.mkdirSync(extractDir, { recursive: true });
    if (platform === 'win32') {
      execSync(`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${CACHE_DIR}' -Force -ErrorAction Stop"`, { stdio: 'inherit' });
    } else {
      execSync(`tar -xzf "${archivePath}" -C "${CACHE_DIR}"`, { stdio: 'inherit' });
    }
    if (!fs.existsSync(extractedBin)) {
      throw new Error(`Node runtime archive did not produce ${extractedBin}`);
    }
  };

  if (!fs.existsSync(extractedBin)) {
    log('  📂 解压 Node 运行时...');
    try {
      extractArchive();
    } catch (err) {
      log('  Node runtime cache is corrupt; downloading it again...');
      if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
      if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
      await downloadFile(url, archivePath);
      extractArchive();
    }
  }

  fs.mkdirSync(nodeBinDir, { recursive: true });
  fs.copyFileSync(extractedBin, nodeExe);
  if (platform !== 'win32') fs.chmodSync(nodeExe, 0o755);

  log(`  ✅ Node 运行时: ${nodeExe}`);
  return nodeExe;
}

function writeWinLauncher(outDir) {
  const bat = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "DOUYIN_PUBLISH_ROOT=%~dp0"
set "PLAYWRIGHT_BROWSERS_PATH=%DOUYIN_PUBLISH_ROOT%browsers"
set "NODE_PATH=%DOUYIN_PUBLISH_ROOT%node_modules"

echo ============================================================
echo   抖音发布客户端 v4.1
echo   根目录: %DOUYIN_PUBLISH_ROOT%
echo ============================================================
echo.

if exist "%DOUYIN_PUBLISH_ROOT%douyin-publish.exe" (
  "%DOUYIN_PUBLISH_ROOT%douyin-publish.exe" %*
) else (
  "%DOUYIN_PUBLISH_ROOT%node\\bin\\node.exe" "%DOUYIN_PUBLISH_ROOT%app\\bundle.js" %*
)

echo.
pause
`;
  fs.writeFileSync(path.join(outDir, '启动.bat'), bat, 'utf8');
  log('  ✅ 启动.bat');
}

function writeWinExeLauncher(outDir) {
  const sourcePath = path.join(outDir, 'douyin-publish-launcher.cs');
  const exePath = path.join(outDir, 'douyin-publish.exe');
  const source = `using System;
using System.Diagnostics;
using System.IO;

class DouyinPublishLauncher
{
    static int Main(string[] args)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string node = Path.Combine(root, "node", "bin", "node.exe");
        string app = Path.Combine(root, "app", "bundle.js");

        if (!File.Exists(node))
        {
            Console.Error.WriteLine("Missing Node runtime: " + node);
            return 1;
        }

        if (!File.Exists(app))
        {
            Console.Error.WriteLine("Missing app bundle: " + app);
            return 1;
        }

        Environment.SetEnvironmentVariable("DOUYIN_PUBLISH_ROOT", root);
        Environment.SetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH", Path.Combine(root, "browsers"));
        Environment.SetEnvironmentVariable("NODE_PATH", Path.Combine(root, "node_modules"));

        string arguments = Quote(app);
        foreach (string arg in args)
        {
            arguments += " " + Quote(arg);
        }

        ProcessStartInfo info = new ProcessStartInfo(node, arguments);
        info.WorkingDirectory = root;
        info.UseShellExecute = false;
        Process process = Process.Start(info);
        process.WaitForExit();
        return process.ExitCode;
    }

    static string Quote(string value)
    {
        return "\\\"" + value.Replace("\\\\", "\\\\\\\\").Replace("\\\"", "\\\\\\\"") + "\\\"";
    }
}
`;
  fs.writeFileSync(sourcePath, source, 'utf8');
  const ps = [
    'Add-Type',
    `-OutputAssembly '${exePath}'`,
    '-OutputType ConsoleApplication',
    `-Path '${sourcePath}'`,
  ].join(' ');
  execSync(`powershell -Command "${ps}"`, { stdio: 'inherit' });
  fs.unlinkSync(sourcePath);
  log('  douyin-publish.exe');
}

function writeMacLauncher(outDir) {
  const sh = `#!/bin/bash
cd "$(dirname "$0")"
export DOUYIN_PUBLISH_ROOT="$(pwd)"
export PLAYWRIGHT_BROWSERS_PATH="$DOUYIN_PUBLISH_ROOT/browsers"
export NODE_PATH="$DOUYIN_PUBLISH_ROOT/node_modules"

echo "============================================================"
echo "  抖音发布客户端 v4.1"
echo "  根目录: $DOUYIN_PUBLISH_ROOT"
echo "============================================================"
echo

if [ -f "$DOUYIN_PUBLISH_ROOT/douyin-publish" ]; then
  chmod +x "$DOUYIN_PUBLISH_ROOT/douyin-publish" 2>/dev/null || true
  exec "$DOUYIN_PUBLISH_ROOT/douyin-publish" "$@"
fi

NODE_BIN="$DOUYIN_PUBLISH_ROOT/node/bin/node"
APP="$DOUYIN_PUBLISH_ROOT/app/bundle.js"
if [ ! -x "$NODE_BIN" ]; then
  echo "未找到 Node 运行时: $NODE_BIN"
  exit 1
fi
exec "$NODE_BIN" "$APP" "$@"
`;
  const cmdPath = path.join(outDir, '启动.command');
  fs.writeFileSync(cmdPath, sh, 'utf8');
  try { fs.chmodSync(cmdPath, 0o755); } catch { /* ignore */ }
  log('  ✅ 启动.command');
}

function runEsbuild() {
  log('\n📦 [1/5] ESBuild 打包 gui-main.js → dist/bundle.js');
  execSync('node build.js', { cwd: rootDir, stdio: 'inherit' });
}

function tryPkgBinary(outDir, platform, arch) {
  const target = `node20-${platform === 'win32' ? 'win' : platform === 'darwin' ? 'macos' : 'linux'}-${arch}`;
  const output = platform === 'win32'
    ? path.join(outDir, 'douyin-publish.exe')
    : path.join(outDir, 'douyin-publish');

  log(`\n📦 [可选] pkg 单文件 (${target})...`);
  try {
    execSync(
      `npx @yao-pkg/pkg dist/bundle.js --config package.json --targets ${target} --output "${output}"`,
      { cwd: rootDir, stdio: 'inherit', shell: true, timeout: 600000 }
    );
    if (platform !== 'win32') fs.chmodSync(output, 0o755);
    log(`  ✅ pkg 单文件: ${output}`);
    return true;
  } catch (err) {
    log(`  ⚠️ pkg 打包跳过（网络或缓存不可用，已使用便携版 Node 启动）`);
    return false;
  }
}

async function packagePortable(target) {
  const { platform, arch, label } = target;
  const outDir = path.join(releaseRoot, label);

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  log(`\n📦 [2/5] 准备 ${label} 便携客户端目录`);
  await ensureNodeRuntime(outDir, platform, arch);

  log('\n📦 [3/5] 复制应用与依赖');
  copyClientAssets(outDir);
  copyNodeModules(outDir);
  copyBrowserAssets(outDir);

  log('\n📦 [4/5] 生成启动脚本');
  if (platform === 'win32') {
    writeWinLauncher(outDir);
    writeWinExeLauncher(outDir);
  } else writeMacLauncher(outDir);

  if (usePkg) {
    log('\n📦 [5/5] 尝试 pkg 单文件');
    tryPkgBinary(outDir, platform, arch);
  } else {
    log('\n📦 [5/5] 跳过 pkg（加 --pkg 可尝试生成单文件 exe）');
  }

  log(`\n✅ 客户端目录: ${outDir}`);
  return outDir;
}

async function main() {
  log('\n' + '='.repeat(60));
  log('🎬 抖音发布客户端 - 打包（便携版 + 内置 Node）');
  log('='.repeat(60));

  fs.mkdirSync(distDir, { recursive: true });
  runEsbuild();

  const outputs = [];
  const targets = [];

  if (buildWin || (buildCurrent && process.platform === 'win32')) {
    targets.push({ platform: 'win32', arch: 'x64', label: 'win-x64' });
  }
  if (buildMac || (buildCurrent && process.platform === 'darwin')) {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    targets.push({ platform: 'darwin', arch, label: `mac-${arch}` });
  }
  if (buildCurrent && process.platform === 'linux') {
    targets.push(resolveTarget());
  }

  if (targets.length === 0 && (buildWin || buildMac)) {
    log('\n❌ 未匹配到目标平台');
    process.exit(1);
  }

  for (const target of targets) {
    outputs.push(await packagePortable(target));
  }

  log('\n' + '='.repeat(60));
  log('📦 打包完成');
  outputs.forEach((p) => log(`   → ${p}`));
  log('='.repeat(60));
  log('\n💡 分发与使用:');
  log('   将整个 release 子目录打成 zip 分发给用户');
  log('   Windows: 双击 启动.bat');
  log('   macOS:   双击 启动.command（首次可能需在「隐私与安全性」中允许）');
  log('   配置/日志: 与启动脚本同目录（client-settings.json / run_log.txt）');
  log('   无需用户单独安装 Node.js\n');
}

main().catch((err) => {
  console.error('❌ 打包失败:', err.message);
  process.exit(1);
});
