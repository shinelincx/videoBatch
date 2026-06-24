# 文案 Skills 管理 + 知识库引入 — 实施计划

## 一、目标概述

当前 `prompts.py` 使用单一模板 + `PLATFORM_TONES` 字典生成所有文案，存在以下问题：

* 提示词与业务逻辑耦合，难以按平台/品类差异化优化

* 缺乏任务拆解（执行步骤）和质量标准，LLM 输出质量不稳定

* 无热门文案参考，生成内容缺乏数据支撑

本次改造目标：

1. **Skill 管理**：将提示词按平台×品类拆分为独立 Skill，每个 Skill 定义执行步骤、工具调用、质量标准
2. **知识库引入**：建立热门文案知识库，文案生成时检索相关参考，提升输出质量

***

## 二、核心概念设计

### 2.1 Skill 定义结构

```python
@dataclass
class CopySkill:
    name: str                          # 技能名称："抖音_美妆_带货"
    platforms: List[str]               # 适用平台：["抖音"]
    categories: List[str]              # 适用品类：["美妆", "护肤"]
    description: str                   # 技能描述
    execution_steps: List[Step]        # 执行步骤（任务拆解）
    quality_standards: QualityStandard # 质量标准
    prompt_template: str               # 该技能的专用提示词模板
```

每个 Skill 包含：

| 维度        | 内容              | 示例                                                         |
| --------- | --------------- | ---------------------------------------------------------- |
| **执行步骤**  | 1\~4 步行为指令      | Step 1: 抓注意力 → Step 2: 展示痛点 → Step 3: 介绍产品 → Step 4: 促单CTA |
| **质量标准**  | 可验证的硬性指标        | 开头3秒必含数字/疑问句；CTA含"点击下方链接"；无违禁词                             |
| **工具调用**  | 可用工具列表          | 违禁词检测、字数校验、参考文案检索                                          |
| **提示词模板** | 经平台优化的专用 prompt | 不同平台有不同口吻和格式要求                                             |

### 2.2 知识库结构

```
knowledge/
├── index.json                    # 知识库索引（元数据）
├── douyin/                       # 按平台组织
│   ├── 美妆.json
│   ├── 数码.json
│   ├── 食品.json
│   └── ...
├── xiaohongshu/
│   ├── 美妆.json
│   └── ...
└── templates/                    # 通用模板/句式库
    ├── hooks.json                # 开头钩子句式
    ├── cta.json                  # 行动号召句式
    └── transitions.json          # 过渡句式
```

每条知识条目结构：

```json
{
  "id": "dy_mz_001",
  "platform": "抖音",
  "category": "美妆",
  "type": "热门文案",
  "content": "姐妹们！这个面霜我真的会回购到停产...",
  "metrics": { "likes": 120000, "shares": 35000 },
  "tags": ["补水", "面霜", "敏感肌"],
  "source": "top_creators",
  "updated": "2025-06-01"
}
```

### 2.3 检索与注入流程

```
用户输入 ProductInput
    │
    ├── 1. Skill 路由：platform × category → 匹配最佳 Skill
    │       ├── 精确匹配：抖音 + 美妆 → 抖音_美妆 Skill
    │       └── 降级匹配：小红书 + 无人机 → 通用 Skill
    │
    ├── 2. 知识库检索：根据 category + tags → 检索 Top-K 参考文案
    │       └── 关键词匹配 + 语义相似度排序
    │
    ├── 3. 组装增强 Prompt：
    │       ├── Skill 执行步骤（任务拆解）
    │       ├── Skill 质量标准（约束输出）
    │       ├── 知识库参考（注入 few-shot examples）
    │       └── 用户输入参数
    │
    └── 4. LLM 生成 → 后处理校验
```

***

## 三、文件变更清单

### 新增文件

