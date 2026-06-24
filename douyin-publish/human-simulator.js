/**
 * 人机行为模拟器 (Human-like Behavior Simulator)
 * 
 * 功能列表:
 * ✅ 真实鼠标移动轨迹 (贝塞尔曲线 + 随机抖动)
 * ✅ 人类化点击 (悬停 → 微调 → 点击)
 * ✅ 复制粘贴输入 (模拟Ctrl+C/V)
 * ✅ 随机打字节奏 (可变速度 + 偶尔停顿)
 * ✅ 自然滚动 (变速滚动 + 震动)
 * ✅ 操作间隔 (基于人类反应时间模型)
 */

class HumanSimulator {
  constructor(page) {
    this.page = page;

    // 内部状态: 跟踪鼠标位置 (替代不存在的 page.mouse.position())
    this._mousePos = { x: 720, y: 450 };  // 默认屏幕中心

    // 人类行为参数配置
    this.config = {
      // 鼠标移动
      mouseSpeed: { min: 200, max: 600 },        // 移动时间范围 (ms)
      mouseJitter: { min: 0, max: 5 },            // 鼠标抖动像素
      mousePathPoints: { min: 10, max: 30 },       // 路径点数量
      
      // 点击行为
      hoverBeforeClick: true,                     // 点击前是否悬停
      hoverDuration: { min: 100, max: 400 },       // 悬停时长 (ms)
      clickDelay: { min: 50, max: 150 },           // 点击后延迟
      
      // 打字行为
      typingSpeed: { min: 40, max: 120 },          // 每字符耗时 (ms)
      typingMistakeRate: 0.02,                     // 打字错误率 (2%)
      typingPauseChance: 0.08,                    // 停顿概率 (8%)
      typingPauseDuration: { min: 200, max: 600 }, // 停顿时长
      
      // 复制粘贴
      useClipboardForLongText: 20,                // 超过此字数使用粘贴
      
      // 操作间隔
      actionInterval: { min: 300, max: 1200 },     // 动作间间隔
      thinkTime: { min: 800, max: 2500 },          // 思考时间 (复杂操作前)
      
      // 滚动行为
      scrollSpeed: { min: 100, max: 300 },         // 滚动速度
      scrollJitter: true,                          // 是否添加微小震动
    };
  }

  /**
   * 生成随机数 (范围内)
   */
  randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生成整数随机数
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成贝塞尔曲线上的点 (用于鼠标移动)
   */
  generateBezierPath(startX, startY, endX, endY, points = 20) {
    const path = [];
    
    // 控制点（添加随机偏移使路径更自然）
    const midX = (startX + endX) / 2 + this.randomInRange(-80, 80);
    const midY = (startY + endY) / 2 + this.randomInRange(-60, 60);
    
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      
      // 二次贝塞尔曲线公式
      const x = (1-t)*(1-t)*startX + 2*(1-t)*t*midX + t*t*endX;
      const y = (1-t)*(1-t)*startY + 2*(1-t)*t*midY + t*t*endY;
      
      // 添加微小随机抖动
      const jitterX = this.randomInRange(
        this.config.mouseJitter.min,
        this.config.mouseJitter.max
      );
      const jitterY = this.randomInRange(
        this.config.mouseJitter.min,
        this.config.mouseJitter.max
      );
      
      path.push({
        x: x + jitterX,
        y: y + jitterY,
        t: t
      });
    }
    
