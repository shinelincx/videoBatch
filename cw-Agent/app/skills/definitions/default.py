from app.skills.base import CopySkill, ExecutionStep, QualityStandard


DEFAULT_SKILL = CopySkill(
    name="通用_通用_基础",
    platforms=["通用"],
    categories=["通用"],
    description="兜底通用文案 Skill，当无精确平台×品类匹配时使用",
    execution_steps=[
        ExecutionStep(order=1, name="吸引注意",
                      description="用一个有力的开头抓住读者注意力",
                      action="用问句、数字或痛点描述开头"),
        ExecutionStep(order=2, name="介绍产品",
                      description="简明介绍产品及其核心价值",
                      action="用2-3句话说明产品是什么、解决什么问题"),
        ExecutionStep(order=3, name="卖点展开",
                      description="逐一展开核心卖点",
                      action="用列举或递进的方式展开每个卖点"),
        ExecutionStep(order=4, name="促进行动",
                      description="用行动号召收尾",
                      action="给出明确的下一步行动建议"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须有力地抓住注意力",
        cta_presence="结尾需要明确的行动号召",
        forbidden_words=["最好", "第一", "绝对"],
        max_chars_per_sentence=40,
        tone_keywords=["简洁", "清晰", "有说服力"],
    ),
    prompt_template=(
        "你是一个专业的电商文案撰写专家。请按照以下步骤撰写营销文案：\n\n"
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
        "请直接输出文案，不要包含解释说明。"
    ),
)

DEFAULT_SKILLS = [DEFAULT_SKILL]