| 文件                                      | 职责                                       |
| --------------------------------------- | ---------------------------------------- |
| `app/skills/__init__.py`                | Skill 模块入口                               |
| `app/skills/manager.py`                 | SkillManager：Skill 注册、路由、加载              |
| `app/skills/base.py`                    | Skill 基类 + 数据结构定义（Step, QualityStandard） |
| `app/skills/definitions/`               | 各平台×品类 Skill 定义文件                        |
| `app/skills/definitions/douyin.py`      | 抖音 Skill 集合（美妆/数码/食品/服饰/家居...）           |
| `app/skills/definitions/xiaohongshu.py` | 小红书 Skill 集合                             |
| `app/skills/definitions/taobao.py`      | 淘宝 Skill 集合                              |
| `app/skills/definitions/tiktok.py`      | TikTok Skill 集合                          |
| `app/skills/definitions/amazon.py`      | Amazon Skill 集合                          |
| `app/skills/definitions/default.py`     | 通用/兜底 Skill（当无精确匹配时使用）                   |
| `app/knowledge/__init__.py`             | 知识库模块入口                                  |
| `app/knowledge/retriever.py`            | KnowledgeRetriever：索引加载、关键词检索、语义排序       |
| `app/knowledge/store.py`                | KnowledgeStore：知识条目 CRUD、JSON 持久化        |
| `knowledge/index.json`                  | 知识库索引文件                                  |
| `knowledge/templates/hooks.json`        | 钩子句式库                                    |
| `knowledge/templates/cta.json`          | CTA 句式库                                  |
| `knowledge/templates/transitions.json`  | 过渡句式库                                    |

### 修改文件

| 文件               | 变更内容                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `app/prompts.py` | 重构：移除 PLATFORM\_TONES、build\_prompt\_params 旧逻辑；新增 build\_enhanced\_prompt\_params()，集成 Skill + 知识库 |
| `app/agent.py`   | 重构：generate\_copy 改为使用 SkillManager 路由 + KnowledgeRetriever 检索；新增后处理校验步骤（质量标准检查）                    |
| `app/models.py`  | 新增 SkillMatch、KnowledgeRef 等模型（可选）；ProductInput 可扩展 tags 字段                                         |
| `app/config.py`  | 新增 KNOWLEDGE\_DIR、DEFAULT\_SKILL 等配置项                                                               |

***

## 四、详细实施步骤

### Step 1：定义 Skill 数据结构 (`app/skills/base.py`)

* 定义 `ExecutionStep`：单个执行步骤（step\_name, description, action\_instruction）

* 定义 `QualityStandard`：质量标准（opening\_rule, cta\_rule, forbidden\_words, max\_chars\_per\_sentence 等）

* 定义 `ToolSpec`：可用工具说明（tool\_name, description, usage）

* 定义 `CopySkill`：聚合 Skill（name, platforms, categories, description, steps, quality, tools, prompt\_template）

* 定义 `SkillRegistry`：Skill 注册表（register / match / list\_all）

### Step 2：实现 Skill 路由管理 (`app/skills/manager.py`)

* 实现 `SkillManager`：

  * `load_all_skills()`：扫描 `app/skills/definitions/` 注册所有 Skill

  * `match_skill(platform, category) -> CopySkill`：

    * 精确匹配 platform + category

    * 降级：匹配 platform + 任意 category → 通用 platform skill

    * 兜底：返回 DefaultSkill

  * `export_skill_prompt(skill, params) -> str`：根据 Skill 模板 + 参数组装提示词

### Step 3：编写各平台 Skill 定义文件

按平台×品类编写专用 Skill，每个 Skill 包含：

#### 3.1 抖音 Skill (`app/skills/definitions/douyin.py`)

* 美妆 Skill：4 步执行（吸睛开头→痛点共鸣→产品卖点→限时促单），质量标准（前3秒含数字/疑问、CTA含"下方链接"、禁用极限词）

* 数码 Skill：4 步执行（情景引入→参数对比→功能演示→下单理由）

* 食品 Skill、服饰 Skill、家居 Skill、通用 Skill

#### 3.2 小红书 Skill (`app/skills/definitions/xiaohongshu.py`)

* 美妆种草、穿搭分享、家居好物...

#### 3.3 淘宝 Skill (`app/skills/definitions/taobao.py`)

* 详情页文案、主图视频文案...

#### 3.4 TikTok Skill、Amazon Skill 同理

#### 3.5 兜底 Skill (`app/skills/definitions/default.py`)

* 适用于无精确匹配的平台/品类组合

### Step 4：构建知识库系统

