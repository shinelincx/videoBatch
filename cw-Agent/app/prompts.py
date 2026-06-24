from app.config import LANGUAGE_SPEED_MAP, LANGUAGE_LABELS
from app.models import ProductInput
from app.skills.manager import SkillManager
from app.skills.base import CopySkill
from app.knowledge.retriever import KnowledgeRetriever
from app.knowledge.store import KnowledgeStore
from app.trends import TrendRetriever
from app.config import (
    KNOWLEDGE_DIR,
    ENABLE_KNOWLEDGE,
    MAX_KNOWLEDGE_REFS,
    ENABLE_TREND_KNOWLEDGE,
    TREND_DB_PATH,
    MAX_TREND_REFS,
)
from typing import List, Optional
import re


ENHANCED_SYSTEM_PROMPT = (
    "You are a task execution engine for e-commerce copywriting. "
    "You MUST follow the execution steps and quality standards provided below EXACTLY. "
    "Treat each step as a mandatory instruction. "
    "Study the reference examples carefully and match their style, tone, and structure. "
    "When writing in any language, AVOID abbreviations — always spell out words in full "
    "(e.g., use 'return on investment' instead of 'ROI', 'as soon as possible' instead of 'ASAP', "
    "'behind the scenes' instead of 'BTS'). "
    "Use exclamation marks and question marks naturally to add emotional variety for voiceover. "
    "Output your response STRICTLY in the following format without any other text:\n"
    "【标题】<a catchy, click-worthy title for this copy>\n"
    "【标签】<3-5 comma-separated tags describing the copy style, tone, and content>\n"
    "【正文】\n"
    "<the complete marketing copy text>"
)

# 价格检测：货币符号、货币单位、价格关键词
_PRICE_PATTERNS = [
    re.compile(r"[$￥¥€£₩円元]"),           # 货币符号
    re.compile(r"\d+\s*(元|块|美元|美金|日元|韩元|泰铢|欧元|英镑|卢比|比索|盾|铢|基普|披索|卢布|港币|澳元|加元|新币)"),
    re.compile(r"(dollar|cent|euro|pound|yen|won|baht|dong|rupee|peso|ruble)s?", re.IGNORECASE),
    re.compile(r"(价格|售价|原价|现价|定价|单价|金额|费用|多少钱|优惠价|活动价|限时价|折扣价|券后价|到手价)"),
    re.compile(r"(price|cost|fee|retail|wholesale|discount|save\s+\d+|only\s+\d+\s*(dollar|cent)?)", re.IGNORECASE),
    re.compile(r"(¥|￥)\s*\d+"),             # 人民币+数字
    re.compile(r"\$\s*\d+"),                  # 美元+数字
    re.compile(r"€\s*\d+"),                   # 欧元+数字
    re.compile(r"£\s*\d+"),                   # 英镑+数字
]


def _detect_price(product_input: ProductInput) -> bool:
    """检测输入中是否包含价格/金额信息"""
    search_text = f"{product_input.title} {' '.join(product_input.selling_points)}"
    for pattern in _PRICE_PATTERNS:
        if pattern.search(search_text):
            return True
    return False


def _build_price_constraint(has_price: bool) -> str:
    """根据是否包含价格信息生成约束文本"""
    if has_price:
        return (
            "## 价格信息\n"
            "输入中包含价格/金额信息，请在文案中自然地融入价格、优惠或折扣信息，"
            "以增强购买说服力。不要遗漏输入中已给出的价格。"
        )
    else:
        return (
            "## 价格约束\n"
            "输入未提及任何价格、金额、折扣信息。"
            "严格禁止在文案中编造或虚构任何具体价格数字、金额、折扣力度（如'只要99'、'打5折'、'省了100块'、'只要几百块'等）。"
            "不要出现任何价格。"
        )


