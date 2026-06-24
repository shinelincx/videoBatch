/**
 * 抖音自动发布视频 - 测试文件
 * 
 * 测试工具函数：getVideoFile, getScheduledTime
 */

const fs = require('fs');
const path = require('path');

// 模拟 CONFIG
const CONFIG = {
  videoDir: 'D:\\test',
};

// 工具函数（从主脚本复制）
function getVideoFile(dir) {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];
  
  if (!fs.existsSync(dir)) {
    console.error(`❌ 视频文件夹不存在: ${dir}`);
    return null;
  }
  
  const files = fs.readdirSync(dir);
  const videoFile = files.find(file => {
    const ext = path.extname(file).toLowerCase();
    return videoExtensions.includes(ext);
  });
  
  if (!videoFile) {
    console.error(`❌ 在 ${dir} 中未找到视频文件`);
    return null;
  }
  
  const fullPath = path.join(dir, videoFile);
  console.log(`📹 找到视频文件: ${videoFile}`);
  return fullPath;
}

function getScheduledTime(scheduledTime = null) {
  if (scheduledTime) {
    return scheduledTime;
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} 10:00`;
}

// 测试函数
function runTests() {
  console.log('\n🚀 运行测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  // 测试 getScheduledTime
  console.log('📋 测试 getScheduledTime 函数:');
  try {
    const result = getScheduledTime();
    const expectedPattern = /^\d{4}-\d{2}-\d{2} 10:00$/;
    if (expectedPattern.test(result)) {
      console.log(`  ✅ 自动计算定时时间: ${result}`);
      passed++;
    } else {
      console.log(`  ❌ 时间格式不正确: ${result}`);
      failed++;
    }
    
    const customTime = '2024-12-25 15:30';
    const customResult = getScheduledTime(customTime);
    if (customResult === customTime) {
      console.log(`  ✅ 自定义定时时间: ${customResult}`);
      passed++;
    } else {
      console.log(`  ❌ 自定义时间未正确返回`);
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ 测试失败: ${e.message}`);
    failed++;
  }
  
  // 测试 getVideoFile
  console.log('\n📋 测试 getVideoFile 函数:');
  try {
    // 测试无效路径
    const invalidPath = getVideoFile('D:\\invalid_path_12345');
    if (invalidPath === null) {
      console.log('  ✅ 无效路径处理正确');
      passed++;
    } else {
      console.log('  ❌ 无效路径未正确处理');
      failed++;
    }
    
    // 测试有效路径（检查是否有视频文件）
    const testDir = path.join(__dirname, 'test-videos');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      // 创建一个空的测试文件（不是视频）
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'test');
    }
    
    const noVideoResult = getVideoFile(testDir);
    if (noVideoResult === null) {
      console.log('  ✅ 无视频文件时处理正确');
      passed++;
    } else {
      console.log('  ❌ 无视频文件时未正确处理');
      failed++;
    }
    
    // 清理测试目录
    fs.rmSync(testDir, { recursive: true });
    
  } catch (e) {
    console.log(`  ❌ 测试失败: ${e.message}`);
    failed++;
  }
  
  // 输出测试结果
  console.log('\n========================================');
  console.log(`测试结果: ✅ ${passed} 通过, ❌ ${failed} 失败`);
  console.log('========================================\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();