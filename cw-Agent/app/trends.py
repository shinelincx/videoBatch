from __future__ import annotations

from app.models import ProductInput
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List, Tuple
import hashlib
import json
import os
import re
import sqlite3


CATEGORY_ALIASES = {
    "服饰": ["服饰", "服装", "女装", "男装", "童装", "儿童裤子", "裤子", "防蚊裤", "鞋服", "夏裤"],
    "母婴宠物": ["母婴", "儿童用品", "宝宝", "童装", "儿童裤子", "孩子", "男孩", "女孩", "胖宝", "瘦宝"],
    "鞋靴箱包": ["鞋靴箱包", "鞋", "包", "箱包", "童鞋"],
}

PRODUCT_KEYWORDS = [
    "儿童裤子", "防蚊裤", "束脚裤", "速干裤", "裤子", "短袖", "小t恤", "防晒衣",
    "童装", "女装", "男装", "童鞋", "面霜", "精华", "面膜", "防晒",
]
SELLING_POINT_KEYWORDS = [
    "凉快", "透气", "网面", "轻盈", "柔软", "吸湿", "速干", "宽松", "弹力",
    "防蚊", "不闷热", "不勒肚子", "百搭", "清爽", "补水", "锁水", "显瘦",
]
AUDIENCE_KEYWORDS = ["儿童", "孩子", "男孩", "女孩", "胖宝", "瘦宝", "宝宝", "宝妈"]
SEASON_KEYWORDS = {"夏季": ["夏天", "夏季", "凉快", "防晒"], "春秋": ["春秋"], "冬季": ["冬天", "保暖"]}
SCENARIO_KEYWORDS = ["上学", "户外", "防蚊", "日常搭配", "活动", "追剧", "办公室"]
CONVERSION_KEYWORDS = {
    "清仓": ["清仓", "清一批"],
    "库存少": ["库存不多", "库存不太多", "花色没剩多少", "限量", "断货"],
    "拼手速": ["拼个手速", "拼手速", "手慢无", "赶紧"],
    "多囤": ["多薅", "多囤", "囤起来"],
}


def parse_count(value) -> int:
    """Parse Chinese compact counts such as 70万+ into an integer."""
    if value is None:
        return 0
    text = str(value).strip().replace(",", "").replace("+", "")
    match = re.search(r"(\d+(?:\.\d+)?)\s*(万|千|亿)?", text)
    if not match:
        return 0
    number = float(match.group(1))
    unit = match.group(2)
    multiplier = {"千": 1_000, "万": 10_000, "亿": 100_000_000}.get(unit, 1)
    return int(number * multiplier)


def parse_money_range(value) -> Tuple[int, int]:
    """Parse settlement ranges like 10万-50万."""
    if value is None:
        return (0, 0)
    parts = re.split(r"\s*[-~—到至]\s*", str(value).strip())
    if len(parts) >= 2:
        return (parse_count(parts[0]), parse_count(parts[1]))
    amount = parse_count(value)
    return (amount, amount)


def parse_duration_seconds(value) -> int:
    """Parse video duration strings such as 1分22秒."""
    if value is None:
        return 0
    text = str(value).strip()
    minutes = re.search(r"(\d+)\s*分", text)
    seconds = re.search(r"(\d+)\s*秒", text)
    total = 0
    if minutes:
        total += int(minutes.group(1)) * 60
    if seconds:
        total += int(seconds.group(1))
    if total:
        return total
    colon = re.match(r"(?:(\d+):)?(\d+):(\d+)$", text)
    if colon:
        hours = int(colon.group(1) or 0)
        return hours * 3600 + int(colon.group(2)) * 60 + int(colon.group(3))
    return parse_count(text)


def _parse_datetime(value: str) -> str:
    if not value:
        return ""
    text = str(value).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(text, fmt).isoformat(sep=" ")
        except ValueError:
            continue
    return text


def _contains_any(text: str, words: Iterable[str]) -> bool:
    return any(word and word in text for word in words)


def _extract_keywords(text: str, words: Iterable[str]) -> List[str]:
    return [word for word in words if word in text]


