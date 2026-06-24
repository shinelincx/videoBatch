# 声音/语音选择参数 + 东南亚语种扩充计划

## 目标
1. **扩充语种**：在现有 zh/en/ja/ko 基础上，新增 8 种东南亚语种（th/vi/id/ms/fil/my/km/lo）
2. **声音选择**：每个语种提供多个 TTS 音色供用户选择，系统根据选择输出对应声音的音频

---

## 一、全部语种清单（12 种）

| 代码 | 显示名 | 语系 |
|------|--------|------|
| `zh` | 简体中文 | CJK |
| `en` | English | 拉丁 |
| `ja` | 日本語 | CJK |
| `ko` | 한국어 | CJK |
| `th` | ไทย | 泰文 |
| `vi` | Tiếng Việt | 拉丁 |
| `id` | Bahasa Indonesia | 拉丁 |
| `ms` | Bahasa Melayu | 拉丁 |
| `fil` | Filipino | 拉丁 |
| `my` | မြန်မာဘာသာ | 缅甸文 |
| `km` | ភាសាខ្មែរ | 高棉文 |
| `lo` | ລາວ | 老挝文 |

---

## 二、config.py 改动

### 2.1 语种标签
```python
LANGUAGE_LABELS = {
    "zh": "简体中文", "en": "English", "ja": "日本語", "ko": "한국어",
    "th": "ไทย", "vi": "Tiếng Việt", "id": "Bahasa Indonesia",
    "ms": "Bahasa Melayu", "fil": "Filipino",
    "my": "မြန်မာဘာသာ", "km": "ភាសាខ្មែរ", "lo": "ລາວ",
}
```

### 2.2 语速（字/秒，基于平均朗读速度估算）
```python
LANGUAGE_SPEED_MAP = {
    "zh": 4, "en": 3, "ja": 5, "ko": 4,
    "th": 4, "vi": 3, "id": 3, "ms": 3,
    "fil": 3, "my": 4, "km": 4, "lo": 4,
}
```

### 2.3 默认音色
```python
LANGUAGE_VOICE_MAP = {
    "zh": "zh-CN-XiaoxiaoNeural", "en": "en-US-JennyNeural",
    "ja": "ja-JP-NanamiNeural", "ko": "ko-KR-SunHiNeural",
    "th": "th-TH-AcharaNeural", "vi": "vi-VN-HoaiMyNeural",
    "id": "id-ID-GadisNeural", "ms": "ms-MY-YasminNeural",
    "fil": "fil-PH-BlessicaNeural", "my": "my-MM-NilarNeural",
    "km": "km-KH-SreymomNeural", "lo": "lo-LA-KeomanyNeural",
}
```

