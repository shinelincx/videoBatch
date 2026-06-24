# 接口输出增加文案标题和标签字段

## 需求
在 API 接口 `/api/generate` 的返回结构中增加 2 个字段：
- **文案标题** (`title`)：由 LLM 生成的营销文案标题
- **标签** (`tags`)：由 LLM 生成的文案特征标签列表

**关键约束**：这 2 个字段不加入音频和字幕文件（即 TTS 合成的文本和 SRT 字幕中不应包含标题和标签内容）。

---

## 数据流分析（现状）

```
用户输入 → LLM生成文案(text) → 缩写展开 → 情感分析 → TTS合成(音频) → SRT生成(字幕)
                                   ↓
                            copy.text 一路传递
```

- `routes.py` 中：`copy.text` → `text_to_speech()` → 音频 + word_boundaries → `generate_srt()` → 字幕
- `cli.py` 中：同样 `copy.text` → TTS → 字幕

## 实现方案

采用**结构化 LLM 输出**方案：让 LLM 在一次调用中同时输出标题、标签和正文，然后解析分离。

### LLM 输出格式
```
【标题】<文案标题>
【标签】<标签1>, <标签2>, <标签3>
【正文】
<完整营销文案>
```

---

## 修改清单

### 1. `app/models.py` — MarketingCopy 模型增加字段
- 增加 `title: str = Field(default="", description="文案标题")`  
- 增加 `tags: List[str] = Field(default_factory=list, description="文案标签")`

### 2. `app/prompts.py` — 更新系统 Prompt
- 修改 `ENHANCED_SYSTEM_PROMPT`，在末尾增加严格的输出格式要求：
  ```
  【标题】<标题>
  【标签】<标签>
  【正文】
  <文案正文>
  ```

### 3. `app/agent.py` — 解析 LLM 输出
- 新增 `_parse_copy_output()` 函数，从 LLM 原始输出中提取标题、标签和正文
- 修改 `_build_marketing_copy()` 函数签名，接收 `title` 和 `tags` 参数
- 在 `generate_copy()` 和 `generate_copy_sync()` 中调用解析函数
- 解析失败时兜底：标题为空字符串，标签为空列表，全文作为正文

### 4. `cli.py` — CLI 输出展示
- 在打印文案之前，先打印标题和标签信息

### 5. `static/app.js` — 前端展示
- 在结果区域增加标题和标签的展示元素
- 从 `data.marketing_copy.title` 和 `data.marketing_copy.tags` 读取数据

### ❌ 无需修改的文件（已验证不会将标题/标签混入音频/字幕）
- `app/tts.py` — 接收的 `text` 参数已是纯净正文（`copy.text`）
- `app/subtitle.py` — 基于 TTS 返回的 word_boundaries 生成，天然不含标题/标签
- `app/routes.py` — 已正确传递 `copy.text` 给 TTS

---

## 实施步骤

1. **修改 `models.py`**：`MarketingCopy` 增加 `title`、`tags` 字段
2. **修改 `prompts.py`**：更新 `ENHANCED_SYSTEM_PROMPT` 输出格式指令
3. **修改 `agent.py`**：增加解析函数，在生成链路中分离标题/标签/正文
4. **修改 `cli.py`**：展示标题和标签
5. **修改 `static/app.js`**：前端展示标题和标签
6. **验证**：确认 API 返回结构正确，音频/字幕不含标题/标签
