import os

# Java 后端回调配置
CALLBACK_URL = os.getenv("CALLBACK_URL", "http://localhost:8080/internal/crawl/callback")
CALLBACK_TOKEN = os.getenv("CALLBACK_TOKEN", "default-token")

# 服务端口
SERVER_PORT = int(os.getenv("SERVER_PORT", "8100"))

# 爬虫默认配置
DEFAULT_DOWNLOAD_DELAY = 1.5  # 默认请求间隔（秒）
DEFAULT_CONCURRENT_REQUESTS = 2  # 默认并发数
DEFAULT_MAX_ITEMS = 100  # 默认最大爬取数量
CALLBACK_BATCH_SIZE = 10  # 每多少条回调一次