#### 4.1 知识库存储层 (`app/knowledge/store.py`)

* `KnowledgeEntry` dataclass：id, platform, category, type, content, metrics, tags, source, updated

* `KnowledgeStore` 类：

  * `load(platform, category = None) -> List[KnowledgeEntry]`：加载指定平台的条目

  * `add(entry)` / `remove(id)` / `update(id, entry)`

  * `export(mode="production"|"dev")`：导出当前内存数据到 JSON

#### 4.2 知识库检索层 (`app/knowledge/retriever.py`)

* `KnowledgeRetriever` 类：

  * `retrieve(platform, category, keywords, top_k=3) -> List[KnowledgeEntry]`：

    1. 过滤 platform + category
    2. 关键词匹配 tags + content（Jaccard 相似度 / TF-IDF）
    3. 按匹配度 + metrics 热度加权排序
    4. 返回 Top-K

  * `format_for_prompt(entries) -> str`：将检索结果格式化为 few-shot example 文本

#### 4.3 知识库索引 (`knowledge/index.json`)

```json
{
  "version": "1.0",
  "updated": "2025-06-02",
  "entries": {
    "douyin": { "美妆": 15, "数码": 10, "食品": 8 },
    "xiaohongshu": { "美妆": 12, "穿搭": 8 },
    "templates": { "hooks": 20, "cta": 15, "transitions": 10 }
  }
}
```

#### 4.4 预置种子知识库

* 为每个主要平台×品类预置 3\~5 条高质量参考文案（脱敏后）

* 预置 hooks/cta/transitions 句式模板库

### Step 5：重构 Prompt 层 (`app/prompts.py`)

* 移除旧的 `COPYWRITER_HUMAN_TEMPLATE` + `PLATFORM_TONES` + `build_prompt_params`

* 新增 `build_enhanced_prompt(product_input, skill, knowledge_refs) -> dict`：

  ```python
  prompt_params = {
      # 用户输入
      "category": ..., "title": ..., "selling_points": ...,
      # Skill 拆解的任务步骤
      "execution_steps": skill.format_steps(),
      # Skill 质量标准
      "quality_constraints": skill.format_quality(),
      # 知识库参考
      "reference_examples": format_knowledge_refs(knowledge_refs),
      # 语言与时控
      "language": ..., "target_word_count": ..., "duration": ...,
  }
  ```

* 优化 `COPYWRITER_SYSTEM_PROMPT`：引入 "你是一个任务执行引擎，必须严格按执行步骤和标准操作" 的角色设定

### Step 6：重构 Agent 链 (`app/agent.py`)

* `generate_copy()` 新流程：

  ```
  1. skill = SkillManager.match_skill(platform, category)
  2. knowledge_refs = KnowledgeRetriever.retrieve(platform, category, keywords, top_k=3)
  3. params = build_enhanced_prompt(product_input, skill, knowledge_refs)
  4. result = chain.invoke(params)                        # LLM 生成
  5. result = _post_process(result, skill)                 # 质量标准校验
  6. return MarketingCopy
  ```

* 新增 `_post_process(text, skill)` 方法：

  * 违禁词检测（调用 Skill 的 quality.forbidden\_words）

  * CTA 存在性验证

  * 字数偏差校验（±15% 内）

  * 不合格时自动截断/补全或标记警告

### Step 7：扩展配置 (`app/config.py`)

```python
KNOWLEDGE_DIR = os.environ.get("KNOWLEDGE_DIR", "knowledge")
DEFAULT_SKILL = os.environ.get("DEFAULT_SKILL", "default_generic")
ENABLE_KNOWLEDGE = os.environ.get("ENABLE_KNOWLEDGE", "true").lower() == "true"
MAX_KNOWLEDGE_REFS = int(os.environ.get("MAX_KNOWLEDGE_REFS", "3"))
```

### Step 8：模型扩展（可选）(`app/models.py`)

若需要更丰富的 Skill 匹配和知识库引用信息返回给前端：

