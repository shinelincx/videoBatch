"""
文案生成模块 - AI 文案与 TTS 语音合成

负责调用远程 API 生成文案文本，并使用 TTS（Text-to-Speech）服务
将文案转换为语音文件，用于视频配音。
"""

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from video_batch.logger import Logger


class CopywritingError(Exception):
    """文案生成异常"""
    pass


@dataclass
class CopywritingConfig:
    """文案生成配置"""
    enabled: bool = True   # 是否启用文案生成功能
    style: str = "正式"    # 文案风格（如幽默、正式、亲切、悬疑）


@dataclass
class CopywritingResult:
    """文案生成结果"""
    text: str              # 生成的文案文本
    audio_path: Path | None = None  # TTS 生成的语音文件路径


class CopywritingGenerator:
    """
    文案生成器

    通过 HTTP 接口调用远程文案生成服务和 TTS 语音合成服务，
    生成指定风格的文案文本及其对应的语音文件。
    """
    _DEFAULT_STYLES = {"幽默", "正式", "亲切", "悬疑"}

    def __init__(
        self,
        config: CopywritingConfig,          # 文案生成配置
        base_url: str,                       # 远程 API 基础 URL
        http_session,                        # HTTP 客户端会话
        temp_dir: Path,                      # 临时文件目录
        logger: "Logger | None" = None,      # 日志记录器
        supported_styles: set[str] | None = None, # 支持的文案风格集合
    ) -> None:
        self._config = config
        self._base_url = base_url
        self._http = http_session
        self._temp_dir = Path(temp_dir)
        self._logger = logger
        # 初始化支持的文案风格集合，使用默认值
        self._supported_styles = (
            supported_styles if supported_styles is not None
            else self._DEFAULT_STYLES
        )

    def generate(self, access_token: str) -> CopywritingResult:
        """
        执行文案生成流程

        依次调用文案生成 API 和 TTS API，最终返回文案文本和语音文件路径。

        参数:
            access_token: 认证访问令牌

        返回:
            CopywritingResult: 包含文案文本和语音文件路径的结果对象

        异常:
            CopywritingError: 文案生成或 TTS 失败时抛出
        """
        # 如果功能未启用，直接返回空结果
        if not self._config.enabled:
            if self._logger:
                self._logger.info(
                    task_id="copywriting",
                    module="文案生成",
                    message="文案生成未启用，跳过",
                )
            return CopywritingResult(text="", audio_path=None)

        # 构建认证请求头
        headers = {"Authorization": f"Bearer {access_token}"}

        # 第一步：生成文案文本
        text = self._generate_text(headers)

        # 第二步：调用 TTS 生成语音
        audio_bytes = self._generate_tts(text, headers)

        # 第三步：保存语音文件到本地
        audio_path = self._save_audio(audio_bytes)

        # 记录生成结果到日志
        if self._logger:
            self._logger.info(
                task_id="copywriting",
                module="文案生成",
                message="文案生成完成，风格: %s，长度: %d 字" % (
                    self._config.style, len(text),
                ),
            )

        return CopywritingResult(text=text, audio_path=audio_path)

    def cleanup(self, audio_path: Path) -> None:
        """
        清理生成的临时音频文件

        参数:
            audio_path: 待删除的音频文件路径
        """
        target = Path(audio_path)
        if target.exists():
            target.unlink()

    def _generate_text(self, headers: dict) -> str:
        """
        调用远程 API 生成文案文本

        参数:
            headers: HTTP 请求头（包含认证信息）

        返回:
            生成的文案文本

        异常:
            CopywritingError: 网络异常或 API 返回非 200 状态时抛出
        """
        try:
            resp = self._http.post(
                f"{self._base_url}/api/copywriting",
                json={"style": self._config.style},
                headers=headers,
            )
        except Exception as e:
            raise CopywritingError("文案生成接口异常: %s" % e)

        # 检查 HTTP 响应状态码
        if resp.status_code != 200:
            detail = resp.json().get("detail", "文案生成失败")
            raise CopywritingError("文案生成失败: %s" % detail)

        return resp.json()["text"]

    def _generate_tts(self, text: str, headers: dict) -> bytes:
        """
        调用远程 TTS API 将文本转换为语音

        参数:
            text: 待转换的文案文本
            headers: HTTP 请求头（包含认证信息）

        返回:
            语音文件的二进制数据

        异常:
            CopywritingError: 网络异常或 API 返回非 200 状态时抛出
        """
        try:
            resp = self._http.post(
                f"{self._base_url}/api/tts",
                json={"text": text},
                headers=headers,
            )
        except Exception as e:
            raise CopywritingError("音频生成接口异常: %s" % e)

        # 检查 HTTP 响应状态码
        if resp.status_code != 200:
            raise CopywritingError(
                "音频生成失败: HTTP %d" % resp.status_code
            )

        return resp.content

    def _save_audio(self, audio_bytes: bytes) -> Path:
        """
        将语音数据保存到本地临时文件

        参数:
            audio_bytes: 语音文件的二进制数据

        返回:
            保存后的音频文件路径
        """
        # 确保音频输出目录存在
        audio_dir = self._temp_dir / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        # 固定文件名输出
        audio_path = audio_dir / "tts_output.mp3"
        audio_path.write_bytes(audio_bytes)
        return audio_path
