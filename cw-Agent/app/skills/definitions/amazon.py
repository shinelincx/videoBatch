from app.skills.base import CopySkill, ExecutionStep, QualityStandard


AMAZON_LISTING_SKILL = CopySkill(
    name="Amazon_Listing_Copy",
    platforms=["Amazon"],
    categories=["通用", "General", "Beauty", "Electronics", "Home", "Kitchen"],
    description="Amazon product listing copy with bullet-point style and SEO optimization",
    execution_steps=[
        ExecutionStep(order=1, name="Benefit-Led Title",
                      description="Create a compelling product title with key benefits",
                      action="Include main keyword, top benefit, and USP in the first line"),
        ExecutionStep(order=2, name="Bullet Points",
                      description="List 5 key features as benefit-driven bullet points",
                      action="Each bullet: Feature → Benefit → Why it matters format"),
        ExecutionStep(order=3, name="Product Description",
                      description="Write a persuasive paragraph expanding on the key benefits",
                      action="Problem → Agitation → Solution structure with social proof"),
        ExecutionStep(order=4, name="CTA + Guarantee",
                      description="End with risk-reversal and purchase encouragement",
                      action="Mention satisfaction guarantee, free returns, or limited stock"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="Title must include main benefit and primary keyword",
        cta_presence="End with clear purchase encouragement and risk reversal",
        forbidden_words=["#1", "the best", "guaranteed miracle", "100% effective"],
        max_chars_per_sentence=80,
        tone_keywords=["professional", "benefit-driven", "concise", "trustworthy"],
        additional_rules=[
            "禁止使用缩写词，必须使用完整拼写（如用 'return on investment' 代替 'ROI'、用 'search engine optimization' 代替 'SEO'）",
            "用感叹号和问号增强情感表达",
        ],
    ),
    prompt_template=(
        "You are an Amazon product copywriter specializing in high-converting listings.\n"
        "Follow these steps exactly:\n\n"
        "## Execution Steps\n"
        "{execution_steps}\n\n"
        "## Quality Standards\n"
        "{quality_constraints}\n\n"
        "## CRITICAL: No Abbreviations\n"
        "Spell out ALL abbreviations. Use full words only:\n"
        "- 'return on investment' NOT 'ROI'\n"
        "- 'search engine optimization' NOT 'SEO'\n"
        "- 'call to action' NOT 'CTA'\n"
        "- 'key performance indicator' NOT 'KPI'\n"
        "- 'user generated content' NOT 'UGC'\n\n"
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

AMAZON_SKILLS = [AMAZON_LISTING_SKILL]