```python
class SkillInfo(BaseModel):
    skill_name: str
    matched_by: str           # "exact" | "platform_fallback" | "default"

class KnowledgeRef(BaseModel):
    id: str
    snippet: str              # 引用摘要（脱敏后）
    relevance: float          # 匹配度 0~1

class AgentResponse:          # 扩展已有模型
    ...
    skill_info: Optional[SkillInfo] = None
    knowledge_refs: Optional[List[KnowledgeRef]] = []
```

### Step 9：后端路由适配 (`app/routes.py`)

* `POST /api/generate` 响应中可选返回 `skill_info` + `knowledge_refs`，供前端展示"参考了哪些热门文案"

***

## 五、Skill 模板示例（抖音×美妆）

```python
# app/skills/definitions/douyin.py

DOUYIN_BEAUTY_SKILL = CopySkill(
    name="抖音_美妆_带货",
    platforms=["抖音"],
    categories=["美妆", "护肤", "彩妆", "个护"],
    description="抖音美妆带货口播文案，强调快节奏、口语化、强转化",
    execution_steps=[
        ExecutionStep(
            order=1,
            name="吸睛开头",
            description="前3秒用惊叹/疑问/数字抓住注意力，直接点出用户痛点或效果对比",
            action="以'姐妹们'或'天呐'开头，给出一个让人震惊的效果描述或问句"
        ),
        ExecutionStep(
            order=2,
            name="痛点共鸣",
            description="描述用户常见困扰，建立情感连接",
            action="用'你是不是也...'句式引发共鸣"
        ),
        ExecutionStep(
            order=3,
            name="产品展示",
            description="逐一介绍核心卖点，强调差异化优势",
            action="列出 {selling_points}，用'它含有...'、'而且...'串联"
        ),
        ExecutionStep(
            order=4,
            name="促单CTA",
            description="制造紧迫感，引导下单",
            action="限时优惠/限量话术 + '点击下方链接/左下角'引导"
        ),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头3秒内必须包含数字、问句或感叹句",
        cta_presence="结尾必须包含明确CTA（'点击下方链接'/'左下角下单'/'赶紧冲'）",
        forbidden_words=["最好", "第一", "绝对", "100%有效", "永不"],
        max_chars_per_sentence=30,
        tone_keywords=["口语化", "快节奏", "有感染力"],
    ),
    prompt_template=(
        "# 任务：抖音美妆带货文案\n\n"
        "你是一个抖音带货主播的文案撰写助手。请严格按照以下步骤执行：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 语言：{language}\n"
        "- 字数：约 {target_word_count} 字\n\n"
        "请直接输出文案，不要输出任何解释。"
    ),
)
```

***

## 六、知识库预置清单

### 6.1 种子数据覆盖范围（按优先级）

| 优先级 | 平台     | 品类     | 条目数 | 说明           |
| --- | ------ | ------ | --- | ------------ |
| P0  | 抖音     | 美妆     | 5   | 热门护肤品/彩妆带货文案 |
| P0  | 抖音     | 数码     | 5   | 手机/配件/数码产品文案 |
| P0  | 抖音     | 食品     | 3   | 零食/饮品带货文案    |
| P1  | 小红书    | 美妆     | 5   | 种草笔记风格文案     |
| P1  | 淘宝     | 美妆     | 3   | 详情页主图文案      |
| P2  | TikTok | Beauty | 3   | 英文带货文案       |
| P2  | 通用     | 钩子句式   | 20  | 所有品类共用的开头句式  |
| P2  | 通用     | CTA句式  | 15  | 所有平台共用的促单句式  |

### 6.2 知识条目格式示例

```json
{
  "id": "dy_mz_001",
  "platform": "抖音",
  "category": "美妆",
  "type": "爆款文案",
  "content": "姐妹们！你敢信吗这个面霜才几十块但是用完皮肤就像剥了壳的鸡蛋！它是那种冰淇淋质地一抹就化水完全不粘腻，我用了七天额头上的闭口全消了！现在活动买二送一姐妹们赶紧冲左下角！",
  "metrics": { "likes": 120000, "shares": 35000, "comments": 8000 },
  "tags": ["面霜", "补水", "平价", "好物推荐"],
  "source": "top_creators",
  "updated": "2025-05-15"
}
```

***

## 七、目录结构（改造后）