### 2.4 音色选项（每语种 2~3 个可选音色）
```python
LANGUAGE_VOICE_OPTIONS = {
    "zh": [
        {"value": "zh-CN-XiaoxiaoNeural", "label": "晓晓（女）"},
        {"value": "zh-CN-YunxiNeural",  "label": "云希（男）"},
        {"value": "zh-CN-YunjianNeural","label": "云健（男）"},
        {"value": "zh-CN-XiaoyiNeural", "label": "晓伊（女）"},
    ],
    "en": [
        {"value": "en-US-JennyNeural",  "label": "Jenny（女）"},
        {"value": "en-US-AriaNeural",   "label": "Aria（女）"},
        {"value": "en-US-GuyNeural",    "label": "Guy（男）"},
        {"value": "en-US-SteffanNeural","label": "Steffan（男）"},
    ],
    "ja": [
        {"value": "ja-JP-NanamiNeural", "label": "奈々み（女）"},
        {"value": "ja-JP-KeitaNeural",  "label": "慶太（男）"},
    ],
    "ko": [
        {"value": "ko-KR-SunHiNeural",  "label": "선희（女）"},
        {"value": "ko-KR-InJoonNeural", "label": "인준（男）"},
    ],
    "th": [
        {"value": "th-TH-AcharaNeural",    "label": "Achara（女）"},
        {"value": "th-TH-NiwatNeural",     "label": "Niwat（男）"},
        {"value": "th-TH-PremwadeaNeural", "label": "Premwadea（女）"},
    ],
    "vi": [
        {"value": "vi-VN-HoaiMyNeural",  "label": "HoaiMy（女）"},
        {"value": "vi-VN-NamMinhNeural", "label": "NamMinh（男）"},
    ],
    "id": [
        {"value": "id-ID-GadisNeural", "label": "Gadis（女）"},
        {"value": "id-ID-ArdiNeural",  "label": "Ardi（男）"},
    ],
    "ms": [
        {"value": "ms-MY-YasminNeural", "label": "Yasmin（女）"},
        {"value": "ms-MY-OsmanNeural",  "label": "Osman（男）"},
    ],
    "fil": [
        {"value": "fil-PH-BlessicaNeural", "label": "Blessica（女）"},
        {"value": "fil-PH-AngeloNeural",   "label": "Angelo（男）"},
    ],
    "my": [
        {"value": "my-MM-NilarNeural", "label": "Nilar（女）"},
        {"value": "my-MM-ThihaNeural", "label": "Thiha（男）"},
    ],
    "km": [
        {"value": "km-KH-SreymomNeural", "label": "Sreymom（女）"},
        {"value": "km-KH-PisethNeural",  "label": "Piseth（男）"},
    ],
    "lo": [
        {"value": "lo-LA-KeomanyNeural",     "label": "Keomany（女）"},
        {"value": "lo-LA-ChanthavongNeural", "label": "Chanthavong（男）"},
    ],
}
```

### 2.5 新增工具函数
```python
def get_voice_options(language: str) -> list:
    return LANGUAGE_VOICE_OPTIONS.get(language, LANGUAGE_VOICE_OPTIONS["zh"])

def get_default_voice(language: str) -> str:
    return get_tts_voice(language)
```

---

## 三、subtitle.py 改动 —— 断句标点配置

新增 8 种东南亚语种的断句规则：

```python
_SENTENCE_BREAKS = {
    "zh": "。！？\n",  "en": ".!?\n",  "ja": "。！？\n",  "ko": ".!?\n",
    "th": " \n",         # 泰文：空格=句子边界
    "vi": ".!?\n",       # 越南文：拉丁标点
    "id": ".!?\n",       # 印尼文：拉丁标点
    "ms": ".!?\n",       # 马来文：拉丁标点
    "fil": ".!?\n",      # 菲律宾文：拉丁标点
    "my": "။\n",          # 缅甸文：U+104B 句子结束符
    "km": "។៕\n",        # 高棉文：U+17D4 句号、U+17D5 段落结束
    "lo": " \n",         # 老挝文：空格=句子边界
}

_CLAUSE_BREAKS = {
    "zh": "；：", "en": ";:", "ja": "；：", "ko": ";:",
    "th": "", "vi": ";:", "id": ";:", "ms": ";:",
    "fil": ";:", "my": "၊",   # 缅甸文：U+104A 逗号
    "km": " ",              # 高棉文：空格分隔子句
    "lo": "",
}

_PHRASE_BREAKS = {
    "zh": "，、…", "en": ",…", "ja": "、，…", "ko": ",…",
    "th": "", "vi": ",…", "id": ",…", "ms": ",…",
    "fil": ",…", "my": "", "km": "", "lo": "",
}

_MAX_CHARS = {
    "zh": 22, "en": 80, "ja": 22, "ko": 25,
    "th": 40, "vi": 80, "id": 80, "ms": 80,
    "fil": 80, "my": 30, "km": 30, "lo": 40,
}
```

---

## 四、tts.py 与 subtitle.py 共用改动 —— Unicode 白名单

