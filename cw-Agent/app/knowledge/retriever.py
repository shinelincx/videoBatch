from app.knowledge.store import KnowledgeStore, KnowledgeEntry
from typing import List
import os
import json


class KnowledgeRetriever:
    """知识库检索层：关键词匹配 + 热度排序"""

    def __init__(self, store: KnowledgeStore = None, knowledge_dir: str = "knowledge"):
        self.store = store or KnowledgeStore(knowledge_dir=knowledge_dir)
        self._load_templates(knowledge_dir)

    def _load_templates(self, knowledge_dir: str):
        """加载通用句式模板（hooks/cta/transitions）"""
        self.hooks = self._load_json(knowledge_dir, "templates/hooks.json")
        self.ctas = self._load_json(knowledge_dir, "templates/cta.json")
        self.transitions = self._load_json(knowledge_dir, "templates/transitions.json")

    def _load_json(self, knowledge_dir: str, rel_path: str) -> list:
        path = os.path.join(knowledge_dir, rel_path)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, list) else data.get("entries", [])
        return []

    def retrieve(self, platform: str, category: str,
                 keywords: List[str] = None, top_k: int = 3) -> List[KnowledgeEntry]:
        """
        检索最相关的知识条目

        策略：
          1. 过滤 platform + category 匹配的条目
          2. 关键词匹配 tags + content（Jaccard 相似度）
          3. 按匹配度 + 热度指标加权排序
          4. 返回 Top-K
        """
        candidates = self.store.get_by_platform_category(platform, category)
        if not candidates:
            candidates = self.store.get_by_platform_category(platform)

        if not candidates:
            return []

        keywords = keywords or []
        scored = []
        for entry in candidates:
            score = self._score_entry(entry, keywords)
            scored.append((score, entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [entry for _, entry in scored[:top_k]]

    def _score_entry(self, entry: KnowledgeEntry, keywords: List[str]) -> float:
        """计算条目匹配分数"""
        score = 0.0

        if not keywords:
            score = self._heat_score(entry)
            return score

        entry_tags = set(t.lower() for t in entry.tags)
        entry_content_lower = entry.content.lower()
        kw_set = set(k.lower() for k in keywords)

        # 标签命中加分（权重 0.6）
        tag_overlap = len(entry_tags & kw_set)
        if len(kw_set) > 0:
            score += 0.6 * (tag_overlap / len(kw_set))
        else:
            score += 0.6 * (tag_overlap / max(len(entry_tags), 1))

        # 内容命中加分（权重 0.2）
        content_hits = sum(1 for kw in kw_set if kw in entry_content_lower)
        if len(kw_set) > 0:
            score += 0.2 * (content_hits / len(kw_set))

        # 热度加分（权重 0.2）
        score += 0.2 * self._heat_score(entry)

        return score

    def _heat_score(self, entry: KnowledgeEntry) -> float:
        """将条目的热度指标归一化为 0~1 的分数"""
        metrics = entry.metrics
        likes = metrics.get("likes", 0)
        shares = metrics.get("shares", 0)

        if likes > 1_000_000:
            heat = 1.0
        elif likes > 100_000:
            heat = 0.8
        elif likes > 10_000:
            heat = 0.6
        elif likes > 1_000:
            heat = 0.4
        elif likes > 0:
            heat = 0.2
        else:
            heat = 0.0

        # shares 微调
        if shares > 10_000:
            heat = min(1.0, heat + 0.1)

        return heat

    def format_for_prompt(self, entries: List[KnowledgeEntry]) -> str:
        """将检索结果格式化为 prompt 中的参考文案文本"""
        if not entries:
            return "暂无参考文案"

        lines = []
        for i, entry in enumerate(entries, 1):
            likes = entry.metrics.get("likes", 0)
            likes_str = f"{likes / 10000:.1f}万" if likes >= 10000 else str(likes)
            lines.append(f"示例 {i}（{entry.type}，{likes_str}赞）：")
            lines.append(f'"{entry.content}"')
            lines.append("")

        return "\n".join(lines)

    def get_random_hook(self) -> str:
        """获取一条随机钩子句式"""
        if self.hooks:
            import random
            return random.choice(self.hooks).get("content", "")
        return ""

    def get_random_cta(self) -> str:
        """获取一条随机 CTA 句式"""
        if self.ctas:
            import random
            return random.choice(self.ctas).get("content", "")
        return ""
