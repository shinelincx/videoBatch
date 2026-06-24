from app.skills.base import CopySkill, ExecutionStep, QualityStandard


TAOBAO_DETAIL_SKILL = CopySkill(
    name="淘宝_详情页_营销",
    platforms=["淘宝", "天猫"],
    categories=["通用", "美妆", "数码", "食品", "服饰", "家居"],
    description="淘宝/天猫详情页产品文案，强调专业、详实、信任感",
    execution_steps=[
        ExecutionStep(order=1, name="痛点引入",
                      description="一句话点出用户的核心需求或痛点",
                      action="用'你是不是也在找...'或'困扰你的XX问题'开头"),
        ExecutionStep(order=2, name="产品核心参数",
                      description="列出产品核心规格和差异化参数",
                      action="精准列出规格参数和产品亮点，用对比强调优势"),
        ExecutionStep(order=3, name="详细功能说明",
                      description="逐一展开产品功能和优势",
                      action="用分点或段落详述每个核心功能如何解决用户问题"),
        ExecutionStep(order=4, name="信任背书+售后",
                      description="建立购买信心，消除后顾之忧",
                      action="突出销量/评价/认证 + 售后政策 + 限时优惠"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须直击用户痛点或核心需求",
        cta_presence="结尾需要明确的购买引导和信任背书",
        forbidden_words=["最好", "第一", "顶级", "绝对"],
        max_chars_per_sentence=50,
        tone_keywords=["专业", "详实", "可信赖", "有温度"],
    ),
    prompt_template=(
        "你是一个淘宝/天猫资深产品文案专家，擅长撰写高转化的详情页文案。\n"
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

TAOBAO_SKILLS = [TAOBAO_DETAIL_SKILL]