在 `_SPEECH_SAFE_PATTERN` 中追加 4 个 Unicode 区块：

| 区块 | 范围 | 语种 |
|------|------|------|
| 泰文 | `\u0E00-\u0E7F` | th |
| 缅甸文 | `\u1000-\u109F` | my |
| 高棉文 | `\u1780-\u17FF` | km |
| 老挝文 | `\u0E80-\u0EFF` | lo |

越南文、印尼文、马来文、菲律宾文使用拉丁字母，已有 `\u0020-\u007E` + `\u00A0-\u00FF` 覆盖，无需额外添加。

需在 **tts.py 和 subtitle.py 两处**同步新增。

---

## 五、tts.py 改动 —— voice 参数

修改 `text_to_speech` 函数签名：

```python
async def text_to_speech(text: str, output_path: str, language: str, voice: str = "") -> tuple:
    if not voice:
        voice = get_tts_voice(language)
    ...
```

同步修改 `text_to_speech_sync`。

---

## 六、models.py 改动

`ProductInput` 新增 `voice` 字段：

```python
voice: str = Field(default="", description="TTS 音色 ShortName，为空则使用语种默认音色")
```

---

## 七、routes.py 改动

### 7.1 修改 `/api/generate`
```python
audio_output, word_boundaries = await text_to_speech(
    copy.text, audio_path, product_input.language, product_input.voice
)
```

### 7.2 新增 `/api/voices/{language}`
```python
@router.get("/api/voices/{language}")
async def api_get_voices(language: str):
    options = get_voice_options(language)
    return {"voices": options, "default": get_default_voice(language)}
```

---

## 八、前端改动

### 8.1 index.html —— 语种下拉框扩充 + 新增声音下拉框

语种下拉框新增 8 项：
```html
<option value="th">ไทย (th)</option>
<option value="vi">Tiếng Việt (vi)</option>
<option value="id">Bahasa Indonesia (id)</option>
<option value="ms">Bahasa Melayu (ms)</option>
<option value="fil">Filipino (fil)</option>
<option value="my">မြန်မာဘာသာ (my)</option>
<option value="km">ភាសាខ្មែរ (km)</option>
<option value="lo">ລາວ (lo)</option>
```

语种后新增声音下拉框：
```html
<div class="form-group">
  <label for="voice">声音</label>
  <select id="voice"></select>
</div>
```

### 8.2 app.js

- 页面加载时，调用 `/api/voices/zh` 填充默认声音列表
- 监听 `language` 的 `change` 事件，调用 `/api/voices/{lang}` 动态更新声音列表
- 提交 payload 增加 `voice` 字段：`voice: document.getElementById("voice").value`

---

## 九、实施步骤

| 步骤 | 文件 | 操作 |
|------|------|------|
| 1 | `app/config.py` | 扩充 `LANGUAGE_LABELS`、`LANGUAGE_SPEED_MAP`、`LANGUAGE_VOICE_MAP`；新增 `LANGUAGE_VOICE_OPTIONS`、`get_voice_options`、`get_default_voice` |
| 2 | `app/subtitle.py` | 扩充 `_SENTENCE_BREAKS`、`_CLAUSE_BREAKS`、`_PHRASE_BREAKS`、`_MAX_CHARS`；追加 Unicode 区块到 `_SPEECH_SAFE_PATTERN` |
| 3 | `app/tts.py` | 追加 Unicode 区块到 `_SPEECH_SAFE_PATTERN`；`text_to_speech` 增加 `voice` 参数 |
| 4 | `app/models.py` | `ProductInput` 新增 `voice: str` 字段 |
| 5 | `app/routes.py` | `/api/generate` 传递 `voice`；新增 `/api/voices/{language}` |
| 6 | `static/index.html` | 扩充语种下拉框；新增声音下拉框 |
| 7 | `static/app.js` | 动态加载声音列表；提交携带 `voice` 字段 |
