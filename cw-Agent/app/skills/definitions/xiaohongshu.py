from app.skills.base import CopySkill, ExecutionStep, QualityStandard, ToolSpec


XIAOHONGSHU_BEAUTY_SKILL = CopySkill(
    name="小红书_美妆_种草",
    platforms=["小红书"],
    categories=["美妆", "护肤", "彩妆", "个护"],
    description="小红书美妆种草笔记文案，强调第一人称真实体验和干货分享",
    execution_steps=[
        ExecutionStep(order=1, name="个人体验引入",
                      description="以第一人称真实使用体验开场，建立信任感",
                      action="用'这个我真的用了XX天才来分享'或'后悔没早买系列'开头"),
        ExecutionStep(order=2, name="产品详细测评",
                      description="从质地/效果/成分/性价比多维度分析",
                      action="用⭐评分或对比的方式列出产品亮点，语气真诚"),
        ExecutionStep(order=3, name="使用建议",
                      description="给出使用场景和搭配建议",
                      action="分享'我的使用方法是...'或'适合XX肤质/场景'"),
        ExecutionStep(order=4, name="总结推荐",
                      description="给出明确的推荐理由和购买建议",
                      action="'总结一下' + 核心推荐理由 + 适买人群"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用第一人称真实体验引入，避免广告感过强",
        cta_presence="结尾可含引导但不强制，强调'理性种草'调性",
        forbidden_words=["最好", "第一", "绝对有效", "100%", "永不"],
        max_chars_per_sentence=40,
        tone_keywords=["真诚分享", "干货", "理性", "第一人称"],
    ),
    prompt_template=(
        "你是一个小红书美妆博主，擅长写真诚的种草笔记。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
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
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

XIAOHONGSHU_FASHION_SKILL = CopySkill(
    name="小红书_穿搭_种草",
    platforms=["小红书"],
    categories=["服饰", "穿搭", "服装", "鞋帽", "配饰"],
    description="小红书穿搭分享文案，强调搭配灵感和氛围感",
    execution_steps=[
        ExecutionStep(order=1, name="氛围引入",
                      description="用场景/心情/风格关键词营造氛围",
                      action="以'终于找到了我的梦中情X'或'OOTD'风格开场"),
        ExecutionStep(order=2, name="单品解析",
                      description="逐件介绍搭配单品，突出面料和设计亮点",
                      action="'这件最戳我的是...'逐件解析亮点"),
        ExecutionStep(order=3, name="搭配灵感",
                      description="给出多种搭配方案，激发购买欲",
                      action="'这件可以搭...也可以搭...'提供搭配思路"),
        ExecutionStep(order=4, name="购买信息",
                      description="温柔地给出购买渠道或品牌信息",
                      action="'是在XX入的/🔗在...'自然融入购买引导"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须有氛围描述或风格关键词，避免生硬推销",
        cta_presence="可含购买渠道，但需自然融入不突兀",
        forbidden_words=["最好看", "绝对显瘦"],
        max_chars_per_sentence=45,
        tone_keywords=["氛围感", "日常穿搭", "品味", "温柔"],
    ),
    prompt_template=(
        "你是一个小红书穿搭博主，擅长分享高审美的穿搭笔记。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
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
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

XIAOHONGSHU_GENERIC_SKILL = CopySkill(
    name="小红书_通用_种草",
    platforms=["小红书"],
    categories=["通用"],
    description="小红书通用种草文案，适合无明显品类匹配时使用",
    execution_steps=[
        ExecutionStep(order=1, name="个人体验开场",
                      description="第一人称真实体验引入",
                      action="用'姐妹们这个东西我替你们试过了'或'终于被我找到了'开头"),
        ExecutionStep(order=2, name="产品详评",
                      description="多维度评价产品的优劣",
                      action="从使用感受/效果/性价比等方面展开"),
        ExecutionStep(order=3, name="总结建议",
                      description="给出推荐或不推荐的理由",
                      action="总结适合谁、不适合谁、怎么用最好"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="必须用第一人称体验开头，有真实感",
        cta_presence="可有可无，以真诚分享为优先",
        forbidden_words=["最好", "第一", "绝对"],
        max_chars_per_sentence=40,
        tone_keywords=["真实", "真诚", "干货", "避雷"],
    ),
    prompt_template=(
        "你是一个小红书博主，擅长写真实的种草/测评笔记。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
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
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

XIAOHONGSHU_SKILLS = [XIAOHONGSHU_BEAUTY_SKILL, XIAOHONGSHU_FASHION_SKILL, XIAOHONGSHU_GENERIC_SKILL]
