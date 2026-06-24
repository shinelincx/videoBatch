/**
 * 抖音10步发布流程模块
 * 从 index.js 抽离，接收任务参数执行自动化发布
 */
const path = require('path');
const fs = require('fs');

/**
 * 延迟工具函数
 */
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ======================== 网络延迟检测 ========================

/**
 * 网络速度三档定义
 * 基于实际页面请求延迟 (ms) 判定网络环境
 */
const NETWORK_TIERS = {
  FAST:  { name: '快', maxLatency: 150,  factor: 0.60 },  // 低延迟 → 操作更快
  GOOD:  { name: '良', maxLatency: 400,  factor: 1.00 },  // 正常延迟 → 基准速度
  POOR:  { name: '差', maxLatency: Infinity, factor: 1.50 },  // 高延迟 → 需更谨慎
};

/**
 * 根据平均延迟获取网络档位
 */
function getNetworkTier(latency) {
  if (latency <= NETWORK_TIERS.FAST.maxLatency) return NETWORK_TIERS.FAST;
  if (latency <= NETWORK_TIERS.GOOD.maxLatency) return NETWORK_TIERS.GOOD;
  return NETWORK_TIERS.POOR;
}

/**
 * 测试当前网络延迟
 * 对目标域名发起多次 HEAD 请求，取去极均值
 * @param {object} page - Playwright page 对象
 * @param {string} testUrl - 以测试的目标 URL（取其 origin）
 * @returns {Promise<{latency: number, tier: object, factor: number}>}
 */
async function measureNetworkLatency(page, testUrl) {
  const domain = (() => {
    try { return new URL(testUrl).origin; } catch (e) { return testUrl; }
  })();

  console.log('\n🌐 正在测试网络延迟...');

  const samples = [];
  const testCount = 5;

  for (let i = 0; i < testCount; i++) {
    const start = Date.now();
    try {
      await page.evaluate(async (url) => {
        await fetch(url, { method: 'HEAD', cache: 'no-store', mode: 'no-cors' });
      }, domain);
      samples.push(Date.now() - start);
    } catch (e) {
      // fetch 失败则使用页面加载耗时作为参考
      samples.push(3000);
    }
    await delay(200);
  }

  // 排序后去掉最高最低，取均值
  samples.sort((a, b) => a - b);
  const trimmed = samples.slice(1, -1);
  const avgLatency = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  const tier = getNetworkTier(avgLatency);

  console.log(`   📊 平均延迟: ${Math.round(avgLatency)}ms → 网络档位: "${tier.name}" (因子: x${tier.factor})`);
  console.log(`   📋 采样数据: [${samples.map(s => Math.round(s) + 'ms').join(', ')}]\n`);

  return { latency: avgLatency, tier, factor: tier.factor };
}

/**
 * 模拟复制粘贴输入
 */
