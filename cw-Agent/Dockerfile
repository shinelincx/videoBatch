FROM python:3.12-slim

WORKDIR /app

# 安装系统依赖（edge-tts 需要，通常 slim 镜像已自带）
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY main.py .
COPY cli.py .
COPY app/ ./app/
COPY static/ ./static/
COPY knowledge/ ./knowledge/

# 创建 output 目录
RUN mkdir -p output

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["python", "main.py"]
