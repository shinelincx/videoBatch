"""
语音情感分析模块：基于文案内容自动推导语速(rate)和音调(pitch)参数。

不使用 SSML（edge_tts 不支持），而是返回可直接传给 edge_tts.Communicate() 的
rate 和 pitch 参数值。
"""

import re

# 语种 → edge_tts xml:lang 映射（供参考）
_LANG_XML_MAP = {
    "zh": "zh-CN", "en": "en-US", "ja": "ja-JP", "ko": "ko-KR",
    "th": "th-TH", "vi": "vi-VN", "id": "id-ID", "ms": "ms-MY",
    "fil": "fil-PH", "my": "my-MM", "km": "km-KH", "lo": "lo-LA",
}

# 语种断句正则
_SENTENCE_SPLIT_PATTERNS = {
    "zh": re.compile(r"(?<=[。！？\n])\s*"),
    "ja": re.compile(r"(?<=[。！？\n])\s*"),
    "ko": re.compile(r"(?<=[.!?\n])\s*"),
    "default": re.compile(r"(?<=[.!?\n])\s*"),
}

# 快语速语种（如日语），情感变化幅度需收窄
_HIGH_SPEED_LANGS = {"ja", "th", "my", "km", "lo"}

# CTA 关键词（促单/催促类）
_CTA_KEYWORDS = {
    "en": {"buy", "grab", "get", "click", "link", "shop", "order",
           "subscribe", "follow", "now", "hurry", "limited", "sale",
           "discount", "today", "don't miss", "act fast", "save",
           "try", "claim", "offer", "deal", "free"},
    "zh": {"买", "冲", "下单", "抢", "点击", "链接", "赶紧", "别犹豫",
           "手慢无", "限时", "优惠", "福利", "赠品", "秒杀", "拼手速",
           "快", "现在", "马上", "立刻", "错过"},
}

# 感叹/惊讶类句子开头模式
_EXCITED_OPENERS = {
    "en": {"wow", "omg", "can't believe", "cannot believe", "i can't",
           "shocking", "unbelievable", "insane", "crazy", "this is it",
           "finally", "guess what", "you won't believe"},
    "zh": {"天呐", "天哪", "哇", "太", "居然", "竟然", "不敢相信",
           "震惊", "绝了", "疯了", "姐妹们", "你敢信"},
}


def _split_sentences(text: str, language: str) -> list[str]:
    """按语种断句标点拆分文本"""
    pattern = _SENTENCE_SPLIT_PATTERNS.get(language, _SENTENCE_SPLIT_PATTERNS["default"])
    parts = pattern.split(text)
    return [p.strip() for p in parts if p.strip()]


def _count_exclamations(text: str) -> int:
    """统计感叹号数量"""
    return text.count("!") + text.count("！")


def _count_questions(text: str) -> int:
    """统计问号数量"""
    return text.count("?") + text.count("？")


def _has_cta_keywords(sentence: str, language: str) -> bool:
    """判断句子是否包含 CTA 关键词"""
    keywords = _CTA_KEYWORDS.get(language, _CTA_KEYWORDS["en"])
    lower = sentence.lower()
    return any(kw in lower for kw in keywords)


def _has_excited_opener(sentence: str, language: str) -> bool:
    """判断句首是否包含惊讶/激动型开头"""
    openers = _EXCITED_OPENERS.get(language, _EXCITED_OPENERS["en"])
    lower = sentence.lower()
    for opener in openers:
        if lower.startswith(opener):
            return True
    return False


def analyze_emotion(text: str, language: str = "en") -> tuple[str, str]:
    """
    分析文案情感基调，返回 (rate, pitch) 参数。

    rate 格式: "+10%", "-5%", "+0%" 等
    pitch 格式: "+5Hz", "-3Hz", "+0Hz" 等

    分析策略：
      1. 统计全文感叹号/问号密度
      2. 检查首句是否为激动型开头
      3. 检查末句是否含 CTA 关键词
      4. 综合计算 rate 和 pitch 偏移
    """
    if not text or not text.strip():
        return "+0%", "+0Hz"

    sentences = _split_sentences(text, language)
    if not sentences:
        return "+0%", "+0Hz"

    exclam_count = _count_exclamations(text)
    question_count = _count_questions(text)
    total_sentences = len(sentences)

    # 基础分数
    rate_delta = 0
    pitch_delta = 0

    # 感叹句密度加分（每句平均 0.5 个以上感叹号视为高情感）
    exc_density = exclam_count / max(total_sentences, 1)
    if exc_density >= 1.0:
        rate_delta += 10
        pitch_delta += 8
    elif exc_density >= 0.5:
        rate_delta += 7
        pitch_delta += 5
    elif exc_density >= 0.25:
        rate_delta += 4
        pitch_delta += 3

    # 问句密度加分
    q_density = question_count / max(total_sentences, 1)
    if q_density >= 0.5:
        pitch_delta += 3

    # 首句分析
    first_sentence = sentences[0] if sentences else ""
    if first_sentence.endswith("!") or first_sentence.endswith("！"):
        rate_delta += 5
        pitch_delta += 5
    elif first_sentence.endswith("?") or first_sentence.endswith("？"):
        rate_delta += 3
        pitch_delta += 3
    if _has_excited_opener(first_sentence, language):
        rate_delta += 5
        pitch_delta += 5

    # 末句 CTA 分析
    last_sentence = sentences[-1] if sentences else ""
    if _has_cta_keywords(last_sentence, language):
        rate_delta += 5
        pitch_delta += 3

    # 快语速语种降低变化幅度
    if language in _HIGH_SPEED_LANGS:
        rate_delta = max(rate_delta - 3, 0)
        pitch_delta = max(pitch_delta - 2, 0)

    # 限制范围
    rate_delta = min(rate_delta, 15)
    pitch_delta = min(pitch_delta, 10)

    rate = f"+{rate_delta}%" if rate_delta >= 0 else f"{rate_delta}%"
    pitch = f"+{pitch_delta}Hz" if pitch_delta >= 0 else f"{pitch_delta}Hz"

    return rate, pitch


def get_rate_multiplier(text: str, language: str = "en") -> float:
    """
    解析 analyze_emotion 的 rate 返回值，转为语速倍率。

    例如 "+10%" → 1.10, "+0%" → 1.00, "-5%" → 0.95
    用于修正字数估算，使 Prompt 目标字数更精准匹配目标时长。
    """
    rate_str, _ = analyze_emotion(text, language)
    try:
        pct = int(rate_str.replace("%", "").replace("+", ""))
        return 1.0 + pct / 100.0
    except (ValueError, AttributeError):
        return 1.0


def apply_emotion_ssml(text: str, language: str = "en") -> str:
    """
    兼容旧接口：不再生成 SSML，而是直接返回原文本。
    SSML 模式已废弃，情感参数通过 analyze_emotion() 获取后传给 edge_tts Communicate()。
    """
    return text
