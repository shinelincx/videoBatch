from app.skills.base import CopySkill, SkillRegistry, SkillMatchResult


class SkillManager:
    """Skill 管理器：统一管理所有 Skill 的注册、路由和 Prompt 导出"""

    _instance = None  # 单例

    def __init__(self):
        self.registry = SkillRegistry()

    @classmethod
    def get_instance(cls) -> "SkillManager":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._init_skills()
        return cls._instance

    def _init_skills(self):
        """加载所有 Skill 定义并注册"""
        from app.skills.definitions.douyin import DOUYIN_SKILLS
        from app.skills.definitions.xiaohongshu import XIAOHONGSHU_SKILLS
        from app.skills.definitions.taobao import TAOBAO_SKILLS
        from app.skills.definitions.tiktok import TIKTOK_SKILLS
        from app.skills.definitions.amazon import AMAZON_SKILLS
        from app.skills.definitions.default import DEFAULT_SKILLS

        self.registry.register_all(DOUYIN_SKILLS)
        self.registry.register_all(XIAOHONGSHU_SKILLS)
        self.registry.register_all(TAOBAO_SKILLS)
        self.registry.register_all(TIKTOK_SKILLS)
        self.registry.register_all(AMAZON_SKILLS)
        self.registry.register_all(DEFAULT_SKILLS)

    def match_skill(self, platform: str, category: str) -> SkillMatchResult:
        """根据平台和品类匹配最佳 Skill"""
        return self.registry.match(platform, category)

    def resolve_prompt_template(self, platform: str, category: str) -> tuple:
        """
        获取匹配的 Skill 和其 prompt_template

        Returns:
            (skill, prompt_template_str)
        """
        result = self.match_skill(platform, category)
        return result.skill, result.skill.prompt_template

    def list_skills(self) -> list:
        """列出所有已注册的 Skill 名称"""
        return [(s.name, s.description) for s in self.registry.list_all()]

    def get_skill(self, name: str) -> CopySkill:
        """按名称获取 Skill"""
        skill = self.registry.get_by_name(name)
        if skill is None:
            raise ValueError(f"Skill not found: {name}")
        return skill
