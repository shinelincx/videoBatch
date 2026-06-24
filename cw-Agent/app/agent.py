from app.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, get_language_speed
from app.models import ProductInput, MarketingCopy, TokenUsage
from app.prompts import ENHANCED_SYSTEM_PROMPT, build_enhanced_prompt_params, _format_skill_info
from app.skills.manager import SkillManager
from app.emotion import get_rate_multiplier
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import asyncio
import httpx
import threading
import re

_lock = threading.Lock()
_chain = None
_message_chain = None
_last_match_result = None


def _get_chain():
    """获取 LangChain 链（单例缓存）"""
    global _chain
    if _chain is None:
        with _lock:
            if _chain is None:
                http_client = httpx.Client(verify=False, timeout=120)
                llm = ChatOpenAI(
                    api_key=LLM_API_KEY,
                    base_url=LLM_BASE_URL,
                    model=LLM_MODEL,
                    temperature=0.7,
                    http_client=http_client,
                )
                prompt = ChatPromptTemplate.from_messages([
                    ("system", ENHANCED_SYSTEM_PROMPT),
                    ("human", "{enhanced_prompt}"),
                ])
                _chain = prompt | llm | StrOutputParser()
    return _chain


def _get_message_chain():
    """获取保留 AIMessage 元数据的 LangChain 链（供 token usage 统计使用）"""
    global _message_chain
    if _message_chain is None:
        with _lock:
            if _message_chain is None:
                http_client = httpx.Client(verify=False, timeout=120)
                llm = ChatOpenAI(
                    api_key=LLM_API_KEY,
                    base_url=LLM_BASE_URL,
                    model=LLM_MODEL,
                    temperature=0.7,
                    http_client=http_client,
                )
                prompt = ChatPromptTemplate.from_messages([
                    ("system", ENHANCED_SYSTEM_PROMPT),
                    ("human", "{enhanced_prompt}"),
                ])
                _message_chain = prompt | llm
    return _message_chain


def _extract_token_usage(message, attempts: int = 1) -> TokenUsage:
    """从 LangChain AIMessage 中提取 token usage，兼容不同 provider 元数据格式。"""
    usage = getattr(message, "usage_metadata", None) or {}
    metadata = getattr(message, "response_metadata", None) or {}
    token_usage = metadata.get("token_usage") or {}

    prompt_tokens = (
        usage.get("input_tokens")
        or usage.get("prompt_tokens")
        or token_usage.get("prompt_tokens")
        or token_usage.get("input_tokens")
        or 0
    )
    completion_tokens = (
        usage.get("output_tokens")
        or usage.get("completion_tokens")
        or token_usage.get("completion_tokens")
        or token_usage.get("output_tokens")
        or 0
    )
    total_tokens = (
        usage.get("total_tokens")
        or token_usage.get("total_tokens")
        or (prompt_tokens + completion_tokens)
    )
    return TokenUsage(
        prompt_tokens=int(prompt_tokens or 0),
        completion_tokens=int(completion_tokens or 0),
        total_tokens=int(total_tokens or 0),
        attempts=attempts,
        model=LLM_MODEL,
    )


def _add_token_usage(total: TokenUsage, current: TokenUsage) -> TokenUsage:
    return TokenUsage(
        prompt_tokens=total.prompt_tokens + current.prompt_tokens,
        completion_tokens=total.completion_tokens + current.completion_tokens,
        total_tokens=total.total_tokens + current.total_tokens,
        attempts=total.attempts + current.attempts,
        model=current.model or total.model or LLM_MODEL,
    )


def _format_enhanced_prompt(skill, params: dict) -> str:
    """应用 Skill 模板，并统一追加实时热门视频洞察约束。"""
    enhanced_prompt = skill.prompt_template.format(**params)
    trend_insights = params.get("trend_insights", "暂无实时热门视频洞察")
    if "## 实时热门视频洞察" not in enhanced_prompt:
        enhanced_prompt = (
            f"{enhanced_prompt}\n\n"
            "## 实时热门视频洞察\n"
            f"{trend_insights}\n\n"
            "请学习这些热门内容的节奏、卖点排序、场景表达和 CTA 方式。\n"
            "不要照搬原文，不要虚构未提供的价格、库存、品牌授权或功效。\n"
            "优先结合当前产品卖点重写成新的原创口播文案。"
        )
    return enhanced_prompt


def _parse_copy_output(raw_output: str) -> tuple:
    """解析 LLM 结构化输出，提取标题、标签、正文"""
    title = ""
    tags = []
    body = raw_output.strip()

    title_match = re.search(r'【标题】\s*(.+?)(?:\n|$)', raw_output)
    if title_match:
        title = title_match.group(1).strip()

    tags_match = re.search(r'【标签】\s*(.+?)(?:\n|$)', raw_output)
    if tags_match:
        tags_text = tags_match.group(1).strip()
        tags = [t.strip() for t in re.split(r'[,，、\s]+', tags_text) if t.strip()]

    body_match = re.search(r'【正文】\s*\n?(.*)', raw_output, re.DOTALL)
    if body_match:
        body = body_match.group(1).strip()
    elif title or tags:
        lines = raw_output.strip().split('\n')
        body_start = 0
        for i, line in enumerate(lines):
            if line.startswith('【标题】') or line.startswith('【标签】'):
                body_start = i + 1
        if body_start > 0 and body_start < len(lines):
            body = '\n'.join(lines[body_start:]).strip()

    return title, tags, body


