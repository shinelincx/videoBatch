import os
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

KNOWLEDGE_DIR = os.environ.get("KNOWLEDGE_DIR", "knowledge")
DEFAULT_SKILL = os.environ.get("DEFAULT_SKILL", "通用_通用_基础")
ENABLE_KNOWLEDGE = os.environ.get("ENABLE_KNOWLEDGE", "true").lower() == "true"
MAX_KNOWLEDGE_REFS = int(os.environ.get("MAX_KNOWLEDGE_REFS", "3"))
ENABLE_TREND_KNOWLEDGE = os.environ.get("ENABLE_TREND_KNOWLEDGE", "true").lower() == "true"
TREND_DB_PATH = os.environ.get("TREND_DB_PATH", "data/trends.sqlite3")
MAX_TREND_REFS = int(os.environ.get("MAX_TREND_REFS", "3"))
TREND_API_TOKEN = os.environ.get("TREND_API_TOKEN", "")

LANGUAGE_VOICE_MAP = {
    "zh": "zh-CN-XiaoxiaoNeural", "en": "en-US-JennyNeural",
    "ja": "ja-JP-NanamiNeural", "ko": "ko-KR-SunHiNeural",
    "th": "th-TH-NiwatNeural", "vi": "vi-VN-HoaiMyNeural",
    "id": "id-ID-GadisNeural", "ms": "ms-MY-YasminNeural",
    "fil": "fil-PH-BlessicaNeural", "my": "my-MM-NilarNeural",
    "km": "km-KH-SreymomNeural", "lo": "lo-LA-KeomanyNeural",
}

LANGUAGE_SPEED_MAP = {
    "zh": 4, "en": 3, "ja": 5, "ko": 4,
    "th": 4, "vi": 3, "id": 3, "ms": 3,
    "fil": 3, "my": 4, "km": 4, "lo": 4,
}

LANGUAGE_LABELS = {
    "zh": "简体中文", "en": "English", "ja": "日本語", "ko": "한국어",
    "th": "ไทย", "vi": "Tiếng Việt", "id": "Bahasa Indonesia",
    "ms": "Bahasa Melayu", "fil": "Filipino",
    "my": "မြန်မာဘာသာ", "km": "ភាសាខ្មែរ", "lo": "ລາວ",
}

