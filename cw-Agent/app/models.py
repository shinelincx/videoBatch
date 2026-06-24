from pydantic import BaseModel, Field
from typing import List, Optional


class ProductInput(BaseModel):
    category: str = Field(..., min_length=1, description="产品品类")
    title: str = Field(..., min_length=1, description="产品标题")
    selling_points: List[str] = Field(..., min_length=1, description="核心卖点列表")
    duration: int = Field(default=30, gt=0, description="目标文案时长（秒）")
    platform: str = Field(default="抖音", description="投放平台")
    tone: str = Field(default="简洁", description="文案风格")
    language: str = Field(default="zh", description="输出语言")
    voice: str = Field(default="", description="TTS 音色 ShortName，为空则使用语种默认音色")
    tags: Optional[List[str]] = Field(default=None, description="产品标签，用于知识库检索增强")


class CopyOnlyInput(BaseModel):
    category: str = Field(..., min_length=1, description="产品品类")
    title: str = Field(..., min_length=1, description="产品标题")
    selling_points: List[str] = Field(..., min_length=1, description="核心卖点列表")
    duration: int = Field(default=30, gt=0, description="目标文案时长（秒），仅用于字数控制")
    platform: str = Field(default="抖音", description="投放平台")
    language: str = Field(default="zh", description="输出语言")
    tags: Optional[List[str]] = Field(default=None, description="产品标签，用于知识库检索增强")

    def to_product_input(self) -> ProductInput:
        return ProductInput(
            category=self.category,
            title=self.title,
            selling_points=self.selling_points,
            duration=self.duration,
            platform=self.platform,
            tone="简洁",
            language=self.language,
            voice="",
            tags=self.tags,
        )


class MarketingCopy(BaseModel):
    title: str = Field(default="", description="文案标题")
    tags: List[str] = Field(default_factory=list, description="文案标签")
    text: str = Field(..., description="生成的营销文案正文")
    word_count: int = Field(..., description="字数/词数")
    estimated_duration: float = Field(..., description="预估朗读时长（秒）")


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(default=0, description="提示词 token 数")
    completion_tokens: int = Field(default=0, description="输出 token 数")
    total_tokens: int = Field(default=0, description="总 token 数")
    attempts: int = Field(default=0, description="本次文案生成 LLM 调用次数")
    model: str = Field(default="", description="LLM 模型名称")


class AudioOutput(BaseModel):
    file_path: str = Field(..., description="音频文件路径")
    format: str = Field(default="mp3", description="音频格式")
    duration: float = Field(..., description="实际音频时长（秒）")
    download_url: Optional[str] = Field(default=None, description="第三方系统下载链接")


class SubtitleEntry(BaseModel):
    index: int = Field(..., description="字幕序号（从1开始）")
    start_time: str = Field(..., description="起始时间 HH:MM:SS,mmm")
    end_time: str = Field(..., description="结束时间 HH:MM:SS,mmm")
    text: str = Field(..., description="字幕文本内容")


class SubtitleOutput(BaseModel):
    srt_file_path: str = Field(..., description="SRT 文件路径")
    entries: List[SubtitleEntry] = Field(default_factory=list, description="字幕条目列表")
    download_url: Optional[str] = Field(default=None, description="第三方系统下载链接")


class AgentResponse(BaseModel):
    input: ProductInput
    marketing_copy: MarketingCopy
    audio: AudioOutput
    subtitle: SubtitleOutput
    image_keywords: Optional[List[str]] = Field(default=None, description="Image-derived keywords")
    skill_info: Optional[dict] = Field(default=None, description="Skill 匹配信息")
    knowledge_refs: Optional[List[dict]] = Field(default=None, description="知识库引用摘要列表")


class CopyOnlyResponse(BaseModel):
    input: CopyOnlyInput
    marketing_copy: MarketingCopy
    skill_info: Optional[dict] = Field(default=None, description="Skill 匹配信息")
    token_usage: TokenUsage
    image_keywords: Optional[List[str]] = Field(default=None, description="Image-derived keywords")
