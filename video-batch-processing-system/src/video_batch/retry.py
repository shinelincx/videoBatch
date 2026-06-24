"""网络重试机制 - 为网络操作提供统一的带重试执行器。

提供 with_retry 工具函数，封装常见的重试逻辑：
  - 默认最多重试 3 次
  - 每次失败后等待 1 秒
  - 所有重试失败后抛出 NetworkError 异常

使用示例:
    result = with_retry(lambda: http.get(url), max_retries=3)
"""
import time
from typing import Any, Callable


class NetworkError(Exception):
    """网络异常，所有重试都失败后抛出。"""
    pass


def with_retry(func: Callable[[], Any], max_retries: int = 3) -> Any:
    """执行带重试的函数。

    尝试执行传入的函数，如果抛出异常则等待 1 秒后重试。
    最多重试 max_retries 次，全部失败后抛出 NetworkError。

    参数:
        func: 要执行的无参函数（如 lambda 或方法）
        max_retries: 最大重试次数（默认 3 次）
    返回:
        函数成功执行的返回值
    抛出:
        NetworkError: 所有重试都失败后抛出，包含最后一次异常的信息
    """
    last_error: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            return func()
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                # 不是最后一次尝试，等待后重试
                time.sleep(1)

    raise NetworkError(str(last_error)) from last_error