def _format_output_tags(tags: list, skill) -> list:
    """按平台格式化输出标签。抖音标签需要 # 前缀。"""
    tags = tags or []
    is_douyin = any(platform == "抖音" for platform in getattr(skill, "platforms", []))
    if not is_douyin:
        return tags
    formatted = []
    for tag in tags:
        tag = str(tag).strip()
        if not tag:
            continue
        formatted.append(tag if tag.startswith("#") else f"#{tag}")
    return formatted


def _build_marketing_copy(result: str, language: str, skill, title: str = "", tags: list = None) -> MarketingCopy:
    """构建 MarketingCopy 结果对象，纳入情感语速修正"""
    _CHAR_COUNT_LANGS = ("zh", "ja", "ko", "th", "my", "km", "lo")
    if language in _CHAR_COUNT_LANGS:
        word_count = len(result)
    else:
        word_count = len(result.split())
    speed = get_language_speed(language)
    rate_mult = get_rate_multiplier(result, language)
    adjusted_speed = speed * rate_mult
    estimated_duration = word_count / adjusted_speed
    if tags is None:
        tags = []
    tags = _format_output_tags(tags, skill)
    return MarketingCopy(title=title, tags=tags, text=result, word_count=word_count, estimated_duration=round(estimated_duration, 2))


def _post_process(text: str, skill, target_word_count: int = None, language: str = "zh") -> dict:
    """
    后处理校验：基于 Skill 质量标准做基础检查 + 字数校验。

    返回 {"text": str, "word_count_valid": bool, "word_count": int,
            "word_count_min": int, "word_count_max": int}
    """
    result_info = {"text": "", "word_count_valid": True, "word_count": 0,
                   "word_count_min": 0, "word_count_max": 0}

    if text is None:
        return result_info

    text = text.strip()
    if not text:
        return result_info

    text = re.sub(r"\n{3,}", "\n\n", text)
    result_info["text"] = text

    if target_word_count is None:
        return result_info

    _CHAR_COUNT_LANGS = ("zh", "ja", "ko", "th", "my", "km", "lo")
    if language in _CHAR_COUNT_LANGS:
        word_count = len(text)
    else:
        word_count = len(text.split())

    wc_min = max(1, int(target_word_count * 0.85))
    wc_max = int(target_word_count * 1.15)
    result_info["word_count"] = word_count
    result_info["word_count_min"] = wc_min
    result_info["word_count_max"] = wc_max
    result_info["word_count_valid"] = wc_min <= word_count <= wc_max

    return result_info


def _check_forbidden_words(text: str, forbidden_words: list) -> list:
    """检查文案中是否包含禁用词"""
    found = []
    text_lower = text.lower()
    for word in forbidden_words:
        if word.lower() in text_lower:
            found.append(word)
    return found


async def generate_copy(product_input: ProductInput) -> MarketingCopy:
    """
    增强版文案生成流程：
      1. Skill 路由匹配
      2. 知识库检索
      3. 组装增强 Prompt
      4. LLM 生成 + 字数硬校验 + 重试（最多3次）
      5. 后处理校验
    """
    global _last_match_result

    manager = SkillManager.get_instance()
    match_result = manager.match_skill(product_input.platform, product_input.category)
    _last_match_result = match_result
    skill = match_result.skill

    params = build_enhanced_prompt_params(product_input)

    chain = _get_chain()
    best_result = None

    for attempt in range(3):
        try:
            enhanced_prompt = _format_enhanced_prompt(skill, params)
            raw_result = chain.invoke({"enhanced_prompt": enhanced_prompt})

            proc_info = _post_process(
                raw_result, skill,
                target_word_count=params["target_word_count"],
                language=product_input.language,
            )
            raw_result = proc_info["text"]
            title, tags, body = _parse_copy_output(raw_result)
            copy = _build_marketing_copy(body, product_input.language, skill, title=title, tags=tags)

            if proc_info["word_count_valid"]:
                return copy

            # 字数偏差过大，保存最佳结果并调整 Prompt 重试
            if best_result is None or abs(proc_info["word_count"] - params["target_word_count"]) < abs(
                best_result[0] - params["target_word_count"]
            ):
                best_result = (proc_info["word_count"], copy)

            # 调整提示：告知 LLM 需要更严格地控制字数
            if proc_info["word_count"] < proc_info["word_count_min"]:
                hint = f"\n[系统提示] 上次输出太短({proc_info['word_count']}字)，请扩充到{params['target_word_range']}字。"
            else:
                hint = f"\n[系统提示] 上次输出太长({proc_info['word_count']}字)，请精简到{params['target_word_range']}字。"
            params["_hint"] = hint
            await asyncio.sleep(0.5)

        except Exception as e:
            if attempt < 2:
                await asyncio.sleep(1)
            else:
                if best_result:
                    return best_result[1]
                raise RuntimeError(f"Failed to generate copy after 3 attempts: {e}")

    # 所有重试后仍偏差，返回最佳结果
    if best_result:
        return best_result[1]
    raise RuntimeError(f"Failed to generate copy: word count validation failed after 3 attempts")


