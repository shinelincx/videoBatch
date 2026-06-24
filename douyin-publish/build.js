/**
 * Esbuild 打包脚本
 * 将所有业务 JS 模块打包为单个文件 dist/bundle.js
 * playwright 作为外部依赖由 pkg 自动打包进 node_modules
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

esbuild.build({
  entryPoints: ['gui-main.js'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/bundle.js',
  format: 'cjs',
  // playwright 作为外部依赖，pkg 会自动从 node_modules 打包
  external: [
    'playwright',
    'playwright-core',
    '@grpc/grpc-js',
    '@grpc/proto-loader',
  ],
  minify: false,
  sourcemap: false,
  keepNames: true,
}).then(() => {
  console.log('✅ ESBuild 打包完成 → dist/bundle.js');
}).catch((err) => {
  console.error('❌ ESBuild 打包失败:', err);
  process.exit(1);
});
