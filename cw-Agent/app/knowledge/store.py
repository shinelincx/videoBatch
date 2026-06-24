from dataclasses import dataclass, field
from typing import List, Optional, Dict
import json
import os


@dataclass
class KnowledgeEntry:
    """知识库单条条目"""
    id: str
    platform: str
    category: str
    type: str
    content: str
    metrics: Dict[str, int] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    source: str = ""
    updated: str = ""

    @classmethod
    def from_dict(cls, data: dict) -> "KnowledgeEntry":
        return cls(
            id=data.get("id", ""),
            platform=data.get("platform", ""),
            category=data.get("category", ""),
            type=data.get("type", ""),
            content=data.get("content", ""),
            metrics=data.get("metrics", {}),
            tags=data.get("tags", []),
            source=data.get("source", ""),
            updated=data.get("updated", ""),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "platform": self.platform,
            "category": self.category,
            "type": self.type,
            "content": self.content,
            "metrics": self.metrics,
            "tags": self.tags,
            "source": self.source,
            "updated": self.updated,
        }


class KnowledgeStore:
    """知识库存储层：管理知识条目的加载和持久化"""

    def __init__(self, knowledge_dir: str = "knowledge", autoload: bool = True):
        self._entries: List[KnowledgeEntry] = []
        self._knowledge_dir = knowledge_dir
        if autoload:
            self._load_all()

    def _load_all(self):
        """加载所有平台×品类的知识条目"""
        self._entries.clear()

        index_path = os.path.join(self._knowledge_dir, "index.json")
        if not os.path.exists(index_path):
            return

        with open(index_path, "r", encoding="utf-8") as f:
            index_data = json.load(f)

        entries_config = index_data.get("entries", {})
        for platform, categories in entries_config.items():
            if platform == "templates":
                continue
            for category in categories:
                file_name = f"{category}.json"
                file_path = os.path.join(self._knowledge_dir, platform, file_name)
                if os.path.exists(file_path):
                    self._load_file(file_path)

    def _load_file(self, file_path: str):
        """加载单个 JSON 文件"""
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        items = data if isinstance(data, list) else data.get("entries", [])
        for item in items:
            entry = KnowledgeEntry.from_dict(item)
            self._entries.append(entry)

    def get_by_platform_category(self, platform: str, category: str = None) -> List[KnowledgeEntry]:
        """获取指定平台和品类的全部知识条目"""
        p = platform.lower()
        result = []
        for entry in self._entries:
            if entry.platform.lower() != p:
                continue
            if category and entry.category.lower() != category.lower():
                continue
            result.append(entry)
        return result

    def get_all(self) -> List[KnowledgeEntry]:
        """获取全部知识条目"""
        return list(self._entries)

    def add(self, entry: KnowledgeEntry):
        """添加知识条目"""
        self._entries.append(entry)

    def remove(self, entry_id: str):
        """按 ID 移除知识条目"""
        self._entries = [e for e in self._entries if e.id != entry_id]

    def export(self, platform: str, category: str, output_dir: str = None):
        """导出指定平台×品类的条目到 JSON 文件"""
        target_dir = output_dir or self._knowledge_dir
        entries = self.get_by_platform_category(platform, category)
        file_path = os.path.join(target_dir, platform, f"{category}.json")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump([e.to_dict() for e in entries], f, ensure_ascii=False, indent=2)
