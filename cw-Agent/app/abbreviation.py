import re

# 电商/营销领域常见缩写词 → TTS 友好全称
# 对于通常按字母读的缩写（如 API, SEO），使用空格分隔的拼读形式
# 对于可以单词化读的缩写（如 ROI），使用完整单词
_ABBRS_EN: dict[str, str] = {
    # --- 电商/营销核心术语 ---
    "ROI": "return on investment",
    "KOL": "key opinion leader",
    "UGC": "user generated content",
    "CTA": "call to action",
    "USP": "unique selling proposition",
    "B2B": "B to B",
    "B2C": "B to C",
    "CPC": "cost per click",
    "CPM": "cost per thousand impressions",
    "CTR": "click through rate",
    "CVR": "conversion rate",
    "SOP": "standard operating procedure",
    "SaaS": "software as a service",
    "T&C": "terms and conditions",
    "COD": "cash on delivery",
    "SKU": "S K U",
    # --- 技术/商业术语 ---
    "API": "A P I",
    "SEO": "S E O",
    "CRM": "C R M",
    "KPI": "K P I",
    "FAQ": "F A Q",
    "ETA": "E T A",
    "TBD": "to be decided",
    "R&D": "R and D",
    "HR": "H R",
    "PR": "P R",
    "CEO": "C E O",
    "CFO": "C F O",
    "CMO": "C M O",
    "CTO": "C T O",
    "VP": "V P",
    "GDPR": "G D P R",
    "SSL": "S S L",
    "HTML": "H T M L",
    "CSS": "C S S",
    "JS": "JavaScript",
    "JSON": "Jason",
    "XML": "X M L",
    "SDK": "S D K",
    "UI": "U I",
    "UX": "U X",
    # --- 社交媒体/网络用语 ---
    "LOL": "lol",
    "OMG": "oh my god",
    "TBH": "to be honest",
    "IMO": "in my opinion",
    "IMHO": "in my humble opinion",
    "FYI": "for your information",
    "BRB": "be right back",
    "BTW": "by the way",
    "IDK": "I don't know",
    "JK": "just kidding",
    "NVM": "never mind",
    "TMI": "too much information",
    "DM": "D M",
    "PM": "P M",
    "AKA": "A K A",
    "GTG": "got to go",
    "ICYMI": "in case you missed it",
    "TBT": "throwback Thursday",
    "OOTD": "outfit of the day",
    "GRWM": "get ready with me",
    "POV": "point of view",
    "ASMR": "A S M R",
    "BTS": "behind the scenes",
    "WIP": "work in progress",
    "Q&A": "Q and A",
    "AMA": "ask me anything",
    "FOMO": "fear of missing out",
    "YOLO": "you only live once",
    "IRL": "in real life",
    "OP": "original poster",
    "TLDR": "too long, didn't read",
    "MFW": "my face when",
    "TIL": "today I learned",
    "NSFW": "not safe for work",
    "SFW": "safe for work",
    "PSA": "public service announcement",
    # --- 常见日常缩写 ---
    "ASAP": "as soon as possible",
    "DIY": "do it yourself",
    "VIP": "V I P",
    "RSVP": "please respond",
    "ETA": "estimated time of arrival",
    "EST": "estimated",
    "PTO": "paid time off",
    "WFH": "work from home",
    "w/": "with",
    "w/o": "without",
    "vs": "versus",
    "e.g.": "for example",
    "i.e.": "that is",
    "etc.": "et cetera",
}

# 按长度降序排列，优先匹配长缩写（防止 "HR" 先于 "HR department" 匹配）
_SORTED_KEYS: list[str] = sorted(_ABBRS_EN.keys(), key=len, reverse=True)

# 黑白名单：这些全大写词不是缩写，不要展开
_NON_ABBREVIATION_WORDS: set[str] = {
    "I", "A", "OK", "HI", "HEY", "NO", "YES", "THE", "AND", "FOR", "BUT", "NOT",
    "ALL", "NEW", "TOP", "BEST", "FREE", "SALE", "HOT", "WOW", "NOW", "GET",
    "USE", "TRY", "BUY", "LOVE", "LIKE", "NEED", "WANT", "SEE", "ONE", "TWO",
    "THIS", "THAT", "WITH", "FROM", "YOUR", "OUR", "ITS", "HAS", "BEEN", "WILL",
}
# 品牌名白名单（保持原样，不展开）
_BRAND_NAMES: set[str] = {
    "MAC", "NARS", "FAB", "ELF", "H&M", "M&S", "HFP",
    "DHC", "SK-II", "SK2", "OLAY", "DOVE", "NIKE", "ADIDAS",
    "ASUS", "HP", "IBM", "AMD", "INTEL", "LG", "SONY", "SAMSUNG",
    "HTC", "OPPO", "VIVO", "REALME", "ONEPLUS", "XIAOMI", "HONOR",
    "HUAWEI", "NOKIA", "MOTOROLA", "LENOVO", "DELL", "ACER", "TOSHIBA", "PANASONIC",
}

# 数字+字母混合的模式（如 4K、8K、5G、24/7）保留不变
_RE_MIXED_ALPHANUM = re.compile(r"^\d+[A-Za-z]+$|^[A-Za-z]+\d+$|^\d+/\d+$")

def _build_pattern(keys: list[str]) -> re.Pattern:
    escaped = [re.escape(k) for k in keys]
    return re.compile(
        r"\b(" + "|".join(escaped) + r")(s)?\b",
        re.IGNORECASE,
    )

_RE_ABBR = _build_pattern(_SORTED_KEYS)


def expand_abbreviations(text: str, language: str = "en") -> str:
    """展开标语种缩写词为 TTS 友好的完整表达"""
    if not text:
        return text

    # 目前仅处理英语缩写，后续可扩展其他语种
    if language != "en":
        # 其他语种也使用英语缩写字典（电商领域英语缩写在多语种文案中也很常见）
        abbrs = _ABBRS_EN
        re_pattern = _RE_ABBR
        non_abbr = _NON_ABBREVIATION_WORDS
        brands = _BRAND_NAMES
    else:
        abbrs = _ABBRS_EN
        re_pattern = _RE_ABBR
        non_abbr = _NON_ABBREVIATION_WORDS
        brands = _BRAND_NAMES

    def _replacer(match: re.Match) -> str:
        word = match.group(1)
        suffix = match.group(2) or ""
        word_upper = word.upper()
        # 跳过非缩写的常见词
        if word_upper in non_abbr:
            return match.group(0)
        if word_upper in brands or word in brands:
            return match.group(0)
        if _RE_MIXED_ALPHANUM.match(word):
            return match.group(0)
        replacement = abbrs.get(word_upper, abbrs.get(word))
        if replacement is None:
            return match.group(0)
        return replacement + suffix.lower()

    return re_pattern.sub(_replacer, text)


def get_abbreviation_count(text: str, language: str = "en") -> int:
    """统计文本中包含的已知缩写词数量"""
    if not text:
        return 0
    matches = _RE_ABBR.findall(text)
    count = 0
    for m in matches:
        word = m[0] if isinstance(m, tuple) else m
        word_upper = word.upper()
        if word_upper not in _NON_ABBREVIATION_WORDS and word_upper not in _BRAND_NAMES and not _RE_MIXED_ALPHANUM.match(word):
            count += 1
    return count
