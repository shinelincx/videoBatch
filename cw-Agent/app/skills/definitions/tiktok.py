from app.skills.base import CopySkill, ExecutionStep, QualityStandard


TIKTOK_BEAUTY_SKILL = CopySkill(
    name="TikTok_Beauty_Selling",
    platforms=["TikTok"],
    categories=["Beauty", "Skincare", "Makeup", "Cosmetics"],
    description="TikTok beauty product selling copy, emphasizing viral hooks and trends",
    execution_steps=[
        ExecutionStep(order=1, name="Viral Hook",
                      description="Grab attention in the first 1-2 seconds with a bold claim or question",
                      action="Start with 'I can't believe...' or 'If you're struggling with...' or a bold result claim"),
        ExecutionStep(order=2, name="Problem/Solution",
                      description="Name the problem, introduce the product as the solution",
                      action="'I used to deal with... until I found this' structure"),
        ExecutionStep(order=3, name="Key Benefits",
                      description="Showcase 2-3 key benefits with specific results",
                      action="Use numbers and timeframes: 'In just 7 days...' or '3x more...'"),
        ExecutionStep(order=4, name="Social Proof + CTA",
                      description="Build trust with reviews or stats, then drive action",
                      action="Mention 'over 10k sold' or 'rated 4.9 stars' then 'grab it at the link'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="Hook must be in first 1-2 seconds with bold claim, question, or shocking result",
        cta_presence="End with a clear CTA like 'link in bio' or 'grab yours now'",
        forbidden_words=["#1", "the best", "guaranteed 100%", "miracle cure"],
        max_chars_per_sentence=60,
        tone_keywords=["trendy", "casual", "energetic", "authentic"],
        additional_rules=[
            "禁止使用缩写词，必须使用完整拼写（如用 'return on investment' 代替 'ROI'、'user generated content' 代替 'UGC'）",
            "用感叹号和问号增强情感表达，配合语音合成的情感变化",
            "保持口语化节奏感，避免过于书面化的长句",
        ],
    ),
    prompt_template=(
        "You are a TikTok creator who makes viral product review videos.\n"
        "Follow these steps exactly to write the copy:\n\n"
        "## Execution Steps\n"
        "{execution_steps}\n\n"
        "## Quality Standards\n"
        "{quality_constraints}\n\n"
        "## CRITICAL: No Abbreviations\n"
        "Spell out ALL abbreviations. Use full words only:\n"
        "- 'return on investment' NOT 'ROI'\n"
        "- 'key opinion leader' NOT 'KOL'\n"
        "- 'user generated content' NOT 'UGC'\n"
        "- 'call to action' NOT 'CTA'\n"
        "- 'behind the scenes' NOT 'BTS'\n"
        "- 'point of view' NOT 'POV'\n"
        "- 'as soon as possible' NOT 'ASAP'\n"
        "- 'do it yourself' NOT 'DIY'\n\n"
        "## Reference Examples\n"
        "{reference_examples}\n\n"
        "## Product Info\n"
        "- Category: {category}\n"
        "- Title: {title}\n"
        "- Selling Points: {selling_points}\n"
        "- Language: {language}\n"
        "- Target words: strictly {target_word_range}\n\n"
        "{price_constraint}\n\n"
        "Output only the copy, no explanations."
    ),
)

TIKTOK_GENERIC_SKILL = CopySkill(
    name="TikTok_Generic_Selling",
    platforms=["TikTok"],
    categories=["通用", "General"],
    description="TikTok generic product selling copy",
    execution_steps=[
        ExecutionStep(order=1, name="Hook",
                      description="Start with a bold claim, question, or surprising fact",
                      action="Grab attention in first 2 seconds"),
        ExecutionStep(order=2, name="Value Prop",
                      description="Explain what makes this product worth buying",
                      action="1-2 key unique selling points"),
        ExecutionStep(order=3, name="Social Proof",
                      description="Add credibility with stats or reviews",
                      action="Mention ratings, sales numbers, or user testimonials"),
        ExecutionStep(order=4, name="CTA",
                      description="Clear call to action",
                      action="'Link in bio' or 'Get yours now'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="Must hook within 2 seconds",
        cta_presence="Must end with a clear CTA",
        forbidden_words=["#1", "the best", "guaranteed"],
        max_chars_per_sentence=60,
        tone_keywords=["trendy", "casual", "authentic"],
        additional_rules=[
            "禁止使用缩写词，必须使用完整拼写（如用 'return on investment' 代替 'ROI'）",
            "用感叹号和问号增强情感表达",
            "保持口语化节奏感",
        ],
    ),
    prompt_template=(
        "You are a TikTok creator.\n"
        "Follow these steps exactly to write the copy:\n\n"
        "## Execution Steps\n"
        "{execution_steps}\n\n"
        "## Quality Standards\n"
        "{quality_constraints}\n\n"
        "## CRITICAL: No Abbreviations\n"
        "Spell out ALL abbreviations. Use full words only (e.g., 'return on investment' NOT 'ROI', 'as soon as possible' NOT 'ASAP').\n\n"
        "## Reference Examples\n"
        "{reference_examples}\n\n"
        "## Product Info\n"
        "- Category: {category}\n"
        "- Title: {title}\n"
        "- Selling Points: {selling_points}\n"
        "- Language: {language}\n"
        "- Target words: strictly {target_word_range}\n\n"
        "{price_constraint}\n\n"
        "Output only the copy."
    ),
)

TIKTOK_SKILLS = [TIKTOK_BEAUTY_SKILL, TIKTOK_GENERIC_SKILL]