async def generate_copy_with_usage(product_input: ProductInput) -> tuple[MarketingCopy, TokenUsage]:
    """
    文案生成 + token usage 统计版本，供 v2 copy-only API 使用。
    不生成音频/字幕；token usage 累加所有 LLM 尝试。
    """
    global _last_match_result

    manager = SkillManager.get_instance()
    match_result = manager.match_skill(product_input.platform, product_input.category)
    _last_match_result = match_result
    skill = match_result.skill

    params = build_enhanced_prompt_params(product_input)
    chain = _get_message_chain()
    best_result = None
    total_usage = TokenUsage(model=LLM_MODEL)

    for attempt in range(3):
        try:
            enhanced_prompt = _format_enhanced_prompt(skill, params)
            message = chain.invoke({"enhanced_prompt": enhanced_prompt})
            total_usage = _add_token_usage(total_usage, _extract_token_usage(message, attempts=1))
            raw_result = getattr(message, "content", "") or str(message)

            proc_info = _post_process(
                raw_result, skill,
                target_word_count=params["target_word_count"],
                language=product_input.language,
            )
            raw_result = proc_info["text"]
            title, tags, body = _parse_copy_output(raw_result)
            copy = _build_marketing_copy(body, product_input.language, skill, title=title, tags=tags)

            if proc_info["word_count_valid"]:
                return copy, total_usage

            if best_result is None or abs(proc_info["word_count"] - params["target_word_count"]) < abs(
                best_result[0] - params["target_word_count"]
            ):
                best_result = (proc_info["word_count"], copy, total_usage)

            if proc_info["word_count"] < proc_info["word_count_min"]:
                hint = f"\n[系统提示] 上次输出太短({proc_info['word_count']}字)，请扩充到{params['target_word_range']}字。"
            else:
                hint = f"\n[系统提示] 上次输出太长({proc_info['word_count']}字)，请精简到{params['target_word_range']}字。"
            params["_hint"] = hint
            await asyncio.sleep(0.5)

        except Exception as e:
            if attempt < 2:
                await asyncio.sleep(1)
            else:
                if best_result:
                    return best_result[1], best_result[2]
                raise RuntimeError(f"Failed to generate copy after 3 attempts: {e}")

    if best_result:
        return best_result[1], best_result[2]
    raise RuntimeError("Failed to generate copy: word count validation failed after 3 attempts")


def generate_copy_sync(product_input: ProductInput) -> MarketingCopy:
    """同步版文案生成（供 CLI 使用），含字数校验 + 重试"""
    global _last_match_result

    manager = SkillManager.get_instance()
    match_result = manager.match_skill(product_input.platform, product_input.category)
    _last_match_result = match_result
    skill = match_result.skill

    params = build_enhanced_prompt_params(product_input)
    best_result = None

    for attempt in range(3):
        try:
            enhanced_prompt = _format_enhanced_prompt(skill, params)
            raw_result = _get_chain().invoke({"enhanced_prompt": enhanced_prompt})

            proc_info = _post_process(
                raw_result, skill,
                target_word_count=params["target_word_count"],
                language=product_input.language,
            )
            raw_result = proc_info["text"]
            title, tags, body = _parse_copy_output(raw_result)
            copy = _build_marketing_copy(body, product_input.language, skill, title=title, tags=tags)

            if proc_info["word_count_valid"]:
                return copy

            if best_result is None or abs(proc_info["word_count"] - params["target_word_count"]) < abs(
                best_result[0] - params["target_word_count"]
            ):
                best_result = (proc_info["word_count"], copy)

            if proc_info["word_count"] < proc_info["word_count_min"]:
                hint = f"\n[系统提示] 上次输出太短({proc_info['word_count']}字)，请扩充到{params['target_word_range']}字。"
            else:
                hint = f"\n[系统提示] 上次输出太长({proc_info['word_count']}字)，请精简到{params['target_word_range']}字。"
            params["_hint"] = hint
        except Exception as e:
            if attempt >= 2:
                if best_result:
                    return best_result[1]
                raise RuntimeError(f"Failed after 3 attempts: {e}")

    if best_result:
        return best_result[1]
    raise RuntimeError("Failed to generate copy: word count validation failed after 3 attempts")


def get_last_match_result():
    """获取最近一次 Skill 匹配结果（供 routes 使用）"""
    return _last_match_result