def _normalize_category(raw_category: str, text: str) -> str:
    for category, aliases in CATEGORY_ALIASES.items():
        if raw_category in aliases:
            return category
    source = f"{raw_category} {text}"
    best = raw_category or "通用"
    best_hits = 0
    for category, aliases in CATEGORY_ALIASES.items():
        hits = sum(1 for alias in aliases if alias in source)
        if hits > best_hits:
            best = category
            best_hits = hits
    return best


def _json_dumps(items: List[str]) -> str:
    return json.dumps(items, ensure_ascii=False)


def _json_loads(value: str) -> List[str]:
    if not value:
        return []
    try:
        data = json.loads(value)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


class TrendNormalizer:
    """Rule-based normalizer for v1 trend matching."""

    def normalize(self, item: dict) -> dict:
        raw_category = str(item.get("类目", "")).strip()
        video_title = str(item.get("视频标题", "")).strip()
        commerce_title = str(item.get("带货文案标题", "")).strip()
        transcript = str(item.get("语音转文字", "")).strip()
        topics = str(item.get("话题内容", "")).strip()
        text = " ".join([raw_category, video_title, commerce_title, transcript, topics])

        product_keywords = _extract_keywords(text, PRODUCT_KEYWORDS)
        selling_points = _extract_keywords(text, SELLING_POINT_KEYWORDS)
        audience = _extract_keywords(text, AUDIENCE_KEYWORDS)
        season = [name for name, words in SEASON_KEYWORDS.items() if _contains_any(text, words)]
        scenario = _extract_keywords(text, SCENARIO_KEYWORDS)
        conversion = [name for name, words in CONVERSION_KEYWORDS.items() if _contains_any(text, words)]

        if "防蚊" in selling_points and "防蚊" not in scenario:
            scenario.append("防蚊")
        if "儿童裤子" in product_keywords and "儿童" not in audience:
            audience.append("儿童")

        settlement_min, settlement_max = parse_money_range(item.get("结算金额", ""))
        play_count = parse_count(item.get("总播放量", ""))
        like_count = parse_count(item.get("总点赞量", ""))
        heat_score = self._heat_score(play_count, like_count, settlement_max)
        source_hash = self._source_hash(video_title, item.get("发布时间", ""), transcript)

        return {
            "platform": "抖音",
            "raw_category": raw_category,
            "normalized_category": _normalize_category(raw_category, text),
            "subcategory": product_keywords[:3],
            "audience": audience,
            "season": season,
            "scenario": scenario,
            "product_keywords": product_keywords,
            "selling_point_keywords": selling_points,
            "conversion_keywords": conversion,
            "video_title": video_title,
            "video_duration_seconds": parse_duration_seconds(item.get("视频时长", "")),
            "published_at": _parse_datetime(item.get("发布时间", "")),
            "collected_at": _parse_datetime(item.get("采集时间", "") or item.get("采集日期", "")),
            "play_count": play_count,
            "like_count": like_count,
            "settlement_amount_min": settlement_min,
            "settlement_amount_max": settlement_max,
            "commerce_title": commerce_title,
            "transcript": transcript,
            "topics": topics,
            "source_hash": source_hash,
            "heat_score": heat_score,
        }

    def _source_hash(self, video_title: str, published_at: str, transcript: str) -> str:
        raw = f"{video_title}|{published_at}|{transcript[:120]}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _heat_score(self, play_count: int, like_count: int, settlement_max: int) -> float:
        play_score = min(play_count / 1_000_000, 1.0)
        like_score = min(like_count / 100_000, 1.0)
        settlement_score = min(settlement_max / 500_000, 1.0)
        return round(play_score * 0.5 + like_score * 0.2 + settlement_score * 0.3, 4)


class TrendStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_schema()

    def _connect(self):
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)
        return sqlite3.connect(self.db_path)

    def _ensure_schema(self):
        conn = self._connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS trend_videos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT NOT NULL,
                    raw_category TEXT,
                    normalized_category TEXT,
                    subcategory TEXT,
                    audience TEXT,
                    season TEXT,
                    scenario TEXT,
                    product_keywords TEXT,
                    selling_point_keywords TEXT,
                    conversion_keywords TEXT,
                    video_title TEXT,
                    video_duration_seconds INTEGER,
                    published_at TEXT,
                    collected_at TEXT,
                    play_count INTEGER,
                    like_count INTEGER,
                    settlement_amount_min INTEGER,
                    settlement_amount_max INTEGER,
                    commerce_title TEXT,
                    transcript TEXT,
                    topics TEXT,
                    source_hash TEXT UNIQUE,
                    heat_score REAL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    def upsert(self, item: dict) -> str:
        existing = self.get_by_hash(item["source_hash"])
        fields = [
            "platform", "raw_category", "normalized_category", "subcategory", "audience", "season",
            "scenario", "product_keywords", "selling_point_keywords", "conversion_keywords",
            "video_title", "video_duration_seconds", "published_at", "collected_at", "play_count",
            "like_count", "settlement_amount_min", "settlement_amount_max", "commerce_title",
            "transcript", "topics", "source_hash", "heat_score",
        ]
        values = [self._serialize(item.get(field)) for field in fields]
        conn = self._connect()
        try:
            if existing:
                assignments = ", ".join(f"{field}=?" for field in fields if field != "source_hash")
                update_values = [self._serialize(item.get(field)) for field in fields if field != "source_hash"]
                update_values.append(item["source_hash"])
                conn.execute(f"UPDATE trend_videos SET {assignments} WHERE source_hash=?", update_values)
                conn.commit()
                return "updated"
            placeholders = ", ".join("?" for _ in fields)
            conn.execute(f"INSERT INTO trend_videos ({', '.join(fields)}) VALUES ({placeholders})", values)
            conn.commit()
            return "inserted"
        finally:
            conn.close()

    def get_by_hash(self, source_hash: str):
        conn = self._connect()
        try:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM trend_videos WHERE source_hash=?", (source_hash,)).fetchone()
            return self._row_to_dict(row) if row else None
        finally:
            conn.close()

    def list_all(self) -> List[dict]:
        conn = self._connect()
        try:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM trend_videos ORDER BY id").fetchall()
            return [self._row_to_dict(row) for row in rows]
        finally:
            conn.close()

    def query_platform(self, platform: str) -> List[dict]:
        conn = self._connect()
        try:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM trend_videos WHERE platform=?", (platform,)).fetchall()
            return [self._row_to_dict(row) for row in rows]
        finally:
            conn.close()

    def _serialize(self, value):
        if isinstance(value, list):
            return _json_dumps(value)
        return value

    def _row_to_dict(self, row) -> dict:
        data = dict(row)
        for field in [
            "subcategory", "audience", "season", "scenario", "product_keywords",
            "selling_point_keywords", "conversion_keywords",
        ]:
            data[field] = _json_loads(data.get(field, ""))
        return data


class TrendIngestor:
    def __init__(self, db_path: str, normalizer: TrendNormalizer | None = None):
        self.store = TrendStore(db_path)
        self.normalizer = normalizer or TrendNormalizer()

    def ingest_douyin(self, items: List[dict]) -> dict:
        result = {"inserted": 0, "updated": 0, "skipped": 0}
        for item in items:
            if not isinstance(item, dict):
                result["skipped"] += 1
                continue
            normalized = self.normalizer.normalize(item)
            status = self.store.upsert(normalized)
            result[status] += 1
        return result


