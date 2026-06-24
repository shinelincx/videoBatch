# Checklist

## 基础设施
- [x] `.env.example` 包含 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL / TTS_PROVIDER / DEFAULT_LANGUAGE
- [x] `app/config.py` 正确加载 dotenv 并提供默认值
- [x] `LANGUAGE_VOICE_MAP` 包含 zh/en/ja/ko 四个映射项
- [x] `LANGUAGE_SPEED_MAP` 包含 zh/en/ja/ko 四个语速项

## 数据模型
- [x] `ProductInput` 含 language 字段且默认值为 `zh`
- [x] `ProductInput` category 和 title 非空校验生效
- [x] `AgentResponse` 包含 input / marketing_copy / audio / subtitle 四个字段
- [x] `SubtitleEntry` start_time / end_time 格式为 `HH:MM:SS,mmm`

## 文案生成
- [x] `app/prompts.py` 的 `estimate_word_count(30, "zh")` 返回 120
- [x] `app/prompts.py` 的 `estimate_word_count(30, "en")` 返回 90
- [x] Prompt 模板中 language 字段正确注入语言约束
- [x] `app/agent.py` 链构建：prompt | llm | StrOutputParser
- [x] `generate_copy()` 失败时重试 2 次

## TTS 与字幕
- [x] `app/tts.py` 使用 edge_tts.Communicate.stream() 进行语音合成
- [x] TTS 合成后返回 WordBoundary 列表（非空）
- [x] 语言 `ja` 时使用发音人 `ja-JP-NanamiNeural`
- [x] `app/subtitle.py` 输出文件符合 SRT 格式规范
- [x] SRT 字幕条目的 start_time < end_time
- [x] 相邻较短词组合并为 ≤20 字 / ≤5 秒的字幕条目

## API 接口
- [x] `POST /api/generate` 接受合法 ProductInput 返回 200 + AgentResponse
- [x] `POST /api/generate` 对非法输入返回 422
- [x] `GET /api/audio/{filename}` 返回 .mp3 文件，Content-Type 为 audio/mpeg
- [x] `GET /api/subtitle/{filename}` 返回 .srt 文件

## CLI
- [x] `python cli.py -c 美妆 -t "面霜" -s "补水,抗皱"` 正常运行并输出结果
- [x] `python cli.py -h` 显示完整帮助信息
- [x] 必填参数缺失时 argparse 报错并显示用法

## Web UI
- [x] 访问 `http://localhost:8000/` 展示 Web UI 页面
- [x] 表单提交后显示 loading 动画
- [x] 生成完成后显示文案文本和音频播放器
- [x] 音频播放时字幕实时同步高亮
- [x] API 错误时显示 toast 提示

## 多语言
- [x] language=zh 生成中文文案 + 中文发音人
- [x] language=en 生成英文文案 + 英文发音人
- [x] language=ja 生成日文文案 + 日文发音人
- [x] language=ko 生成韩文文案 + 韩文发音人

## 服务入口
- [x] `python main.py` 启动服务无报错
- [x] FastAPI 自动文档 `http://localhost:8000/docs` 可访问
- [x] CORS 配置允许跨域请求
