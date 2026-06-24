# output 目录自动清理计划

## 目标
在 `output/` 目录中增加自动清理逻辑，仅保留最近 1 天的文件，防止输出文件无限累积。

## 现状分析

- **输出目录**: `output/`（项目根目录）
- **文件命名模式**:
  - API生成: `{YYYYMMDD_HHMMSS}_audio.mp3`, `{YYYYMMDD_HHMMSS}_subtitle.srt`
  - CLI生成: `audio_{YYYYMMDD_HHMMSS}.mp3`, `subtitle_{YYYYMMDD_HHMMSS}.srt`
- **当前状态**: 无任何文件清理逻辑，文件会无限累积

## 实施步骤

### 步骤 1: 创建 `app/cleanup.py` 清理模块
- 新建文件 `d:\project\test-Agent\app\cleanup.py`
- 实现函数 `clean_old_outputs(output_dir, max_age_seconds=86400)`:
  1. 遍历 `output_dir` 目录下所有文件
  2. 使用正则从文件名中提取 `YYYYMMDD_HHMMSS` 时间戳
  3. 将时间戳解析为 `datetime` 对象，与当前时间比较
  4. 删除超过 `max_age_seconds`（默认 86400 秒 = 1 天）的文件
  5. 对于无法解析时间戳的旧格式文件，也一并清理（保守起见可添加 `max_age_seconds` 判断基于文件修改时间）
- 使用日志记录清理的文件数量

### 步骤 2: 在 API 路由中集成清理
- 修改 `d:\project\test-Agent\app\routes.py`
- 在 `api_generate` 函数开头（生成新文件之前）调用 `clean_old_outputs("output")`
- 添加 import: `from app.cleanup import clean_old_outputs`

### 步骤 3: 在 CLI 中集成清理
- 修改 `d:\project\test-Agent\cli.py`
- 在 `main()` 中 `os.makedirs(output_dir, exist_ok=True)` 之后调用 `clean_old_outputs(output_dir)`
- 添加 import: `from app.cleanup import clean_old_outputs`

### 步骤 4: 在服务启动时集成清理
- 修改 `d:\project\test-Agent\main.py`
- 在 `os.makedirs("output", exist_ok=True)` 之后调用 `clean_old_outputs("output")`
- 添加 import: `from app.cleanup import clean_old_outputs`

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `app/cleanup.py` | **新建** | 核心清理逻辑 |
| `app/routes.py` | 修改 | API 调用时触发清理 |
| `cli.py` | 修改 | CLI 调用时触发清理 |
| `main.py` | 修改 | 服务启动时触发清理 |

## 技术要点
- 文件名时间戳正则: `(\d{8}_\d{6})` 匹配 `YYYYMMDD_HHMMSS`
- 时间差计算使用 `datetime` 模块
- 保守策略：仅清理匹配时间戳格式且超时的文件，不误删其他文件