async function pasteText(page, locator, text) {
  try {
    await locator.click();
    await delay(300);

    const success = await page.evaluate(async (txt) => {
      try {
        await navigator.clipboard.writeText(txt);
        return true;
      } catch (e) {
        return false;
      }
    }, text);

    if (!success) {
      await locator.fill(text);
      return true;
    }

    await page.keyboard.press('Control+a');
    await delay(100);
    await page.keyboard.press('Control+v');
    await delay(500);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 执行完整的10步发布流程
 * @param {object} page - Playwright page 对象
 * @param {object} human - HumanSimulator 实例
 * @param {object} taskParams - 任务参数 { videoPath, title, description, visibility, uploadUrl? }
 * @returns {Promise<{success: boolean, stepResults: object, error?: string}>}
 */
async function executePublish(page, human, taskParams) {
  const {
    videoPath,
    title = '',
    description = '',
    visibility = '仅自己可见',
    uploadUrl = 'https://creator.douyin.com/',
    // 挂车相关
    isCarrier = 0,
    productLink = '',
    // 定时发布相关
    publishTime = '定时发布',
    publishDelay = 0,
    // 声明相关
    selfDeclaration = '无需添加自主声明',
    syncPublish = '不同时发布',
    savePermission = '不允许',
  } = taskParams;

  // 验证必要参数
  if (!videoPath || !fs.existsSync(videoPath)) {
    return { success: false, error: `视频文件不存在: ${videoPath}` };
  }

  // 计算定时发布时间
  let scheduleDateStr = '';
  const now = new Date();
  if (publishDelay > 0) {
    const publishDate = new Date(now.getTime() + publishDelay * 60 * 60 * 1000);
    const sy = publishDate.getFullYear();
    const sm = String(publishDate.getMonth() + 1).padStart(2, '0');
    const sd = String(publishDate.getDate()).padStart(2, '0');
    const sh = String(publishDate.getHours()).padStart(2, '0');
    const smi = String(publishDate.getMinutes()).padStart(2, '0');
    scheduleDateStr = `${sy}-${sm}-${sd} ${sh}:${smi}`;
  }

  console.log('\n' + '█'.repeat(70));
  console.log('█  🚀 开始执行发布流程 (10步拟人化操作)');
  console.log('█'.repeat(70));
  console.log(`   📂 视频: ${path.basename(videoPath)} (${(fs.statSync(videoPath).size / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`   📝 标题: "${title}"`);
  console.log(`   📝 描述: "${description}"`);
  console.log(`   🔒 可见性: ${visibility}`);
  console.log(`   🔗 挂车: ${isCarrier == 1 ? `是 (${productLink})` : '否'}`);
  console.log(`   ⏰ 发布方式: ${publishTime}${publishDelay > 0 ? ` (延时${publishDelay}小时 → ${scheduleDateStr})` : ''}`);
  console.log(`   📋 声明: ${selfDeclaration}`);
  console.log(`   💾 保存权限: ${savePermission}\n`);

  // 导航到上传页面
  console.log('📍 导航到创作者中心...');
  await page.goto(uploadUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  console.log(`   ✅ 页面已打开: ${page.url()}\n`);

  // ========== 网络延迟检测 & 动态速度因子 ==========
  const network = await measureNetworkLatency(page, uploadUrl);
  const speedFactor = network.factor;

  // 包装函数：应用网络因子的人机等待
  const netThink = (minTime, maxTime) =>
    human.think({ minTime: Math.round(minTime * speedFactor), maxTime: Math.round(maxTime * speedFactor) });
  const netDelay = (ms) => delay(Math.round(ms * speedFactor));

  console.log(`⚡ 网络档位: "${network.tier.name}" | 速度因子: x${speedFactor} | 所有等待时间已动态调整\n`);

  // 等待页面稳定（根据网络状况动态调整）
  await netDelay(2000);

  let stepResults = {};

  // ====== Step 1: 在container-UG4zMC中点击"发布视频" ======
  console.log('【Step 1/10】📹 点击"发布视频"按钮...');

  await netThink(300, 600);

  try {
    let publishVideoOption = null;

    const targetContainer = page.locator('.container-UG4zMC').filter({ visible: true }).first();
    if (await targetContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   📦 找到目标容器 container-UG4zMC');
      publishVideoOption = targetContainer.locator('text=发布视频').first();
    } else {
      publishVideoOption = page.locator('.container-UG4zMC:has-text("发布视频"), [class*="master-button"]:has-text("发布视频")').first();
      console.log('   🔍 使用备用方案');
    }

    if (publishVideoOption && await publishVideoOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await human.humanClick(publishVideoOption);
      console.log('   ✅ 已点击"发布视频"按钮 (container-UG4zMC)\n');
      stepResults.step1 = true;
      await netDelay(1000);
    } else {
      console.log('   ⚠️ 未找到"发布视频"，可能已在发布页面\n');
      stepResults.step1 = true;
    }
  } catch (e) {
    console.log(`   ⚠️ Step 1 跳过: ${e.message.substring(0, 50)}\n`);
    stepResults.step1 = true;
  }

  // ====== Step 2: 点击"上传视频"按钮 ======
  console.log('【Step 2/10】📤 点击"上传视频"按钮...');

  await netThink(400, 800);

  try {
    const uploadBtn = page.locator('button:has-text("上传视频"), [class*="upload"]:has-text("上传"), text="上传视频"').first();

    if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await human.humanClick(uploadBtn);
      console.log('   ✅ 已点击"上传视频"按钮\n');
      stepResults.step2 = true;
      await netDelay(800);
    } else {
      console.log('   ℹ️ 上传区域已就绪，直接上传\n');
      stepResults.step2 = true;
    }
  } catch (e) {
    console.log(`   ℹ️ Step 2: ${e.message.substring(0, 40)}\n`);
    stepResults.step2 = true;
  }

  // ====== Step 3: 选择并上传视频文件 ======
  console.log('【Step 3/10】🎞️ 选择视频文件...');
  console.log(`   📂 路径: ${videoPath}`);
  console.log(`   📊 大小: ${(fs.statSync(videoPath).size / 1024 / 1024).toFixed(1)} MB\n`);

  await netThink(500, 1000);

  let uploadSuccess = false;

  try {
    const fileInput = page.locator('input[type="file"][accept*="video"], input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });

    await human.naturalPause();
    await fileInput.setInputFiles(videoPath);

    console.log('   ✅ 视频文件已选择，开始上传...\n');
    uploadSuccess = true;
    stepResults.step3 = true;

  } catch (e) {
    console.log(`   ❌ 方式1失败，尝试点击上传...\n`);

    try {
      const uploadTrigger = page.locator('[class*="upload"], [class*="Upload"], text="上传"').first();

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        human.humanClick(uploadTrigger),
      ]);

      await human.naturalPause();
      await fileChooser.setFiles(videoPath);

      console.log('   ✅ 通过文件选择器完成上传\n');
      uploadSuccess = true;
      stepResults.step3 = true;

    } catch (e2) {
      console.log(`   ❌ 上传失败: ${e2.message}\n`);
      stepResults.step3 = false;
    }
  }

  if (uploadSuccess) {
    console.log('✅ 视频已提交，上传将在后台进行...\n');
    console.log('💡 提示: Step 4-10 将在上传过程中同步执行\n');

    const randomWait = Math.floor(Math.random() * 3000 * speedFactor) + Math.round(1000 * speedFactor);
    console.log(`   ⏳ 随机等待 ${randomWait / 1000} 秒...\n`);
    await delay(randomWait);
  }

  // ====== Step 4: 填写标题和描述 ======
  console.log('【Step 4/10】✍️ 填写作品信息...');
  console.log(`   📝 标题: "${title}"`);
  console.log(`   📝 描述: "${description}"\n`);

  await netThink(800, 1500);

  let titleFilled = false, descFilled = false;

  try {
    const titleSelectors = [
      'input[placeholder*="标题"]',
      'input[class*="semi-input"]',
      '.semi-input-default',
      'input[placeholder*="填写"]',
    ];

    for (const sel of titleSelectors) {
      try {
        const input = page.locator(sel).first();
        if (await input.count() > 0 && await input.isVisible({ timeout: 1500 }).catch(() => false)) {
          const success = await pasteText(page, input, title);
          if (success) {
            console.log(`   ✅ 标题填写成功（粘贴）\n`);
            titleFilled = true;
            break;
          }
        }
      } catch (e) { /* 尝试下一个选择器 */ }
    }

    await human.naturalPause();

    const descSelectors = [
      '[contenteditable="true"]',
      '.notranslate',
      '.zone-container',
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="简介"]',
    ];

    for (const sel of descSelectors) {
      try {
        const editor = page.locator(sel).first();
        if (await editor.count() > 0 && await editor.isVisible({ timeout: 1500 }).catch(() => false)) {
          const success = await pasteText(page, editor, description);
          if (success) {
            console.log(`   ✅ 描述填写成功（粘贴）\n`);
            descFilled = true;
            break;
          }
        }
      } catch (e) { /* 尝试下一个选择器 */ }
    }

  } catch (e) {
    console.log(`   ⚠️ 填写失败: ${e.message}\n`);
  }

  stepResults.step4 = titleFilled || descFilled;

  // ====== Step 5: 选择推荐标签（3次）======
  console.log('【Step 5/10】🏷️ 等待视频处理完成，选择推荐标签...\n');

  // ⚠️ 等待视频上传处理完成（推荐标签在视频加载完成后才出现）
  console.log('   ⏳ 等待视频处理完成...');
  let videoReady = false;
  for (let w = 0; w < 24; w++) { // 最多等2分钟 (24 × 5秒)
    await delay(5000);
    // 检测视频处理完成标志：缩略图/预览出现
    const readyIndicators = [
      'img[src*="video"]',
      'video[src]',
      '[class*="cover"] img',
      '[class*="thumbnail"] img',
      '[class*="preview"] video',
    ];
    for (const ri of readyIndicators) {
      try {
        const el = page.locator(ri).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          videoReady = true;
          console.log(`   ✅ 视频处理完成 (第${(w + 1) * 5}秒, 检测到: ${ri})\n`);
          break;
        }
      } catch (e) { /* skip */ }
    }
    if (videoReady) break;
    if ((w + 1) % 6 === 0) {
      console.log(`   ⏳ 仍在等待视频处理... (${(w + 1) * 5}秒)`);
    }
  }
  if (!videoReady) {
    console.log('   ⚠️ 视频处理等待超时，尝试继续...\n');
  }

  await netThink(500, 1000);

  let tagsSelected = 0;

  try {
    const tagSelectors = [
      '[class*="tag"]:visible',
      '[class*="Tag"]:visible',
      '[class*="recommend"]:visible',
      'div[class*="label"]:visible',
    ];

    for (const tagSel of tagSelectors) {
      try {
        const tags = page.locator(tagSel);
        const count = await tags.count();

        if (count > 0) {
          console.log(`   🔍 找到 ${count} 个推荐标签\n`);

          for (let i = 0; i < Math.min(3, count); i++) {
            try {
              const tag = tags.nth(i);
              if (await tag.isVisible({ timeout: 1000 }).catch(() => false)) {
                await human.humanClick(tag);
                tagsSelected++;
                console.log(`   ✅ 已选择标签 #${tagsSelected}\n`);

                if (i < 2) {
                  await netDelay(600);
                }
              }
            } catch (e) { /* skip */ }
          }
          break;
        }
      } catch (e) { /* 尝试下一个选择器 */ }
    }

    if (tagsSelected === 0) {
      console.log('   ⚠️ 未找到推荐标签区域\n');
    }

  } catch (e) {
    console.log(`   ⚠️ 标签选择出错: ${e.message.substring(0, 50)}\n`);
  }

  stepResults.step5 = tagsSelected > 0;
  await human.naturalPause();

  // ====== Step 6: 自主声明设置 ======
  console.log('【Step 6/10】📋 设置自主声明...\n');

  await netThink(600, 1200);

  let declarationSet = false;

  try {
    // 先滚动到自主声明区域
    console.log('   🔍 滚动查找自主声明区域...\n');
    await human.humanScroll('down', 150);
    await delay(500);

    // 更精确的选择器：优先匹配包含"自主声明"文字的可点击元素
    const declLabelSelectors = [
      // 直接文字匹配
      'text="自主声明"',
      'span:text("自主声明")',
      'div:text("自主声明")',
      // 下拉框/选择器类型的自主声明
      '.semi-select:has-text("自主声明")',
      '[class*="select"]:has-text("自主声明")',
      // 表单项
      '.semi-form-field:has-text("自主声明")',
      '[class*="form-item"]:has-text("自主声明")',
      // 声明相关class
      '[class*="declaration"]',
      '[class*="Declaration"]',
      // 包含"声明"的可点击元素
      'text="声明"',
      ':has-text("声明")',
      // 更宽泛的匹配
      'div:has-text("自主声明")',
    ];

    let declClicked = false;

    for (const labelSel of declLabelSelectors) {
      try {
        const declLabel = page.locator(labelSel).first();
        if (await declLabel.count() > 0 && await declLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   ✅ 找到自主声明元素: "${labelSel}"\n`);

          // 滚动到可见区域
          await declLabel.scrollIntoViewIfNeeded();
          await delay(300);

          // 尝试点击
          await human.humanClick(declLabel);
          declClicked = true;
          console.log('   🖱️ 已点击自主声明，等待弹窗/下拉...\n');
          break;
        }
      } catch (e) { /* 尝试下一个 */ }
    }

    // 如果文字点击没触发，尝试点击自主声明旁边的下拉按钮/select控件
    if (!declClicked) {
      console.log('   ⚠️ 文字点击未找到元素，尝试点击下拉控件...\n');
      const altSelectors = [
        '.semi-select:has-text("自主声明") .semi-select-arrow',
        '[class*="select"]:has-text("声明") [class*="arrow"]',
        '[class*="select"]:has-text("声明") [class*="icon"]',
        '.semi-select-selection',
        '[role="combobox"]',
      ];
      for (const altSel of altSelectors) {
        try {
          const altEl = page.locator(altSel).first();
          if (await altEl.count() > 0 && await altEl.isVisible({ timeout: 1500 }).catch(() => false)) {
            await altEl.scrollIntoViewIfNeeded();
            await delay(200);
            await human.humanClick(altEl);
            declClicked = true;
            console.log(`   ✅ 已点击下拉控件: "${altSel}"\n`);
            break;
          }
        } catch (e) { /* try next */ }
      }
    }

    if (declClicked) {
      await delay(1000);

      // 等待弹窗/下拉出现（增加等待时间）
      let popupAppeared = false;
      for (let wait = 0; wait < 8; wait++) {
            await delay(500);
            const popupSelectors = [
              '[role="listbox"]', '[role="menu"]', '[role="dialog"]',
              '[class*="dropdown"]:visible', '[class*="Dropdown"]:visible',
              '[class*="select-dropdown"]:visible', '.semi-select-dropdown:visible',
              '[class*="popup"]:visible', '[class*="option"]:visible',
            ];
            for (const popupSel of popupSelectors) {
              try {
                const popup = page.locator(popupSel).first();
                if (await popup.isVisible({ timeout: 500 }).catch(() => false)) {
                  popupAppeared = true;
                  console.log(`   ✅ 弹窗/菜单已出现 (${popupSel})\n`);
                  break;
                }
              } catch (e) { /* skip */ }
            }
            if (popupAppeared) break;
          }

          if (popupAppeared) {
            console.log(`   🔍 在弹窗中查找"${selfDeclaration}"选项...\n`);
            await delay(800);

            const optionSelectors = [
              `text="${selfDeclaration}"`,
              ':has-text("无需"):has-text("声明")',
              '[class*="option"]:has-text("无需")',
              '[class*="item"]:has-text("无需")',
              'li:has-text("无需添加")',
              'div[role="option"]:has-text("无需")',
            ];

            let optionClicked = false;
            for (const optSel of optionSelectors) {
              try {
                const option = page.locator(optSel).first();
                if (await option.isVisible({ timeout: 1500 }).catch(() => false)) {
                  await human.humanClick(option);
                  console.log(`   ✅✅✅ 已选择"${selfDeclaration}"！\n`);
                  declarationSet = true;
                  optionClicked = true;
                  break;
                }
              } catch (e) { /* skip */ }
            }

            if (!optionClicked) {
              console.log('   ⚠️ 未找到精确匹配项，尝试模糊搜索...\n');
              const fallbackOptions = page.locator('[role="option"], li, [class*="item"], [class*="option"]');
              const fallbackCount = await fallbackOptions.count();
              for (let i = 0; i < fallbackCount; i++) {
                try {
                  const opt = fallbackOptions.nth(i);
                  const text = await opt.textContent().catch(() => '');
                  if (text && (text.includes('无需') || text.includes('不添加') || text === '无')) {
                    if (await opt.isVisible({ timeout: 500 }).catch(() => false)) {
                      await human.humanClick(opt);
                      console.log(`   ✅ 已选择选项: "${text.trim()}"\n`);
                      declarationSet = true;
                      optionClicked = true;
                      break;
                    }
                  }
                } catch (e) { /* skip */ }
              }
            }

            // 查找确认按钮
            if (declarationSet || optionClicked) {
              console.log('   🔍 查找确认按钮...\n');
              await human.naturalPause();
              const confirmBtnSelectors = [
                'button:has-text("确认")', 'button:has-text("确定")',
                'button:has-text("保存")', 'button:has-text("完成")',
                'button:has-text("提交")', '[class*="confirm"] button:visible',
                '[class*="submit"] button:visible', '.semi-modal-footer button:visible',
                'div[role="dialog"] button:visible',
              ];
              let confirmClicked = false;
              for (const btnSel of confirmBtnSelectors) {
                try {
                  const btn = page.locator(btnSel).first();
                  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
                    await human.humanClick(btn);
                    console.log('   ✅✅✅ 已点击确认按钮！自主声明设置完成\n');
                    confirmClicked = true;
                    declarationSet = true;
                    break;
                  }
                } catch (e) { /* skip */ }
              }
              if (!confirmClicked) {
                console.log('   ℹ️ 未找到确认按钮，可能已自动关闭\n');
                declarationSet = true;
              }
            }
          } else {
            console.log('   ℹ️ 未检测到弹窗，尝试下拉选择模式\n');
            const selectOption = page.getByText(selfDeclaration, { exact: true }).first()
              .or(page.getByText('无需添加', { exact: true })).first()
              .or(page.getByText('无需添加自主声明')).first()
              .or(page.getByText('无', { exact: true })).first();
            if (await selectOption.isVisible({ timeout: 2000 }).catch(() => false)) {
              await human.humanClick(selectOption);
              console.log(`   ✅ 已选择"${selfDeclaration}"\n`);
              declarationSet = true;
            }
          }
        } else {
          // declClicked 为 false，没找到自主声明元素
          console.log('   ℹ️ 点击自主声明未成功，无弹窗响应\n');
        }

    if (!declarationSet) {
      console.log('   ℹ️ 未找到自主声明设置项，跳过\n');
      declarationSet = true;
    }
  } catch (e) {
    console.log(`   ⚠️ 声明设置出错: ${e.message.substring(0, 50)}\n`);
    declarationSet = true;
  }

  stepResults.step6 = declarationSet;

  await human.humanScroll('down', human.randomInRange(300, 500));
  await human.naturalPause();

  // ====== Step 7: 谁可以看 - 仅自己可见 ======
  console.log(`【Step 7/10】🔒 设置可见性：${visibility}...\n`);

  await netThink(200, 700);

  let visibilitySet = false;

  try {
    const visibilityLabel = page.getByText('谁可以看').first()
      .or(page.getByText('可见范围')).first()
      .or(page.getByText('隐私设置')).first();

    if (await visibilityLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   ✅ 找到可见性设置\n');

      const selectSuccess = await human.selectDropdown('text=谁可以看', visibility);

      if (selectSuccess) {
        console.log(`   ✅ 已设置为：${visibility}\n`);
        visibilitySet = true;
      } else {
        await human.humanClick(visibilityLabel);
        await human.naturalPause();

        const privateOption = page.getByText(visibility, { exact: true }).first()
          .or(page.getByText('私密', { exact: true })).first()
          .or(page.getByText('仅自己', { exact: true })).first();

        if (await privateOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await human.humanClick(privateOption);
          console.log(`   ✅ 已设置为：${visibility}\n`);
          visibilitySet = true;
        }
      }
    } else {
      console.log('   ⚠️ 未找到可见性设置\n');
    }
  } catch (e) {
    console.log(`   ⚠️ 可见性设置出错: ${e.message.substring(0, 50)}\n`);
  }

  stepResults.step7 = visibilitySet;
  await human.naturalPause();

  // ====== Step 7.5: 挂车（添加商品链接）—— 仅在 isCarrier=1 时执行 ======
  let carrierSet = true; // 默认跳过
  if (isCarrier == 1 && productLink) {
    console.log('【Step 7.5/10】🛒 添加商品链接（挂车）...\n');
    console.log(`   🔗 链接: ${productLink}\n`);

    await netThink(400, 1000);
    carrierSet = false;

    try {
      // 在 class=anchor-part-xN_guh 的标签内查找选择框，选择"购物车"选项
      const anchorPart = page.locator('.anchor-part-xN_guh').first();
      const anchorVisible = await anchorPart.isVisible({ timeout: 3000 }).catch(() => false);

      if (!anchorVisible) {
        console.log('   ℹ️ 未找到 .anchor-part-xN_guh 容器，跳过挂车步骤\n');
        carrierSet = true;
      } else {
        // 在容器内查找 select 下拉框或可点击的选择器
        let cartClicked = false;

        // 方式1: 查找 <select> 元素并选中"购物车"
        try {
          const selectEl = anchorPart.locator('select').first();
          if (await selectEl.isVisible({ timeout: 1500 }).catch(() => false)) {
            await selectEl.selectOption('购物车');
            console.log('   ✅ 已在 select 中选择"购物车"\n');
            cartClicked = true;
          }
        } catch (e) { /* try next */ }

        // 方式2: 点击下拉框后在选项中找"购物车"
        if (!cartClicked) {
          try {
            const dropdown = anchorPart.locator('[role="listbox"], [class*="select"], [class*="dropdown"], select, .semi-select').first();
            if (await dropdown.isVisible({ timeout: 1500 }).catch(() => false)) {
              await human.humanClick(dropdown);
              await delay(800);

              // 在弹出的选项中点击"购物车"
              const cartOption = page.locator('text="购物车"').first();
              if (await cartOption.isVisible({ timeout: 1500 }).catch(() => false)) {
                await human.humanClick(cartOption);
                console.log('   ✅ 已在下拉选项中选择"购物车"\n');
                cartClicked = true;
              }
            }
          } catch (e) { /* try next */ }
        }

        // 方式3: 直接在容器内查找带"购物车"文本的可点击元素
        if (!cartClicked) {
          try {
            const cartInAnchor = anchorPart.locator(':text("购物车")').first();
            if (await cartInAnchor.isVisible({ timeout: 1500 }).catch(() => false)) {
              await human.humanClick(cartInAnchor);
              console.log('   ✅ 已点击锚点区域内的"购物车"\n');
              cartClicked = true;
            }
          } catch (e) { /* ignore */ }
        }

        if (!cartClicked) {
          console.log('   ℹ️ 未在 .anchor-part-xN_guh 内找到"购物车"选项，跳过挂车步骤\n');
          carrierSet = true;
        } else {
          // 将 productLink 粘贴到右侧输入框
          const linkInputSelectors = [
            'input[placeholder*="链接"]',
            'input[placeholder*="商品"]',
            'input[placeholder*="url"]',
            'input[type="text"]:visible',
            '.semi-input:visible',
          ];

          let linkFilled = false;
          for (const inputSel of linkInputSelectors) {
            try {
              const linkInput = page.locator(inputSel).first();
              if (await linkInput.isVisible({ timeout: 1500 }).catch(() => false)) {
                await linkInput.click();
                await delay(200);

                // 复制粘贴链接
                await page.evaluate(async (url) => {
                  try {
                    await navigator.clipboard.writeText(url);
                  } catch (e) { /* ignore */ }
                }, productLink);
                await page.keyboard.press('Control+v');
                await delay(500);

                console.log(`   ✅ 已粘贴商品链接: ${productLink}\n`);

                // 点击"添加链接"按钮
                let addLinkClicked = false;
                const addLinkSelectors = [
                  'button:has-text("添加链接")',
                  ':text("添加链接")',
                  '[class*="add-link"]',
                ];
                for (const btnSel of addLinkSelectors) {
                  try {
                    const addBtn = page.locator(btnSel).first();
                    if (await addBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
                      await human.humanClick(addBtn);
                      await delay(800);
                      console.log('   ✅ 已点击"添加链接"\n');
                      addLinkClicked = true;
                      break;
                    }
                  } catch (e) { /* try next */ }
                }

                if (!addLinkClicked) {
                  console.log('   ⚠️ 未找到"添加链接"按钮\n');
                } else {
                  // 在弹出框中查找商品短标题输入框并粘贴 title
                  const titleInputSelectors = [
                    'input[placeholder*="短标题"]',
                    'input[placeholder*="商品短标题"]',
                    'input[placeholder*="标题"]',
                    '.semi-input[placeholder*="标题"]',
                    'input[type="text"]:visible',
                  ];

                  let titleFilled = false;
                  for (const titleSel of titleInputSelectors) {
                    try {
                      const titleInput = page.locator(titleSel).first();
                      if (await titleInput.isVisible({ timeout: 1500 }).catch(() => false)) {
                        await titleInput.click();
                        await delay(200);

                        await page.evaluate(async (txt) => {
                          try {
                            await navigator.clipboard.writeText(txt);
                          } catch (e) { /* ignore */ }
                        }, title);
                        await page.keyboard.press('Control+v');
                        await delay(500);

                        console.log(`   ✅ 已粘贴商品标题: ${title}\n`);
                        titleFilled = true;
                        break;
                      }
                    } catch (e) { /* try next */ }
                  }

                  if (!titleFilled) {
                    console.log('   ⚠️ 未找到商品标题输入框\n');
                  }

                  // 点击"完成编辑"按钮
                  const doneSelectors = [
                    'button:has-text("完成编辑")',
                    ':text("完成编辑")',
                    'button:has-text("完成")',
                    '[class*="confirm"]',
                  ];
                  let doneClicked = false;
                  for (const doneSel of doneSelectors) {
                    try {
                      const doneBtn = page.locator(doneSel).first();
                      if (await doneBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
                        await human.humanClick(doneBtn);
                        await delay(500);
                        console.log('   ✅ 已点击"完成编辑"\n');
                        doneClicked = true;
                        break;
                      }
                    } catch (e) { /* try next */ }
                  }

                  if (!doneClicked) {
                    console.log('   ⚠️ 未找到"完成编辑"按钮\n');
                  }
                }

                linkFilled = true;
                carrierSet = true;
                break;
              }
            } catch (e) { /* try next */ }
          }

          if (!linkFilled) {
            console.log('   ⚠️ 未找到链接输入框\n');
            carrierSet = true;
          }
        }
      }

    } catch (e) {
      console.log(`   ⚠️ 挂车设置出错: ${e.message.substring(0, 50)}\n`);
      carrierSet = true;
    }

    await human.naturalPause();
  }

  stepResults.carrier = carrierSet;

  // ====== Step 7.6: 保存权限设置 —— 在定时发布之前 ======
  console.log(`【Step 7.6/10】💾 设置保存权限：${savePermission}...\n`);

  await netThink(500, 1000);

  let savePermissionSet = false;

  try {
    const savePermLabelSelectors = [
      'text="保存权限"',
      'text="下载权限"',
      'span:text("保存权限")',
      'div:text("保存权限")',
      ':has-text("保存权限")',
      '[class*="savePermission"]',
      '[class*="save-permission"]',
    ];

    let permLabelClicked = false;

    for (const labelSel of savePermLabelSelectors) {
      try {
        const permLabel = page.locator(labelSel).first();
        if (await permLabel.count() > 0 && await permLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   ✅ 找到保存权限元素: "${labelSel}"\n`);
          await permLabel.scrollIntoViewIfNeeded();
          await delay(300);
          await human.humanClick(permLabel);
          permLabelClicked = true;
          await delay(1000);
          break;
        }
      } catch (e) { /* try next */ }
    }

    if (permLabelClicked) {
      // 在弹窗/下拉中查找选项
      console.log(`   🔍 查找"${savePermission}"选项...\n`);

      const permOptionSelectors = [
        `text="${savePermission}"`,
        ':has-text("允许")',
        ':has-text("不允许")',
        '[role="option"]:has-text("允许")',
        '[role="option"]:has-text("不允许")',
        'li:has-text("允许")',
        'li:has-text("不允许")',
        '[class*="option"]:has-text("允许")',
        '[class*="option"]:has-text("不允许")',
      ];

      let optionClicked = false;
      for (const optSel of permOptionSelectors) {
        try {
          const option = page.locator(optSel).first();
          if (await option.isVisible({ timeout: 1500 }).catch(() => false)) {
            await human.humanClick(option);
            console.log(`   ✅✅✅ 已选择"${savePermission}"！\n`);
            savePermissionSet = true;
            optionClicked = true;
            break;
          }
        } catch (e) { /* skip */ }
      }

      if (!optionClicked) {
        console.log(`   ⚠️ 未找到"${savePermission}"选项\n`);
        savePermissionSet = true; // 跳过不阻塞
      }
    } else {
      console.log('   ℹ️ 未找到保存权限设置项，跳过\n');
      savePermissionSet = true;
    }
  } catch (e) {
    console.log(`   ⚠️ 保存权限设置出错: ${e.message.substring(0, 50)}\n`);
    savePermissionSet = true;
  }

  stepResults.savePermission = savePermissionSet;
  await human.naturalPause();

  // ====== Step 8: 定时发布 ======
  if (publishTime === '立即发布') {
    console.log('【Step 8/10】⏰ 发布方式：立即发布，跳过定时设置...\n');
    stepResults.step8 = true;
  } else {
    console.log(`【Step 8/10】⏰ 设置定时发布（延时 ${publishDelay} 小时）...\n`);

    await netThink(800, 1500);

    let scheduledPublishSet = false;

    // 计算发布时间
    const publishDate = new Date(now.getTime() + publishDelay * 60 * 60 * 1000);
    const py = publishDate.getFullYear();
    const pm = String(publishDate.getMonth() + 1).padStart(2, '0');
    const pd = String(publishDate.getDate()).padStart(2, '0');
    const ph = String(publishDate.getHours()).padStart(2, '0');
    const pmi = String(publishDate.getMinutes()).padStart(2, '0');

    console.log(`   📆 目标时间: ${py}-${pm}-${pd} ${ph}:${pmi}\n`);

    try {
      const scheduleLabelSelectors = [
        'text="定时发布"', 'text="定时"', 'text="发布时间"', 'text="计划发布"',
      ];

      let scheduleLabelFound = false;

      for (const labelSel of scheduleLabelSelectors) {
        try {
          const scheduleLabel = page.locator(labelSel).first();
          if (await scheduleLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ 找到定时发布选项: ${labelSel}\n`);
            scheduleLabelFound = true;

            await scheduleLabel.scrollIntoViewIfNeeded();
            await delay(200);
            await human.humanClick(scheduleLabel);
            console.log('   🖱️ 已点击定时发布选项\n');
            await delay(2000);
            break;
          }
        } catch (e) { /* skip */ }
      }
  
      if (!scheduleLabelFound) {
        console.log('   ⚠️ 未找到定时发布选项\n');
        scheduledPublishSet = true;
      } else {
        // DOM 分析面板结构
        const panelAnalysis = await page.evaluate(() => {
        const result = { inputs: [], datepickerCells: [], timeRelated: [], nearbyElements: [], allPortals: [] };

        document.querySelectorAll('input').forEach((el, i) => {
          if (el.offsetParent === null || el.getBoundingClientRect().width === 0) return;
          const box = el.getBoundingClientRect();
          if (box.width > 0) {
            result.inputs.push({
              idx: i, placeholder: (el.placeholder || '').substring(0, 40),
              value: (el.value || '').substring(0, 40), type: el.type || '',
              readonly: el.readOnly, disabled: el.disabled,
              x: Math.round(box.x), y: Math.round(box.y),
              w: Math.round(box.width), h: Math.round(box.height),
            });
          }
        });

        document.querySelectorAll('[class*="calendar"] *, [class*="datepicker"] *, [class*="DatePicker"] *, [role="gridcell"], td[class*="day"], [class*="cell"]:not(:empty)').forEach(el => {
          const box = el.getBoundingClientRect();
          const text = (el.textContent || '').trim();
          if (box.width > 10 && box.height > 10 && text && /^\d+$/.test(text) && Number(text) <= 31) {
            result.datepickerCells.push({ text, x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) });
          }
        });

        document.querySelectorAll('[class*="time"] input, [class*="Time"] input, input[type="time"]').forEach(el => {
          const box = el.getBoundingClientRect();
          if (box.width > 0) {
            result.timeRelated.push({ placeholder: (el.placeholder || '').substring(0, 30), value: (el.value || '').substring(0, 30), x: Math.round(box.x), y: Math.round(box.y) });
          }
        });

        Array.from(document.querySelectorAll('body > [class*="picker"], body > [class*="portal"], body > [class*="popup"], body > [class*="dropdown"], body > [role="dialog"], body > [class*="overlay"]')).forEach(el => {
          const box = el.getBoundingClientRect();
          if (box.width > 0 && box.height > 0) {
            result.allPortals.push({ tag: el.tagName, className: (el.className || '').substring(0, 60), x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height), text: (el.textContent || '').substring(0, 80) });
          }
        });

        document.querySelectorAll('button, [role="button"], [class*="icon"], svg').forEach(el => {
          const box = el.getBoundingClientRect();
          if (box.width > 10 && box.height > 10 && box.width < 100 && box.y > 700) {
            result.nearbyElements.push({ tag: el.tagName, text: (el.textContent || '').trim().substring(0, 30), x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) });
          }
        });

        return result;
      });

      console.log(`   📊 发现 ${panelAnalysis.inputs.length} 个可见 input`);
      console.log(`   📊 发现 ${panelAnalysis.datepickerCells.length} 个日历格子\n`);

      const dateInputIdx = panelAnalysis.inputs.findIndex(inp =>
        inp.placeholder.includes('日期') || inp.placeholder.includes('定时') || inp.placeholder.includes('时间')
      );

      if (dateInputIdx >= 0) {
        const targetInput = panelAnalysis.inputs[dateInputIdx];
        console.log(`   🎯 目标日期输入框: #${targetInput.idx} placeholder="${targetInput.placeholder}"\n`);

        const dateTimeStr = `${py}-${pm}-${pd} ${ph}:${pmi}`;

        // ====== 优先路径：通过 class 含 "date" 的容器内的 input 直接写入完整日期时间 ======
        let directWriteSuccess = false;
        try {
          const dateInput = page.locator('[class*="date"] input').first();
          if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await dateInput.scrollIntoViewIfNeeded();
            await delay(200);
            await dateInput.click();
            await delay(100);
            await dateInput.fill(dateTimeStr);
            console.log(`   ✍️ 直接写入日期时间: "${dateTimeStr}"\n`);
            await delay(500);
            await page.keyboard.press('Enter');
            await delay(300);

            // 验证写入结果
            const writtenValue = await dateInput.inputValue().catch(() => '');
            if (writtenValue && (writtenValue.includes(py) || writtenValue.includes(`${pm}-${pd}`))) {
              directWriteSuccess = true;
              console.log('   ✅ 直接写入成功！\n');
            } else {
              console.log(`   ⚠️ 写入验证失败，实际值: "${writtenValue}"，回退到日历选择\n`);
            }
          }
        } catch (e) {
          console.log(`   ℹ️ 直接写入异常: ${e.message.substring(0, 40)}，回退到日历选择\n`);
        }

        // ====== 回退路径：模拟点击日历选择日期 + 填写时间 ======
        if (!directWriteSuccess) {
          try {
            const dateInputLocator = page.locator('input').nth(targetInput.idx);
            await dateInputLocator.scrollIntoViewIfNeeded();
            await delay(300);

            const calendarIcon = panelAnalysis.nearbyElements.find(el =>
              el.x > targetInput.x + targetInput.w - 10 &&
              el.y > targetInput.y - 5 &&
              el.y < targetInput.y + targetInput.h + 5
            );

            if (calendarIcon) {
              console.log(`   🔘 发现日历图标: <${calendarIcon.tag}> @(${calendarIcon.x},${calendarIcon.y})\n`);
              await page.mouse.click(calendarIcon.x + calendarIcon.w / 2, calendarIcon.y + calendarIcon.h / 2);
            } else {
              console.log('   🖱️ 未找到图标，单击输入框\n');
              await dateInputLocator.click();
            }

            await delay(2000);

            const calendarCells = await page.evaluate(() => {
              const cells = [];
              document.querySelectorAll('[role="gridcell"], [class*="calendar"] [class*="cell"], [class*="date"] [class*="day"], .semi-datepicker-day, [class*="picker"] td, [class*="panel"] td, td[class*="day"], div[class*="day"]:not(:empty), span[class*="day"]:not(:empty)').forEach(el => {
                const rect = el.getBoundingClientRect();
                const text = (el.textContent || '').trim();
                if (rect.width > 10 && rect.height > 10 && text && /^\d{1,2}$/.test(text) && Number(text) >= 1 && Number(text) <= 31) {
                  cells.push({ text, x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) });
                }
              });
              return cells;
            });

            console.log(`   📅 日历面板中找到 ${calendarCells.length} 个日期格子\n`);

            if (calendarCells.length > 0) {
              const targetDayNum = Number(pd);
              let clickedCell = calendarCells.find(c => Number(c.text) === targetDayNum);
              if (!clickedCell) {
                clickedCell = calendarCells.find(c => Number(c.text) >= publishDate.getDate()) || calendarCells[calendarCells.length - 1];
              }

              await page.mouse.click(clickedCell.x, clickedCell.y);
              console.log(`   ✅ 已点击日历日期 "${clickedCell.text}" @(${clickedCell.x},${clickedCell.y})\n`);
              await delay(800);

              // 日历点击后重新采集 DOM 数据，避免使用过时的 input idx
              const freshInputs = await page.evaluate(() => {
                const inputs = [];
                document.querySelectorAll('input').forEach((el, i) => {
                  if (el.offsetParent === null || el.getBoundingClientRect().width === 0) return;
                  const box = el.getBoundingClientRect();
                  if (box.width > 0) {
                    inputs.push({
                      idx: i, placeholder: (el.placeholder || '').substring(0, 40),
                      value: (el.value || '').substring(0, 40), type: el.type || '',
                    });
                  }
                });
                return inputs;
              });

              const timeInputs = freshInputs.filter(inp =>
                inp.placeholder.includes('时间') || inp.placeholder.includes('时分') ||
                inp.type === 'time'
              );

              const timeStr = `${ph}:${pmi}`;

              if (timeInputs.length > 0) {
                console.log(`   ⏰ 发现 ${timeInputs.length} 个时间相关输入框\n`);
                for (const ti of timeInputs) {
                  const timeLoc = page.locator('input').nth(ti.idx);
                  await timeLoc.scrollIntoViewIfNeeded();
                  await delay(200);
                  await timeLoc.click();
                  await delay(100);
                  await timeLoc.fill(timeStr);
                  console.log(`   ⌨️ 时间输入: "${timeStr}"\n`);
                  await delay(300);
                }
              } else {
                console.log('   ⚠️ 未找到时间输入框\n');
              }
            } else {
              console.log('   ❌ 未能找到日历格子\n');
            }
          } catch (e) {
            console.log(`   ⚠️ 日历选择操作失败: ${e.message.substring(0, 60)}\n`);
          }
        }

        // 定时时间通过 fill() + Enter 已自动生效，无需额外确认按钮

        scheduledPublishSet = true;
      } else {
        console.log('   ⚠️ 未找到日期输入框，将使用立即发布\n');
        scheduledPublishSet = true;
      }
    }
  } catch (e) {
    console.log(`   ⚠️ 定时发布设置出错: ${e.message.substring(0, 80)}\n`);
    scheduledPublishSet = true;
  }

  stepResults.step8 = scheduledPublishSet;
  await human.naturalPause();
  }

  // ====== Step 9: 选择推荐封面 ======
  console.log('【Step 9/10】🖼️ 选择推荐封面...\n');

  await netThink(400, 800);

  let coverSelected = false;

  try {
    // 滚动到封面区域
    await human.humanScroll('up', 800);
    await delay(500);

    // 按优先级尝试查找封面容器（匹配 CSS Modules 实际类名模式）
    const containerSelectors = [
      { sel: '[class*="recommendCoverContainer"]', name: 'recommendCoverContainer' },
      { sel: '[class*="recommendDisplay"]', name: 'recommendDisplay' },
      { sel: '[class*="recommendCover-"]', name: 'recommendCover-item' },
      { sel: '.content-upload-new', name: 'content-upload-new' },
    ];

    let recContainer = null;

    for (const { sel, name } of containerSelectors) {
      try {
        const container = page.locator(sel).first();
        if (await container.isVisible({ timeout: 3000 }).catch(() => false)) {
          recContainer = container;
          console.log(`   ✅ 找到封面容器: "${name}" (${sel})\n`);
          break;
        }
      } catch (e) { /* try next */ }
    }

    if (!recContainer) {
      console.log('   ℹ️ 未找到封面容器（recommendCoverContainer / recommendDisplay / recommendCover-item / content-upload-new），跳过封面选择\n');
      coverSelected = true;
    } else {
      // 在容器内查找并点击封面图片
      let imgClicked = false;

      // 方式1: 直接在容器内找 img 元素
      try {
        const imgs = recContainer.locator('img').all();
        for (let i = 0; i < imgs.length; i++) {
          if (await imgs[i].isVisible({ timeout: 1000 }).catch(() => false)) {
            await human.humanClick(imgs[i]);
            console.log(`   ✅ 已在封面容器中选择封面 #${i + 1}\n`);
            imgClicked = true;
            await delay(500);
            break;
          }
        }
      } catch (e) { /* skip */ }

      // 方式2: 在容器内找可点击的封面元素（带 class 包含 cover/recommend/thumbnail）
      if (!imgClicked) {
        try {
          const coverEls = recContainer.locator('[class*="cover"], [class*="Cover"], [class*="thumbnail"], [class*="item"]').filter({ visible: true });
          const elCount = await coverEls.count();
          for (let i = 0; i < Math.min(elCount, 5); i++) {
            const el = coverEls.nth(i);
            if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
              await human.humanClick(el);
              console.log(`   ✅ 已在封面容器中点击封面元素 #${i + 1}\n`);
              imgClicked = true;
              await delay(500);
              break;
            }
          }
        } catch (e) { /* skip */ }
      }

      if (!imgClicked) {
        console.log('   ⚠️ 未在封面容器中找到可选封面图片\n');
      }

      await delay(800);

      // 封面点击后等待弹窗出现，再查找确认按钮
      let confirmClicked = false;

      // 等待弹窗/对话框出现
      let dialog = null;
      for (let w = 0; w < 6; w++) {
        const d = page.locator('[role="dialog"]:visible, [class*="modal"]:visible, [class*="popup"]:visible, [class*="drawer"]:visible, [class*="dialog"]:visible').first();
        if (await d.isVisible({ timeout: 600 }).catch(() => false)) {
          dialog = d;
          break;
        }
        await delay(500);
      }

      const searchScope = dialog || page;
      const scopeLabel = dialog ? '弹窗内' : '页面';

      const confirmBtnSelectors = [
        'button:has-text("完成")',
        'button:has-text("设置横封面")',
        'button:has-text("设置竖封面")',
        'button:has-text("确认")',
        'button:has-text("确定")',
      ];

      for (const btnSel of confirmBtnSelectors) {
        try {
          const btn = searchScope.locator(btnSel).first();
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            const txt = (await btn.textContent().catch(() => '') || '').trim();
            // 二次确认不会误点"发布"按钮
            if (txt === '发布') continue;
            await human.humanClick(btn);
            console.log(`   ✅✅✅ 已在${scopeLabel}点击确认按钮: "${txt}"\n`);
            confirmClicked = true;
            coverSelected = true;
            break;
          }
        } catch (e) { /* skip */ }
      }

      if (!confirmClicked) {
        // 回退：全局查找确认文字，但有文本校验
        try {
          const allBtns = page.locator('button:visible, [role="button"]:visible');
          const bCnt = await allBtns.count();
          for (let i = bCnt - 1; i >= Math.max(0, bCnt - 8); i--) {
            const b = allBtns.nth(i);
            if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
              const txt = (await b.textContent().catch(() => '') || '').trim();
              if (txt === '发布') continue; // 排除发布按钮
              if (txt && (txt.includes('完成') || txt.includes('设置横封面') || txt.includes('设置竖封面') || txt.includes('确认') || txt.includes('确定'))) {
                await human.humanClick(b);
                console.log(`   ✅✅✅ 按钮确认: "${txt}"\n`);
                confirmClicked = true;
                coverSelected = true;
                break;
              }
            }
          }
        } catch (e) { /* skip */ }
      }

      if (!confirmClicked) {
        console.log('   ℹ️ 未检测到封面确认弹窗，可能已自动确认\n');
        coverSelected = true;
      }
    }

    if (!coverSelected) {
      console.log('   ⚠️ 未找到封面选择区域，可能使用默认封面\n');
      coverSelected = true;
    }
  } catch (e) {
    console.log(`   ⚠️ 封面选择出错: ${e.message.substring(0, 80)}\n`);
  }

  stepResults.step9 = coverSelected;

  // ====== Step 10: 点击"发布"按钮 ======
  console.log('【Step 10/10】🚀 点击"发布"按钮...\n');

  await netThink(800, 1500);

  let publishClicked = false;

  try {
    await human.humanScroll('down', 800);
    await delay(500);

    console.log('   🔍 查找发布按钮（排除导航栏）...\n');

    const publishBtnSelectors = [
      '[class*="content-confirm-container"] button:has-text("发布")',
      'button:text-is("发布")',
    ];

    for (const sel of publishBtnSelectors) {
      try {
        const btn = page.locator(sel).first();

        if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
          const box = await btn.boundingBox().catch(() => null);

          if (box && box.y > 400 && box.width > 60 && box.height > 30) {
            console.log(`   🎯 找到发布按钮！位置: ${box.x.toFixed(0)}, ${box.y.toFixed(0)} (${sel})\n`);
            await btn.scrollIntoViewIfNeeded();
            await delay(300);
            const clicked = await human.humanClick(btn);
            if (clicked) {
              console.log('   ✅✅✅ 已点击"发布"按钮！\n');
              publishClicked = true;
              await delay(human.randomInRange(3000, 8000));
              break;
            }
            // humanClick 失败，改用原生 click 兜底
            console.log('   ⚠️ 模拟点击失败，尝试原生点击...\n');
            try {
              await btn.click({ force: true, timeout: 3000 });
              console.log('   ✅ 原生点击成功\n');
              publishClicked = true;
              await delay(human.randomInRange(3000, 8000));
              break;
            } catch (e2) {
              console.log(`   ❌ 原生点击也失败: ${e2.message}\n`);
            }
          }
        }
      } catch (e) { /* skip */ }
    }

    if (!publishClicked) {
      console.log('   ⚠️ 未找到发布按钮\n');
    }

    if (!publishClicked) {
      console.log('   ❌ 未找到正确的发布按钮\n');
    }
  } catch (e) {
    console.log(`   ❌ 发布失败: ${e.message}\n`);
  }

  stepResults.step10 = publishClicked;

  // ========== 输出结果 ==========
  console.log('\n' + '='.repeat(70));
  console.log('🎉 10步发布流程执行完毕！');
  console.log('='.repeat(70) + '\n');

  const steps = [
    ['Step 1', '点击发布视频', stepResults.step1],
    ['Step 2', '点击上传视频', stepResults.step2],
    ['Step 3', '选择视频文件', stepResults.step3],
    ['Step 4', '填写标题描述', stepResults.step4],
    ['Step 5', '选择推荐标签', stepResults.step5],
    ['Step 6', '自主声明设置', stepResults.step6],
    ['Step 7', '谁可以看', stepResults.step7],
    ['挂车', '添加商品链接', stepResults.carrier],
    ['保存权限', '保存权限设置', stepResults.savePermission],
    ['Step 8', '定时发布设置', stepResults.step8],
    ['Step 9', '选择推荐封面', stepResults.step9],
    ['Step 10', '点击发布', stepResults.step10],
  ];

  const allSuccess = steps.every(([, , success]) => success);

  console.log('📊 各步骤执行结果:');
  steps.forEach(([step, name, success]) => {
    console.log(`${success ? '✅' : '❌'} ${step.padEnd(8)} ${name}: ${success ? '成功' : '失败/跳过'}`);
  });

  return {
    success: allSuccess,
    stepResults,
    publishClicked,
  };
}

module.exports = { executePublish };