@dataclass
class TrendRetriever:
    db_path: str
    top_k: int = 3

    def retrieve(self, product_input: ProductInput) -> List[dict]:
        if product_input.platform.lower() != "抖音":
            return []
        store = TrendStore(self.db_path)
        rows = store.query_platform("抖音")
        scored = []
        for row in rows:
            score, reasons = self._score(row, product_input)
            if score > 0:
                item = dict(row)
                item["match_score"] = round(score, 4)
                item["match_reasons"] = reasons
                scored.append(item)
        scored.sort(key=lambda item: item["match_score"], reverse=True)
        return scored[:self.top_k]

    def format_insights(self, matches: List[dict]) -> str:
        if not matches:
            return "暂无实时热门视频洞察"
        lines = ["## 实时热门视频洞察"]
        for index, item in enumerate(matches, 1):
            product_hits = self._pick(item.get("product_keywords", []), ["儿童裤子", "防蚊裤", "速干裤", "裤子"])
            selling_hits = self._pick(
                item.get("selling_point_keywords", []),
                ["凉快", "速干", "防蚊", "宽松", "透气", "轻盈", "柔软"],
            )
            audience = "、".join(item.get("audience", [])[:3]) or "目标人群"
            category_desc = "儿童夏季裤装" if "儿童裤子" in product_hits else item.get("normalized_category", "相关商品")
            structure = self._build_structure(item)
            phrases = self._build_phrase_direction(item)
            conversion = "、".join(item.get("conversion_keywords", [])[:4]) or "结合真实优惠或行动号召促单"
            lines.extend(
                [
                    f"热门视频{index}：",
                    f"匹配原因：同属{category_desc}，命中“{'、'.join(selling_hits) or '相关卖点'}”，目标人群为{audience}。",
                    f"可借鉴结构：{structure}。",
                    f"可借鉴话术方向：{phrases}。",
                    f"转化方式：强调{conversion}。",
                    "禁止照搬：不得复用原文连续句子，不得迁移未在当前产品输入中出现的具体价格、库存、品牌信息。",
                    "",
                ]
            )
        return "\n".join(lines).strip()

    def _score(self, item: dict, product_input: ProductInput) -> tuple[float, List[str]]:
        input_text = f"{product_input.category} {product_input.title} {' '.join(product_input.selling_points)}"
        input_category = _normalize_category(product_input.category, input_text)
        category_score = 1.0 if item.get("normalized_category") == input_category else 0.0
        if category_score == 0 and _contains_any(input_text, CATEGORY_ALIASES.get(item.get("normalized_category", ""), [])):
            category_score = 0.7

        product_score = self._overlap_score(input_text, item.get("product_keywords", []))
        selling_score = self._overlap_score(input_text, item.get("selling_point_keywords", []))
        people_scene_words = item.get("audience", []) + item.get("scenario", []) + item.get("season", [])
        people_scene_score = self._overlap_score(input_text, people_scene_words)
        heat_score = float(item.get("heat_score") or 0)
        freshness_score = self._freshness_score(item.get("published_at", ""))

        score = (
            0.25 * category_score
            + 0.25 * product_score
            + 0.20 * selling_score
            + 0.10 * people_scene_score
            + 0.10 * heat_score
            + 0.10 * freshness_score
        )
        reasons = []
        for label, part in [
            ("类目", category_score),
            ("商品关键词", product_score),
            ("卖点", selling_score),
            ("人群/场景", people_scene_score),
        ]:
            if part > 0:
                reasons.append(label)
        return score, reasons

    def _overlap_score(self, input_text: str, words: List[str]) -> float:
        if not words:
            return 0.0
        hits = sum(1 for word in words if word and word in input_text)
        return min(1.0, hits / min(len(words), 4))

    def _freshness_score(self, value: str) -> float:
        if not value:
            return 0.3
        try:
            published = datetime.fromisoformat(value)
        except ValueError:
            return 0.3
        days = max(0, (datetime.now() - published).days)
        if days <= 30:
            return 1.0
        if days <= 60:
            return 0.7
        if days <= 120:
            return 0.4
        return 0.2

    def _pick(self, source: List[str], preferred: List[str]) -> List[str]:
        picked = [word for word in preferred if word in source]
        return picked or source[:4]

    def _build_structure(self, item: dict) -> str:
        points = item.get("selling_point_keywords", [])
        if "儿童裤子" in item.get("product_keywords", []) or "防蚊裤" in item.get("product_keywords", []):
            return "清仓开头 -> 凉感体验 -> 面料功能 -> 活动舒适 -> 防蚊场景 -> 腰围舒适 -> 百搭搭配 -> 库存 CTA"
        if points:
            return "吸睛开头 -> 核心体验 -> 卖点展开 -> 使用场景 -> 行动 CTA"
        return "吸睛开头 -> 产品价值 -> 使用场景 -> 行动 CTA"

    def _build_phrase_direction(self, item: dict) -> str:
        text = f"{item.get('video_title', '')} {item.get('transcript', '')}"
        phrases = []
        for phrase in ["像开了小风扇", "胖宝瘦宝都能穿", "刷到合适赶紧拼手速", "夏天上学穿"]:
            if phrase in text:
                phrases.append(phrase)
        return "、".join(phrases[:4]) or "用体感比喻、适用人群和紧迫感表达提升转化"