def estimate_word_count(duration: int, language: str, rate_adjust: float = 0.0) -> int:
    """
    根据语种语速 + 情感语速修正，估算目标字数。

    rate_adjust: 预期情感 rate 偏移百分比，如 7 表示 +7% 语速，
                 则目标字数需乘以 1.07 以抵消加速，保持最终朗读时长不变。
    """
    speed = LANGUAGE_SPEED_MAP.get(language, 4)
    adjusted_speed = speed * (1.0 + rate_adjust / 100.0)
    return round(duration * adjusted_speed)


def _format_knowledge_refs(refs) -> str:
    """格式化知识库检索结果"""
    if not refs:
        return "暂无参考文案"
    lines = []
    for i, ref in enumerate(refs, 1):
        likes = ref.metrics.get("likes", 0)
        likes_str = f"{likes / 10000:.1f}万" if likes >= 10000 else str(likes)
        lines.append(f"示例{i}（{ref.type}，{likes_str}赞，平台：{ref.platform}）：")
        lines.append(f'"{ref.content}"')
        lines.append("")
    return "\n".join(lines)


def _make_retriever() -> Optional[KnowledgeRetriever]:
    """创建知识库检索器（可降级）"""
    if not ENABLE_KNOWLEDGE:
        return None
    try:
        store = KnowledgeStore(knowledge_dir=KNOWLEDGE_DIR, autoload=True)
        return KnowledgeRetriever(store=store, knowledge_dir=KNOWLEDGE_DIR)
    except Exception:
        return None


def _make_trend_retriever() -> Optional[TrendRetriever]:
    """创建实时热门视频检索器（可降级）"""
    if not ENABLE_TREND_KNOWLEDGE:
        return None
    try:
        return TrendRetriever(db_path=TREND_DB_PATH, top_k=MAX_TREND_REFS)
    except Exception:
        return None


def build_enhanced_prompt_params(product_input: ProductInput) -> dict:
    """
    构建增强 Prompt 参数：
      1. Skill 路由匹配
      2. 知识库检索
      3. 组装完整参数
    """
    target_word_count = estimate_word_count(product_input.duration, product_input.language)
    selling_points = ", ".join(product_input.selling_points)
    language_label = LANGUAGE_LABELS.get(product_input.language, product_input.language)

    # Skill 路由
    manager = SkillManager.get_instance()
    match_result = manager.match_skill(product_input.platform, product_input.category)
    skill = match_result.skill

    # 知识库检索
    knowledge_refs = []
    retriever = _make_retriever()
    if retriever:
        keywords = [product_input.category, product_input.title] + product_input.selling_points
        knowledge_refs = retriever.retrieve(
            platform=product_input.platform,
            category=product_input.category,
            keywords=keywords,
            top_k=MAX_KNOWLEDGE_REFS,
        )

    trend_insights = "暂无实时热门视频洞察"
    trend_retriever = _make_trend_retriever()
    if trend_retriever:
        try:
            trend_matches = trend_retriever.retrieve(product_input)
            trend_insights = trend_retriever.format_insights(trend_matches)
        except Exception:
            trend_insights = "暂无实时热门视频洞察"

    params = {
        "category": product_input.category,
        "title": product_input.title,
        "selling_points": selling_points,
        "duration": product_input.duration,
        "platform": product_input.platform,
        "tone": product_input.tone,
        "language": language_label,
        "target_word_count": target_word_count,
        "target_word_range": f"{max(1, int(target_word_count * 0.9))}-{int(target_word_count * 1.1)}",
        "price_constraint": _build_price_constraint(_detect_price(product_input)),
        "execution_steps": skill.format_steps(),
        "quality_constraints": skill.format_quality(),
        "reference_examples": _format_knowledge_refs(knowledge_refs),
        "trend_insights": trend_insights,
    }

    return params


def _format_skill_info(match_result) -> dict:
    """格式化 Skill 匹配信息"""
    return {
        "skill_name": match_result.skill.name,
        "match_type": match_result.match_type.value,
        "matched_by": match_result.matched_by,
        "skill_description": match_result.skill.description,
    }
