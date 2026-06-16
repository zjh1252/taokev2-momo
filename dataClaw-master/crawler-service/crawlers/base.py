from datetime import datetime
from typing import Dict, Any, Optional

from scrapling.spiders import Spider, Response, Request
from scrapling.fetchers import FetcherSession


class BaseCrawler(Spider):
    """淘课网爬虫基类，封装通用逻辑。"""

    source: str = ""  # 数据源标识
    data_type: str = ""  # TRAINER / COURSE
    max_items: int = 100  # 单次最大爬取数量

    def __init__(self):
        super().__init__()
        self._seen_keys: set = set()
        self._item_count: int = 0

    def configure_sessions(self, manager):
        """使用 FetcherSession，支持反机器人。"""
        manager.add("default", FetcherSession())

    async def on_scraped_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """统一添加元数据字段 + 去重 + 数量限制。"""
        # 数量限制
        if self._item_count >= self.max_items:
            return None

        # 本地去重
        key = self._make_dedup_key(item)
        if key in self._seen_keys:
            return None
        self._seen_keys.add(key)

        # 添加元数据
        item["_source"] = self.source
        item["_data_type"] = self.data_type
        item["_crawled_at"] = datetime.now().isoformat()

        self._item_count += 1
        return item

    def _make_dedup_key(self, item: Dict[str, Any]) -> str:
        """生成去重 key"""
        if self.data_type == "TRAINER":
            return f"{self.source}:{item.get('source_trainer_id', '')}"
        else:
            return f"{self.source}:{item.get('source_course_id', '')}"

    async def is_blocked(self, response: Response) -> bool:
        """自定义封禁检测。"""
        if response.status in {403, 429, 503}:
            return True
        title = response.css("title::text").get("").lower()
        if "验证" in title or "captcha" in title:
            return True
        return False

    def clean_text(self, text: Optional[str]) -> str:
        """清理文本：去除首尾空白、多余换行。"""
        if not text:
            return ""
        return " ".join(text.strip().split())
