# 计划：输出参数增加标题

## 目标
将产品标题(title)融入 `analyze_emotion` 情感分析逻辑，让标题的情感信息也能影响最终的 rate/pitch 输出参数。

## 影响范围

| 文件 | 变更内容 |
|------|----------|
| `app/emotion.py` | `analyze_emotion` 新增 `title` 参数，标题情感计入 rate/pitch 计算 |
| `app/tts.py` | `text_to_speech` 和 `text_to_speech_sync` 新增 `title` 参数并传递 |
| `app/routes.py` | 调用 `text_to_speech` 时传入 `product_input.title` |
| `cli.py` | 调用 `text_to_speech_sync` 时传入 `args.title` |

## 实现步骤

### 步骤 1：修改 `app/emotion.py`

- `analyze_emotion(text, language)` → `analyze_emotion(text, language, title="")`
- 新增标题情感分析逻辑：
  - 统计标题中的感叹号数量，密度高则加分
  - 检查标题是否包含激动型开头词，是则加分
  - 检查标题是否包含 CTA 关键词，是则加分
- 标题加分幅度设置较小（标题情感影响应弱于正文）
  - 感叹号：每个 +2 rate, +2 pitch（上限 +4/+4）
  - 激动开头：+3 rate, +3 pitch
  - CTA 关键词：+3 rate, +2 pitch

### 步骤 2：修改 `app/tts.py`

- `text_to_speech(text, output_path, language, voice="")` → `text_to_speech(text, output_path, language, voice="", title="")`
- 调用 `analyze_emotion(text, language, title=title)`
- `text_to_speech_sync` 同步新增 `title` 参数

### 步骤 3：修改 `app/routes.py`

- `text_to_speech(copy.text, audio_path, product_input.language, product_input.voice)` → 增加 `title=product_input.title`

### 步骤 4：修改 `cli.py`

- `text_to_speech_sync(copy.text, audio_path, product_input.language)` → 增加 `title=product_input.title`

## 验证方式

1. 分别运行 CLI 和 API 模式，观察 rate/pitch 输出是否因标题而变化
2. 用有强烈的标题（如"限时秒杀！手慢无！"）和无情感的标题分别测试，对比 rate/pitch 差异