LANGUAGE_VOICE_OPTIONS = {
    "zh": [
        {"value": "zh-CN-XiaoxiaoNeural", "label": "晓晓（女·普通话）"},
        {"value": "zh-CN-YunxiNeural", "label": "云希（男·普通话）"},
        {"value": "zh-CN-YunjianNeural", "label": "云健（男·普通话）"},
        {"value": "zh-CN-XiaoyiNeural", "label": "晓伊（女·普通话）"},
        {"value": "zh-CN-YunyangNeural", "label": "云扬（男·普通话）"},
        {"value": "zh-CN-XiaochenNeural", "label": "晓辰（女·普通话）"},
        {"value": "zh-CN-XiaohanNeural", "label": "晓涵（女·普通话）"},
        {"value": "zh-CN-XiaomengNeural", "label": "晓梦（女·普通话）"},
        {"value": "zh-CN-XiaomoNeural", "label": "晓墨（女·普通话）"},
        {"value": "zh-CN-XiaoqiuNeural", "label": "晓秋（女·普通话）"},
        {"value": "zh-CN-XiaoruiNeural", "label": "晓睿（女·普通话）"},
        {"value": "zh-CN-XiaoshuangNeural", "label": "晓双（女·普通话）"},
        {"value": "zh-CN-XiaoxuanNeural", "label": "晓萱（女·普通话）"},
        {"value": "zh-CN-XiaoyanNeural", "label": "晓颜（女·普通话）"},
        {"value": "zh-CN-XiaozhenNeural", "label": "晓臻（女·普通话）"},
        {"value": "zh-CN-YunfengNeural", "label": "云枫（男·普通话）"},
        {"value": "zh-CN-YunhaoNeural", "label": "云皓（男·普通话）"},
        {"value": "zh-CN-YunxiaNeural", "label": "云夏（女·普通话）"},
        {"value": "zh-CN-YunyeNeural", "label": "云野（男·普通话）"},
        {"value": "zh-CN-YunzeNeural", "label": "云泽（男·普通话）"},
        {"value": "zh-CN-shaanxi-XiaoniNeural", "label": "小妮（女·陕西话）"},
        {"value": "zh-CN-liaoning-XiaobeiNeural", "label": "小北（女·东北话）"},
        {"value": "zh-HK-HiuGaaiNeural", "label": "曉佳（女·粤语）"},
        {"value": "zh-HK-HiuMaanNeural", "label": "曉曼（女·粤语）"},
        {"value": "zh-HK-WanLungNeural", "label": "雲龍（男·粤语）"},
        {"value": "zh-TW-HsiaoChenNeural", "label": "曉臻（女·台湾国语）"},
        {"value": "zh-TW-HsiaoYuNeural", "label": "曉雨（女·台湾国语）"},
        {"value": "zh-TW-YunJheNeural", "label": "雲哲（男·台湾国语）"},
    ],
    "en": [
        {"value": "en-US-JennyNeural", "label": "Jenny（女·美式）"},
        {"value": "en-US-AriaNeural", "label": "Aria（女·美式）"},
        {"value": "en-US-GuyNeural", "label": "Guy（男·美式）"},
        {"value": "en-US-SteffanNeural", "label": "Steffan（男·美式）"},
        {"value": "en-US-AnaNeural", "label": "Ana（女·美式）"},
        {"value": "en-US-AndrewNeural", "label": "Andrew（男·美式）"},
        {"value": "en-US-AvaNeural", "label": "Ava（女·美式）"},
        {"value": "en-US-BrianNeural", "label": "Brian（男·美式）"},
        {"value": "en-US-ChristopherNeural", "label": "Christopher（男·美式）"},
        {"value": "en-US-EmmaNeural", "label": "Emma（女·美式）"},
        {"value": "en-US-EricNeural", "label": "Eric（男·美式）"},
        {"value": "en-US-MichelleNeural", "label": "Michelle（女·美式）"},
        {"value": "en-US-RogerNeural", "label": "Roger（男·美式）"},
        {"value": "en-GB-SoniaNeural", "label": "Sonia（女·英式）"},
        {"value": "en-GB-RyanNeural", "label": "Ryan（男·英式）"},
        {"value": "en-GB-LibbyNeural", "label": "Libby（女·英式）"},
        {"value": "en-GB-MaisieNeural", "label": "Maisie（女·英式）"},
        {"value": "en-GB-ThomasNeural", "label": "Thomas（男·英式）"},
        {"value": "en-GB-EthanNeural", "label": "Ethan（男·英式）"},
        {"value": "en-GB-OliverNeural", "label": "Oliver（男·英式）"},
        {"value": "en-GB-BellaNeural", "label": "Bella（女·英式）"},
        {"value": "en-GB-MiaNeural", "label": "Mia（女·英式）"},
        {"value": "en-GB-HollieNeural", "label": "Hollie（女·英式）"},
        {"value": "en-AU-NatashaNeural", "label": "Natasha（女·澳式）"},
        {"value": "en-AU-WilliamNeural", "label": "William（男·澳式）"},
        {"value": "en-AU-AnnetteNeural", "label": "Annette（女·澳式）"},
        {"value": "en-AU-CarlyNeural", "label": "Carly（女·澳式）"},
        {"value": "en-AU-DarrenNeural", "label": "Darren（男·澳式）"},
        {"value": "en-AU-DuncanNeural", "label": "Duncan（男·澳式）"},
        {"value": "en-AU-ElsieNeural", "label": "Elsie（女·澳式）"},
        {"value": "en-AU-FreyaNeural", "label": "Freya（女·澳式）"},
        {"value": "en-AU-JoanneNeural", "label": "Joanne（女·澳式）"},
        {"value": "en-AU-KenNeural", "label": "Ken（男·澳式）"},
        {"value": "en-AU-KimNeural", "label": "Kim（女·澳式）"},
        {"value": "en-AU-NeilNeural", "label": "Neil（男·澳式）"},
        {"value": "en-AU-TimNeural", "label": "Tim（男·澳式）"},
        {"value": "en-AU-TinaNeural", "label": "Tina（女·澳式）"},
        {"value": "en-CA-ClaraNeural", "label": "Clara（女·加拿大）"},
        {"value": "en-CA-LiamNeural", "label": "Liam（男·加拿大）"},
        {"value": "en-IN-NeerjaNeural", "label": "Neerja（女·印度）"},
        {"value": "en-IN-PrabhatNeural", "label": "Prabhat（男·印度）"},
        {"value": "en-IE-EmilyNeural", "label": "Emily（女·爱尔兰）"},
        {"value": "en-IE-ConnorNeural", "label": "Connor（男·爱尔兰）"},
    ],
    "ja": [
        {"value": "ja-JP-NanamiNeural", "label": "奈々み（女）"},
        {"value": "ja-JP-KeitaNeural", "label": "慶太（男）"},
    ],
    "ko": [
        {"value": "ko-KR-SunHiNeural", "label": "선희（女）"},
        {"value": "ko-KR-InJoonNeural", "label": "인준（男）"},
    ],
    "th": [
        {"value": "th-TH-NiwatNeural", "label": "Niwat（男）"},
    ],
    "vi": [
        {"value": "vi-VN-HoaiMyNeural", "label": "HoaiMy（女）"},
        {"value": "vi-VN-NamMinhNeural", "label": "NamMinh（男）"},
    ],
    "id": [
        {"value": "id-ID-GadisNeural", "label": "Gadis（女）"},
        {"value": "id-ID-ArdiNeural", "label": "Ardi（男）"},
    ],
    "ms": [
        {"value": "ms-MY-YasminNeural", "label": "Yasmin（女）"},
        {"value": "ms-MY-OsmanNeural", "label": "Osman（男）"},
    ],
    "fil": [
        {"value": "fil-PH-BlessicaNeural", "label": "Blessica（女）"},
        {"value": "fil-PH-AngeloNeural", "label": "Angelo（男）"},
    ],
    "my": [
        {"value": "my-MM-NilarNeural", "label": "Nilar（女）"},
        {"value": "my-MM-ThihaNeural", "label": "Thiha（男）"},
    ],
    "km": [
        {"value": "km-KH-SreymomNeural", "label": "Sreymom（女）"},
        {"value": "km-KH-PisethNeural", "label": "Piseth（男）"},
    ],
    "lo": [
        {"value": "lo-LA-KeomanyNeural", "label": "Keomany（女）"},
        {"value": "lo-LA-ChanthavongNeural", "label": "Chanthavong（男）"},
    ],
}

LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
VISION_LLM_API_KEY = os.environ.get("VISION_LLM_API_KEY", "")
VISION_LLM_BASE_URL = os.environ.get("VISION_LLM_BASE_URL", "")
VISION_LLM_MODEL = os.environ.get("VISION_LLM_MODEL", "")
TTS_PROVIDER = os.environ.get("TTS_PROVIDER", "edge_tts")
DEFAULT_LANGUAGE = os.environ.get("DEFAULT_LANGUAGE", "zh")
EMOTION_ENABLED = os.environ.get("EMOTION_ENABLED", "true").lower() == "true"

# 授权配置
AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "false").lower() == "true"
TOKEN_FILE = os.environ.get("TOKEN_FILE", "tokens.json")

# Aliyun OSS storage for generated audio/subtitle files
OSS_ENABLED = os.environ.get("OSS_ENABLED", "false").lower() == "true"
OSS_ACCESS_KEY_ID = os.environ.get("OSS_ACCESS_KEY_ID", "")
OSS_ACCESS_KEY_SECRET = os.environ.get("OSS_ACCESS_KEY_SECRET", "")
OSS_ENDPOINT = os.environ.get("OSS_ENDPOINT", "")
OSS_BUCKET_NAME = os.environ.get("OSS_BUCKET_NAME", "")
OSS_OBJECT_PREFIX = os.environ.get("OSS_OBJECT_PREFIX", "cw-agent")
OSS_PUBLIC_BASE_URL = os.environ.get("OSS_PUBLIC_BASE_URL", "")
OSS_SIGNED_URL_EXPIRES = int(os.environ.get("OSS_SIGNED_URL_EXPIRES", "86400"))


def get_tts_voice(language: str) -> str:
    return LANGUAGE_VOICE_MAP.get(language, "zh-CN-XiaoxiaoNeural")


def get_language_speed(language: str) -> int:
    return LANGUAGE_SPEED_MAP.get(language, 4)


def get_voice_options(language: str) -> list:
    return LANGUAGE_VOICE_OPTIONS.get(language, LANGUAGE_VOICE_OPTIONS["zh"])


def get_default_voice(language: str) -> str:
    return get_tts_voice(language)
