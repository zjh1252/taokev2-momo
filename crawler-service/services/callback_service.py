import logging
from typing import List, Dict, Any

import httpx

from config import CALLBACK_URL, CALLBACK_TOKEN, CALLBACK_BATCH_SIZE

logger = logging.getLogger(__name__)


class CallbackService:
    """Webhook 回调 Java 后端服务。"""

    def __init__(self, callback_url: str = None, callback_token: str = None):
        self.callback_url = callback_url or CALLBACK_URL
        self.callback_token = callback_token or CALLBACK_TOKEN
        self._buffer: List[Dict[str, Any]] = []

    def buffer_item(self, item: Dict[str, Any]):
        """将爬取结果加入缓冲区，满一批则发送。"""
        self._buffer.append(item)
        if len(self._buffer) >= CALLBACK_BATCH_SIZE:
            return self._flush()
        return None

    def _flush(self) -> List[Dict[str, Any]]:
        """发送缓冲区中的数据。"""
        if not self._buffer:
            return []
        batch = self._buffer.copy()
        self._buffer.clear()
        return batch

    async def send_batch(self, job_id: str, items: List[Dict[str, Any]]):
        """批量回传爬取结果。"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.callback_url,
                json={
                    "job_id": job_id,
                    "event": "batch",
                    "items": items,
                },
                headers={"X-Crawler-Token": self.callback_token},
                timeout=30,
            )
            logger.info(f"回调 batch: job_id={job_id}, items={len(items)}, status={resp.status_code}")

    async def notify_progress(
        self,
        job_id: str,
        total: int = 0,
        processed: int = 0,
        message: str = "",
        error_count: int = 0,
    ):
        """通知任务进度。"""
        async with httpx.AsyncClient() as client:
            await client.post(
                self.callback_url,
                json={
                    "job_id": job_id,
                    "event": "progress",
                    "total": total,
                    "processed": processed,
                    "error_count": error_count,
                    "message": message,
                },
                headers={"X-Crawler-Token": self.callback_token},
                timeout=30,
            )
            logger.info(
                "回调 progress: job_id=%s, processed=%s, total=%s",
                job_id,
                processed,
                total,
            )

    async def send_remaining(self, job_id: str):
        """发送缓冲区剩余数据。"""
        remaining = self._flush()
        if remaining:
            await self.send_batch(job_id, remaining)

    async def notify_complete(self, job_id: str, total: int, processed: int = None, message: str = "爬取完成"):
        """通知任务完成。"""
        async with httpx.AsyncClient() as client:
            await client.post(
                self.callback_url,
                json={
                    "job_id": job_id,
                    "event": "complete",
                    "total": total,
                    "processed": processed if processed is not None else total,
                    "message": message,
                },
                headers={"X-Crawler-Token": self.callback_token},
                timeout=30,
            )
            logger.info(f"回调 complete: job_id={job_id}, total={total}")

    async def notify_error(self, job_id: str, error: str, processed: int = 0, total: int = 0):
        """通知任务失败。"""
        async with httpx.AsyncClient() as client:
            await client.post(
                self.callback_url,
                json={
                    "job_id": job_id,
                    "event": "error",
                    "error": error,
                    "processed": processed,
                    "total": total,
                    "message": "爬取失败",
                },
                headers={"X-Crawler-Token": self.callback_token},
                timeout=30,
            )
            logger.error(f"回调 error: job_id={job_id}, error={error}")
