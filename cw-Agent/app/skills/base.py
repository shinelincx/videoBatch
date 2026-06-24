from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum


class MatchType(Enum):
    EXACT = "exact"
    PLATFORM_FALLBACK = "platform_fallback"
    DEFAULT = "default"


@dataclass
class ExecutionStep:
    """单个执行步骤定义"""
    order: int
    name: str
    description: str
    action: str


@dataclass
class QualityStandard:
    """文案质量标准"""
    opening_3s_rule: str = ""
    cta_presence: str = ""
    forbidden_words: List[str] = field(default_factory=list)
    max_chars_per_sentence: int = 0
    tone_keywords: List[str] = field(default_factory=list)
    min_content_ratio: float = 0.85
    max_content_ratio: float = 1.15
    additional_rules: List[str] = field(default_factory=list)


@dataclass
class ToolSpec:
    """可用工具说明"""
    tool_name: str
    description: str
    usage: str = ""


@dataclass
class CopySkill:
    """单个平台的品类文案 Skill 定义"""
    name: str
    platforms: List[str]
    categories: List[str]
    description: str
    execution_steps: List[ExecutionStep] = field(default_factory=list)
    quality_standards: QualityStandard = field(default_factory=QualityStandard)
    tools: List[ToolSpec] = field(default_factory=list)
    prompt_template: str = ""

    def format_steps(self) -> str:
        """格式化执行步骤为提示词文本"""
        lines = []
        for step in sorted(self.execution_steps, key=lambda s: s.order):
            lines.append(
                f"Step {step.order} - {step.name}：{step.action}"
            )
        return "\n".join(lines)

    def format_quality(self) -> str:
        """格式化质量标准为提示词文本"""
        parts = []
        q = self.quality_standards
        if q.opening_3s_rule:
            parts.append(f"- 开头规则：{q.opening_3s_rule}")
        if q.cta_presence:
            parts.append(f"- CTA 要求：{q.cta_presence}")
        if q.forbidden_words:
            parts.append(f"- 禁用词：{'、'.join(q.forbidden_words)}")
        if q.max_chars_per_sentence:
            parts.append(f"- 单句最长 {q.max_chars_per_sentence} 字")
        if q.tone_keywords:
            parts.append(f"- 语气关键词：{'、'.join(q.tone_keywords)}")
        if q.additional_rules:
            for rule in q.additional_rules:
                parts.append(f"- {rule}")
        return "\n".join(parts)


@dataclass
class SkillMatchResult:
    """Skill 匹配结果"""
    skill: CopySkill
    match_type: MatchType
    matched_by: str = ""


class SkillRegistry:
    """Skill 注册表：存储所有已注册的 Skill"""

    def __init__(self):
        self._skills: List[CopySkill] = []

    def register(self, skill: CopySkill):
        """注册一个 Skill"""
        self._skills.append(skill)

    def register_all(self, skills: List[CopySkill]):
        """批量注册 Skill"""
        for skill in skills:
            self.register(skill)

    def match(self, platform: str, category: str) -> SkillMatchResult:
        """
        按 platform + category 匹配最佳 Skill

        匹配策略：
          1. 精确匹配 platform + category
          2. 降级：匹配 platform + 任意 category 的通用 platform skill（categories 包含 "通用"）
          3. 降级：匹配 platform + 任意 category 的 skill
          4. 兜底：返回 DefaultSkill
        """
        p = platform.lower()
        c = category.lower()

        # 1. 精确匹配
        for skill in self._skills:
            if p in [x.lower() for x in skill.platforms] and c in [x.lower() for x in skill.categories]:
                return SkillMatchResult(
                    skill=skill,
                    match_type=MatchType.EXACT,
                    matched_by=f"platform={platform}, category={category}"
                )

        # 2. 平台通用 Skill（categories 含 "通用"）
        for skill in self._skills:
            if p in [x.lower() for x in skill.platforms] and "通用" in skill.categories:
                return SkillMatchResult(
                    skill=skill,
                    match_type=MatchType.PLATFORM_FALLBACK,
                    matched_by=f"platform={platform}, category=通用"
                )

        # 3. 匹配 platform 的任意 skill
        for skill in self._skills:
            if p in [x.lower() for x in skill.platforms]:
                return SkillMatchResult(
                    skill=skill,
                    match_type=MatchType.PLATFORM_FALLBACK,
                    matched_by=f"platform={platform}, first_match"
                )

        # 4. 兜底
        for skill in self._skills:
            if skill.name.startswith("default") or skill.name == "通用_通用_基础":
                return SkillMatchResult(
                    skill=skill,
                    match_type=MatchType.DEFAULT,
                    matched_by="default"
                )

        # 5. 极端兜底：返回第一个注册的 Skill
        if self._skills:
            return SkillMatchResult(
                skill=self._skills[0],
                match_type=MatchType.DEFAULT,
                matched_by="first_skill"
            )

        raise ValueError(f"No skills registered and no match found for platform={platform}, category={category}")

    def list_all(self) -> List[CopySkill]:
        """列出所有已注册的 Skill"""
        return list(self._skills)

    def get_by_name(self, name: str) -> Optional[CopySkill]:
        """按名称查找 Skill"""
        for skill in self._skills:
            if skill.name == name:
                return skill
        return None