    return path;
  }

  /**
   * 模拟真实鼠标移动到目标位置
   */
  async moveTo(x, y, options = {}) {
    const {
      steps = this.randomInt(
        this.config.mousePathPoints.min,
        this.config.mousePathPoints.max
      ),
      duration = this.randomInRange(
        this.config.mouseSpeed.min,
        this.config.mouseSpeed.max
      )
    } = options;

    // 获取当前鼠标位置
    const currentPos = await this.page.evaluate(() => ({
      x: window.lastMouseX || 0,
      y: window.lastMouseY || 0
    })).catch(() => ({ x: 0, y: 0 }));

    // 如果无法获取当前位置，假设从中心开始
    const startX = currentPos.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 720);
    const startY = currentPos.y || (typeof window !== 'undefined' ? window.innerHeight / 2 : 450);

    // 生成贝塞尔曲线路径
    const path = this.generateBezierPath(startX, startY, x, y, steps);
    
    // 计算每步的时间
    const stepDuration = duration / steps;

    // 逐步移动鼠标
    for (const point of path) {
      await this.page.mouse.move(point.x, point.y);
      
      // 记录最后位置（用于下次移动的起点）
      await this.page.evaluate((px, py) => {
        window.lastMouseX = px;
        window.lastMouseY = py;
      }, point.x, point.y).catch(() => {});
      
      // 随机微小停顿（模拟手部不稳定）
      if (Math.random() < 0.15) {
        await this.page.waitForTimeout(this.randomInRange(5, 25));
      }
      
      await this.page.waitForTimeout(stepDuration);
    }

    // 更新内部鼠标位置状态
    this._mousePos = { x, y };
  }

  /**
   * 模拟人类点击 (包含悬停、微调、点击)
   */
  async humanClick(element, options = {}) {
    const {
      button = 'left',
      clickCount = 1,
      delay = this.randomInRange(this.config.clickDelay.min, this.config.clickDelay.max),
      offset = { x: this.randomInRange(-5, 5), y: this.randomInRange(-5, 5) }
    } = options;

    try {
      // 获取元素边界框
      const box = await element.boundingBox();
      if (!box) throw new Error('元素不可见');
      
      // 计算目标点击位置（元素内随机位置）
      const targetX = box.x + box.width / 2 + offset.x;
      const targetY = box.y + box.height / 2 + offset.y;
      
      // 步骤1: 移动鼠标到元素附近
      await this.moveTo(targetX, targetY);
      
      // 步骤2: 悬停一段时间（人类会先确认目标）
      if (this.config.hoverBeforeClick) {
        const hoverTime = this.randomInRange(
          this.config.hoverDuration.min,
          this.config.hoverDuration.max
        );
        
        // 悬停时可能轻微调整位置（模拟精确瞄准）
        if (Math.random() < 0.6) {
          const adjustX = this.randomInRange(-3, 3);
          const adjustY = this.randomInRange(-3, 3);
          await this.page.mouse.move(targetX + adjustX, targetY + adjustY);
        }
        
        await this.page.waitForTimeout(hoverTime);
      }
      
      // 步骤3: 执行点击
      await this.page.mouse.down({ button, clickCount });
      await this.page.waitForTimeout(this.randomInRange(30, 80));
      await this.page.mouse.up({ button, clickCount });
      
      // 步骤4: 点击后短暂停顿
      await this.page.waitForTimeout(delay);
      
      return true;
      
    } catch (error) {
      console.error(`   ⚠️ humanClick 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 使用复制粘贴方式输入文本 (更真实)
   */
  async pasteText(text, selector) {
    try {
      // 方式1: 通过 Clipboard API (最真实)
      await this.page.evaluate(async (textToPaste) => {
        // 创建临时 textarea
        const textarea = document.createElement('textarea');
        textarea.value = textToPaste;
        document.body.appendChild(textarea);
        
        // 选择并复制
        textarea.select();
        document.execCommand('copy');
        
        // 清理
        document.body.removeChild(textarea);
      }, text);
      
      // 短暂等待（模拟 Ctrl+C 的过程）
      await this.page.waitForTimeout(this.randomInRange(100, 250));
      
      // 点击目标输入框
      const input = this.page.locator(selector).first();
      await this.humanClick(input);
      
      // 执行粘贴 (Ctrl+V)
      await this.page.keyboard.press('Control+v');
      
      // 等待粘贴完成
      await this.page.waitForTimeout(this.randomInRange(100, 300));
      
      return true;
      
    } catch (error) {
      console.error(`   ⚠️ pasteText 失败: ${error.message}，回退到键盘输入`);
      return false;
    }
  }

  /**
   * 模拟人类打字 (带节奏变化和偶尔停顿)
   */
  async humanType(text, options = {}) {
    const {
      usePaste = text.length > this.config.useClipboardForLongText,
      selector = null
    } = options;

    // 长文本优先使用粘贴（更自然）
    if (usePaste && selector) {
      const pasteSuccess = await this.pasteText(text, selector);
      if (pasteSuccess) return true;
    }

    // 否则使用键盘模拟打字
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // 可变的打字速度
      const charDelay = this.randomInRange(
        this.config.typingSpeed.min,
        this.config.typingSpeed.max
      );
      
      // 模拟打字错误 (2%概率)
      if (Math.random() < this.config.typingMistakeRate && i > 0) {
        // 输入一个错误的字符
        const wrongChar = String.fromCharCode(97 + this.randomInt(0, 25)); // a-z
        await this.page.keyboard.type(wrongChar);
        await this.page.waitForTimeout(this.randomInRange(150, 350));
        
        // 删除错误字符 (Backspace)
        await this.page.keyboard.press('Backspace');
        await this.page.waitForTimeout(this.randomInRange(100, 250));
      }
      
      // 正常输入字符
      await this.page.keyboard.type(char);
      
      // 偶尔停顿 (8%概率) - 模拟思考
      if (Math.random() < this.config.typingPauseChance) {
        const pauseTime = this.randomInRange(
          this.config.typingPauseDuration.min,
          this.config.typingPauseDuration.max
        );
        await this.page.waitForTimeout(pauseTime);
      } else {
        // 正常字符间延迟
        await this.page.waitForTimeout(charDelay);
      }
    }
    
    return true;
  }

  /**
   * 智能填充输入框 (自动选择最佳方式)
   */
  async fillInput(selector, value, options = {}) {
    const { 
      clearFirst = true,
      method = 'auto'  // auto | type | paste | fill
    } = options;

    try {
      const element = this.page.locator(selector).first();
      
      // 确保元素可见
      await element.waitFor({ state: 'visible', timeout: 5000 });
      
      // 人类化点击
      await this.humanClick(element);
      
      // 清空现有内容
      if (clearFirst) {
        // 全选 (Ctrl+A)
        await this.page.keyboard.press('Control+a');
        await this.page.waitForTimeout(this.randomInRange(50, 150));
        
        // 删除
        await this.page.keyboard.press('Backspace');
        await this.page.waitForTimeout(this.randomInRange(50, 150));
      }
      
      // 选择输入方法
      if (method === 'auto') {
        // 根据文本长度自动选择
        if (value.length > this.config.useClipboardForLongText) {
          await this.pasteText(value, selector);
        } else {
          await this.humanType(value, { selector });
        }
      } else if (method === 'type') {
        await this.humanType(value, { selector });
      } else if (method === 'paste') {
        await this.pasteText(value, selector);
      } else if (method === 'fill') {
        // Playwright原生fill（最快但不最真实）
        await element.fill(value);
      }
      
      return true;
      
    } catch (error) {
      console.error(`   ⚠️ fillInput 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 模拟人类滚动页面
   */
  async humanScroll(direction = 'down', distance = null, options = {}) {
    const {
      steps = this.randomInt(5, 12),
      duration = this.randomInRange(
        this.config.scrollSpeed.min,
        this.config.scrollSpeed.max
      ),
      withJitter = this.config.scrollJitter
    } = options;

    const scrollDistance = distance || this.randomInt(200, 600);
    const stepDistance = scrollDistance / steps;
    const stepDuration = duration / steps;

    const isDown = direction === 'down' ? 1 : -1;

    for (let i = 0; i < steps; i++) {
      // 主滚动
      await this.page.mouse.wheel(0, stepDistance * isDown);
      
      // 添加微小震动（模拟手部不稳定）
      if (withJitter && Math.random() < 0.3) {
        const jitterX = this.randomInRange(-15, 15);
        const jitterY = this.randomInRange(-8, 8);
        await this.page.mouse.move(
          this._mousePos.x + jitterX,
          this._mousePos.y + jitterY
        );
      }
      
      // 变速滚动（不是匀速）
      const speedVariation = this.randomInRange(0.7, 1.3);
      await this.page.waitForTimeout(stepDuration * speedVariation);
    }
  }

  /**
   * 模拟"思考" (复杂操作前的停顿)
   */
  async think(options = {}) {
    const {
      minTime = this.config.thinkTime.min,
      maxTime = this.config.thinkTime.max,
      moveMouse = true  // 是否在思考时轻微移动鼠标
    } = options;

    const thinkTime = this.randomInRange(minTime, maxTime);
    
    console.log(`   🤔 思考中... (${Math.round(thinkTime)}ms)`);

    if (moveMouse) {
      // 思考时鼠标小幅度移动（模拟犹豫/观察）
      const moveCount = this.randomInt(2, 5);

      for (let i = 0; i < moveCount; i++) {
        const offsetX = this.randomInRange(-30, 30);
        const offsetY = this.randomInRange(-20, 20);

        // 使用内部状态获取当前位置
        const newX = this._mousePos.x + offsetX;
        const newY = this._mousePos.y + offsetY;
        await this.page.mouse.move(newX, newY);

        // 更新位置状态
        this._mousePos = { x: newX, y: newY };

        await this.page.waitForTimeout(thinkTime / moveCount);
      }
    } else {
      await this.page.waitForTimeout(thinkTime);
    }
  }

  /**
   * 操作间的自然停顿
   */
  async naturalPause() {
    const pauseTime = this.randomInRange(
      this.config.actionInterval.min,
      this.config.actionInterval.max
    );
    await this.page.waitForTimeout(pauseTime);
  }

  /**
   * 模拟拖拽操作
   */
  async dragAndDrop(sourceSelector, destSelector, options = {}) {
    const {
      steps = this.randomInt(15, 30),
      duration = this.randomInRange(800, 1800)
    } = options;

    try {
      // 获取源元素位置
      const sourceEl = this.page.locator(sourceSelector).first();
      const sourceBox = await sourceEl.boundingBox();
      if (!sourceBox) throw new Error('源元素不可见');

      const startX = sourceBox.x + sourceBox.width / 2;
      const startY = sourceBox.y + sourceBox.height / 2;

      // 移动到源元素
      await this.moveTo(startX, startY);
      await this.humanClick(sourceEl);
      
      // 获取目标元素位置
      const destEl = this.page.locator(destSelector).first();
      const destBox = await destEl.boundingBox();
      if (!destBox) throw new Error('目标元素不可见');

      const endX = destBox.x + destBox.width / 2;
      const endY = destBox.y + destBox.height / 2;

      // 按下鼠标
      await this.page.mouse.down();

      // 缓慢拖动（贝塞尔曲线）
      const dragPath = this.generateBezierPath(startX, startY, endX, endY, steps);
      const stepDuration = duration / steps;

      for (const point of dragPath) {
        await this.page.mouse.move(point.x, point.y);
        await this.page.waitForTimeout(stepDuration);
      }

      // 释放鼠标
      await this.page.mouse.up();

      // 完成后停顿
      await this.naturalPause();

      return true;

    } catch (error) {
      console.error(`   ⚠️ dragAndDrop 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 模拟选择下拉菜单选项
   */
  async selectDropdown(triggerSelector, optionText, options = {}) {
    try {
      // 1. 点击下拉触发器
      const trigger = this.page.locator(triggerSelector).first();
      await this.humanClick(trigger);
      
      // 等待下拉菜单展开
      await this.page.waitForTimeout(this.randomInRange(300, 700));
      
      // 2. 查找选项（模糊匹配）
      const optionLocator = this.page.getByText(optionText, { exact: false }).first();
      
      // 3. 移动到选项并点击
      const optionBox = await optionLocator.boundingBox();
      if (!optionBox) throw new Error('选项未找到');
      
      await this.moveTo(
        optionBox.x + optionBox.width / 2,
        optionBox.y + optionBox.height / 2
      );
      
      await this.naturalPause(); // 短暂停顿确认选项
      
      await this.humanClick(optionLocator);
      
      return true;
      
    } catch (error) {
      console.error(`   ⚠️ selectDropdown 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 模拟 Tab 键切换焦点 (表单填写常用)
   */
  async pressTab(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(this.randomInRange(100, 280));
    }
  }

  /**
   * 组合操作: 完整的表单填写流程
   */
  async completeForm(fields) {
    /*
      fields 格式:
      [
        { selector: '#title', value: '标题', type: 'input' },
        { selector: '#desc', value: '描述', type: 'textarea' },
        { selector: '.dropdown', value: '公开', type: 'select' },
      ]
    */

    for (const field of fields) {
      // 每个字段前的思考时间
      await this.think({ minTime: 400, maxTime: 900 });
      
      switch (field.type) {
        case 'input':
        case 'textarea':
          await this.fillInput(field.selector, field.value);
          break;
          
        case 'select':
          await this.selectDropdown(field.selector, field.value);
          break;
          
        case 'checkbox':
        case 'radio':
          await this.humanClick(this.page.locator(field.selector).first());
          break;
          
        default:
          await this.fillInput(field.selector, field.value);
      }
      
      // 字段间停顿
      await this.naturalPause();
      
      // 偶尔按Tab切换到下一个字段 (30%概率)
      if (Math.random() < 0.3 && fields.indexOf(field) < fields.length - 1) {
        await this.pressTab();
      }
    }
  }
}

// 导出模块
module.exports = HumanSimulator;
