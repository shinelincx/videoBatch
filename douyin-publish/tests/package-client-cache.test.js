const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'scripts', 'package-client.js');
const source = fs.readFileSync(scriptPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const extractedBinMatch = source.match(/const extractedBin =[\s\S]*?;\r?\n/);
assert(extractedBinMatch, 'ensureNodeRuntime should define extractedBin');

const extractedBinIndex = source.indexOf('const extractedBin =');
const extractConditionIndex = source.indexOf('if (!fs.existsSync(extractedBin))');

assert(
  extractConditionIndex > extractedBinIndex,
  'ensureNodeRuntime should re-extract cached Node when extracted node.exe is missing'
);

assert(
  source.includes('fs.unlinkSync(archivePath)'),
  'ensureNodeRuntime should delete a corrupt cached Node archive before retrying'
);

assert(
  source.includes('await downloadFile(url, archivePath)'),
  'ensureNodeRuntime should be able to re-download Node after cache recovery'
);

assert(
  source.includes('-ErrorAction Stop'),
  'ensureNodeRuntime should make Expand-Archive fail with a non-zero exit code'
);

assert(
  source.includes('Node runtime archive did not produce'),
  'ensureNodeRuntime should verify extracted node.exe exists after extraction'
);

assert(
  source.includes('function writeWinExeLauncher(outDir)'),
  'Windows packaging should generate a douyin-publish.exe launcher'
);

assert(
  source.includes("path.join(outDir, 'douyin-publish.exe')"),
  'Windows exe launcher should be written into the release directory'
);

console.log('package-client cache recovery test passed');
