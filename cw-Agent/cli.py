import argparse
from app.models import ProductInput
from app.agent import generate_copy_sync
from app.tts import text_to_speech_sync
from app.subtitle import generate_srt
from app.cleanup import clean_old_outputs
from app.config import AUTH_ENABLED
from app.auth import validate_cli_token
import time, os, sys


def main():
    parser = argparse.ArgumentParser(description="电商文案智能体 - CLI 工具")
    parser.add_argument("-c", "--category", required=True, help="产品品类")
    parser.add_argument("-t", "--title", required=True, help="产品标题")
    parser.add_argument("-s", "--selling-points", required=True, help="核心卖点，逗号分隔")
    parser.add_argument("-d", "--duration", type=int, default=30, help="目标文案时长（秒）")
    parser.add_argument("-p", "--platform", default="抖音", help="投放平台")
    parser.add_argument("-o", "--tone", default="简洁", help="文案风格")
    parser.add_argument("-l", "--language", default="zh", help="输出语言")
    parser.add_argument("-v", "--voice", default="", help="TTS 音色 ShortName，为空则使用语种默认音色")
    parser.add_argument("--output-dir", default="./output", help="输出目录")
    parser.add_argument("--token", default=None, help="授权 token（也可通过 AUTH_TOKEN 环境变量设置）")

    args = parser.parse_args()

    # 认证校验
    if AUTH_ENABLED:
        token = args.token or os.environ.get("AUTH_TOKEN", "")
        if not token:
            print("错误: 认证已启用，请通过 --token 参数或 AUTH_TOKEN 环境变量提供 token", file=sys.stderr)
            sys.exit(1)
        if not validate_cli_token(token):
            print("错误: Token 无效或已禁用", file=sys.stderr)
            sys.exit(1)

    selling_points = [s.strip() for s in args.selling_points.split(",")]

    product_input = ProductInput(
        category=args.category,
        title=args.title,
        selling_points=selling_points,
        duration=args.duration,
        platform=args.platform,
        tone=args.tone,
        language=args.language,
        voice=args.voice,
    )

    try:
        print("正在生成文案...")
        copy = generate_copy_sync(product_input)

        print("=== 文案生成结果 ===")
        if copy.title:
            print(f"标题: {copy.title}")
        if copy.tags:
            print(f"标签: {', '.join(copy.tags)}")
        print(f"字数: {copy.word_count} | 预估时长: {copy.estimated_duration:.1f} 秒")
        print("----------------------------")
        print(copy.text)
        print("----------------------------")

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        output_dir = args.output_dir
        os.makedirs(output_dir, exist_ok=True)
        clean_old_outputs(output_dir)

        audio_path = os.path.join(output_dir, f"audio_{timestamp}.mp3")
        srt_path = os.path.join(output_dir, f"subtitle_{timestamp}.srt")

        audio_output, word_boundaries = text_to_speech_sync(copy.text, audio_path, product_input.language, product_input.voice)
        print(f"音频文件: {audio_path}")

        generate_srt(word_boundaries, srt_path, product_input.language)
        print(f"字幕文件: {srt_path}")
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