```
app/
├── __init__.py
├── config.py                    # 新增 KNOWLEDGE_DIR 等配置
├── models.py                    # 可选扩展 SkillInfo / KnowledgeRef
├── prompts.py                   # 重构：移除旧模板，新增 enhanced prompt 构建
├── agent.py                     # 重构：集成 SkillManager + KnowledgeRetriever
├── tts.py                       # 不变
├── subtitle.py                  # 不变
├── routes.py                    # 微调：响应可选返回 skill_info
│
├── skills/                      # 新增模块
│   ├── __init__.py
│   ├── base.py                  # Skill / Step / QualityStandard 数据结构
│   ├── manager.py               # SkillManager 路由与匹配
│   └── definitions/
│       ├── __init__.py
│       ├── douyin.py            # 抖音 Skills
│       ├── xiaohongshu.py       # 小红书 Skills
│       ├── taobao.py            # 淘宝 Skills
│       ├── tiktok.py            # TikTok Skills
│       ├── amazon.py            # Amazon Skills
│       └── default.py           # 通用兜底 Skill
│
└── knowledge/                   # 新增模块
    ├── __init__.py
    ├── store.py                 # 知识条目存储与 CRUD
    └── retriever.py             # 检索与排序

knowledge/                       # 新增知识库数据目录
├── index.json
├── templates/
│   ├── hooks.json
│   ├── cta.json
│   └── transitions.json
└── (各平台目录，按需创建)
```

***

## 八、实施顺序

| 序号 | 步骤                                                | 依赖           | 产出                                                |
| -- | ------------------------------------------------- | ------------ | ------------------------------------------------- |
| 1  | `app/skills/base.py` — Skill 数据结构                 | 无            | Step/QualityStandard/CopySkill/ToolSpec dataclass |
| 2  | `app/skills/manager.py` — SkillManager            | Step 1       | Skill 注册/路由/匹配/导出                                 |
| 3  | `app/skills/definitions/` — 各平台 Skill 定义          | Step 1       | 抖音/小红书/淘宝/TikTok/Amazon/default Skill             |
| 4  | `app/knowledge/store.py` — KnowledgeStore         | 无            | 知识条目 CRUD + JSON 持久化                              |
| 5  | `app/knowledge/retriever.py` — KnowledgeRetriever | Step 4       | 关键词检索 + 排序 + 格式化为 prompt                          |
| 6  | `knowledge/` — 预置种子数据                             | Step 4       | index.json + 各品类参考文案 JSON                         |
| 7  | `app/prompts.py` — 重构 Prompt 层                    | Step 2, 5    | build\_enhanced\_prompt() 集成 Skill + 知识库          |
| 8  | `app/config.py` — 扩展配置                            | Step 4       | KNOWLEDGE\_DIR / ENABLE\_KNOWLEDGE 等              |
| 9  | `app/agent.py` — 重构 Agent 链                       | Step 2, 5, 7 | 新 generate\_copy 流程 + 后处理校验                       |
| 10 | `app/routes.py` — API 响应适配                        | Step 9       | 可选返回 skill\_info + knowledge\_refs                |
| 11 | 集成测试 — 端到端验证                                      | 全部           | 各平台×品类文案质量对比测试                                    |

***

## 九、检验标准

* [ ] **Skill 路由正确性**：输入 抖音+美妆 → 匹配 DOUYIN\_BEAUTY\_SKILL；输入 未知平台 → 匹配 DefaultSkill

* [ ] **知识库检索**：输入 美妆+补水 → 检索到含"面霜""补水"标签的参考文案 Top-3

* [ ] **增强 Prompt 组装**：生成的 prompt 包含执行步骤、质量标准、参考示例

* [ ] **文案质量提升**：对比改造前后，同品类文案在开头吸引力、CTA 规范性、平台调性一致性的评分提升

* [ ] **后处理校验**：违禁词出现时自动拦截或标记；CTA 缺失时发出警告

* [ ] **降级兜底**：知识库不可用时不影响核心生成流程（ENABLE\_KNOWLEDGE=false 可降级）

* [ ] **性能**：Skill 匹配 + 知识检索总耗时 < 500ms，不影响用户体验

* [ ] **多语言兼容**：所有 Skill 和知识库均支持多语言扩展（中英日韩）

