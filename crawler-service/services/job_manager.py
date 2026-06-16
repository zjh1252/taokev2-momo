import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

from models.schemas import CrawlJobRequest, CrawlJobStatus
from services.callback_service import CallbackService
from crawlers.base import BaseCrawler

logger = logging.getLogger(__name__)


class JobManager:
    """爬取任务管理器。"""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._spider_registry = self._build_registry()

    def _build_registry(self) -> Dict[str, type]:
        """注册所有可用的爬虫。"""
        from crawlers.jiangshibao_course import JiangshiBaoCourseSpider
        from crawlers.jiangshibao_trainer import JiangshiBaoTrainerSpider
        from crawlers.huashijingji_course import HuashiJingjiCourseSpider
        from crawlers.huashijingji_trainer import HuashiJingjiTrainerSpider
        from crawlers.lmschina_course import LmschinaCourseSpider
        from crawlers.lmschina_trainer import LmschinaTrainerSpider
        from crawlers.nlypx_course import NlypxCourseSpider
        from crawlers.nlypx_trainer import NlypxTrainerSpider
        from crawlers.zpedu_course import ZpeduCourseSpider
        from crawlers.zpedu_trainer import ZpeduTrainerSpider
        from crawlers.jiangshitai_course import JiangshitaiCourseSpider
        from crawlers.jiangshitai_trainer import JiangshitaiTrainerSpider
        from crawlers.peixun_trainer import PeixunTrainerSpider

        return {
            "jiangshibao_trainer": JiangshiBaoTrainerSpider,
            "jiangshibao_course": JiangshiBaoCourseSpider,
            "lmschina_trainer": LmschinaTrainerSpider,
            "lmschina_course": LmschinaCourseSpider,
            "huashijingji_trainer": HuashiJingjiTrainerSpider,
            "huashijingji_course": HuashiJingjiCourseSpider,
            "nlypx_trainer": NlypxTrainerSpider,
            "nlypx_course": NlypxCourseSpider,
            "zpedu_trainer": ZpeduTrainerSpider,
            "zpedu_course": ZpeduCourseSpider,
            "jiangshitai_trainer": JiangshitaiTrainerSpider,
            "jiangshitai_course": JiangshitaiCourseSpider,
            "peixun_trainer": PeixunTrainerSpider,
        }

    def get_available_sources(self) -> List[Dict[str, str]]:
        """返回所有可用数据源。"""
        return [
            {
                "code": "jiangshibao",
                "name": "讲师宝",
                "url": "https://www.jiangshi99.com",
                "data_type": "TRAINER",
            },
            {
                "code": "jiangshibao",
                "name": "讲师宝",
                "url": "https://www.jiangshi99.com",
                "data_type": "COURSE",
            },
            {
                "code": "lmschina",
                "name": "企学宝",
                "url": "https://www.lmschina.net",
                "data_type": "TRAINER",
            },
            {
                "code": "lmschina",
                "name": "企学宝",
                "url": "https://www.lmschina.net",
                "data_type": "COURSE",
            },
            {
                "code": "huashijingji",
                "name": "华师经纪",
                "url": "https://www.huashijingji.com",
                "data_type": "TRAINER",
            },
            {
                "code": "huashijingji",
                "name": "华师经纪",
                "url": "https://www.huashijingji.com",
                "data_type": "COURSE",
            },
            {
                "code": "nlypx",
                "name": "哪里有培训网",
                "url": "https://www.nlypx.com",
                "data_type": "TRAINER",
            },
            {
                "code": "nlypx",
                "name": "哪里有培训网",
                "url": "https://www.nlypx.com",
                "data_type": "COURSE",
            },
            {
                "code": "zpedu",
                "name": "中培伟业",
                "url": "https://www.zpedu.com",
                "data_type": "TRAINER",
            },
            {
                "code": "zpedu",
                "name": "中培伟业",
                "url": "https://www.zpedu.com",
                "data_type": "COURSE",
            },
            {
                "code": "jiangshitai",
                "name": "讲师台",
                "url": "https://www.jiangshitai.com",
                "data_type": "TRAINER",
            },
            {
                "code": "jiangshitai",
                "name": "讲师台",
                "url": "https://www.jiangshitai.com",
                "data_type": "COURSE",
            },
        ]

    def _spider_key(self, source: str, data_type: str) -> str:
        return f"{source}_{data_type.lower()}"

    def create_job(self, request: CrawlJobRequest) -> str:
        """创建爬取任务。"""
        spider_key = self._spider_key(request.source, request.data_type)
        if spider_key not in self._spider_registry:
            raise ValueError(
                f"未找到爬虫: {spider_key}，请先在 crawler-service 中实现并注册对应爬虫"
            )

        job_id = str(uuid.uuid4())[:8]
        self._jobs[job_id] = {
            "id": job_id,
            "source": request.source,
            "data_type": request.data_type,
            "status": "pending",
            "callback_url": request.callback_url,
            "callback_token": request.callback_token,
            "max_items": request.max_items,
            "start_url": request.start_url,
            "items": [],
            "expected_total": request.max_items or 0,
            "error_count": 0,
            "error": None,
            "created_at": datetime.now(),
        }
        logger.info(f"创建任务: job_id={job_id}, source={request.source}, type={request.data_type}")
        return job_id

    def get_job_status(self, job_id: str) -> CrawlJobStatus:
        """查询任务状态。"""
        job = self._jobs.get(job_id)
        if not job:
            raise KeyError(f"任务不存在: {job_id}")
        return CrawlJobStatus(
            job_id=job_id,
            source=job["source"],
            data_type=job["data_type"],
            status=job["status"],
            total_items=len(job["items"]),
            error=job.get("error"),
        )

    def cancel_job(self, job_id: str):
        """取消任务。"""
        job = self._jobs.get(job_id)
        if not job:
            raise KeyError(f"任务不存在: {job_id}")
        if job["status"] != "running":
            raise ValueError("只能取消运行中的任务")
        job["status"] = "cancelled"
        logger.info(f"取消任务: job_id={job_id}")

    async def run_job(self, job_id: str):
        """执行爬取任务（后台运行）。"""
        job = self._jobs[job_id]
        job["status"] = "running"

        callback = CallbackService(
            callback_url=job.get("callback_url"),
            callback_token=job.get("callback_token"),
        )

        spider_key = self._spider_key(job["source"], job["data_type"])
        SpiderClass = self._spider_registry.get(spider_key)
        if not SpiderClass:
            job["status"] = "failed"
            job["error"] = f"未找到爬虫: {spider_key}"
            logger.error(f"未找到爬虫: {spider_key}")
            await callback.notify_error(job_id, job["error"])
            return

        try:
            spider = SpiderClass()
            if job.get("max_items"):
                spider.max_items = job["max_items"]

            expected_total = job.get("expected_total") or 0
            await callback.notify_progress(
                job_id,
                total=expected_total,
                processed=0,
                message="任务已启动，正在发现数据" if expected_total == 0 else f"任务已启动，计划爬取 {expected_total} 条",
            )

            # 使用 stream 模式实时获取结果
            batch_buffer = []
            async for item in spider.stream():
                if job["status"] == "cancelled":
                    spider.pause()
                    break

                job["items"].append(item)
                batch_buffer.append(item)

                # 每 N 条回调一次
                if len(batch_buffer) >= 10:
                    await callback.send_batch(job_id, batch_buffer)
                    await callback.notify_progress(
                        job_id,
                        total=expected_total or len(job["items"]),
                        processed=len(job["items"]),
                        message=f"已抓取 {len(job['items'])} 条",
                        error_count=job.get("error_count", 0),
                    )
                    batch_buffer.clear()

            # 发送剩余数据
            if batch_buffer:
                await callback.send_batch(job_id, batch_buffer)
                await callback.notify_progress(
                    job_id,
                    total=expected_total or len(job["items"]),
                    processed=len(job["items"]),
                    message=f"已抓取 {len(job['items'])} 条",
                    error_count=job.get("error_count", 0),
                )

            if job["status"] != "cancelled":
                job["status"] = "completed"
                total = expected_total or len(job["items"])
                await callback.notify_complete(
                    job_id,
                    total,
                    processed=len(job["items"]),
                    message=f"爬取完成，共抓取 {len(job['items'])} 条",
                )
                logger.info(f"任务完成: job_id={job_id}, total={len(job['items'])}")

        except Exception as e:
            job["status"] = "failed"
            job["error"] = str(e)
            logger.exception(f"任务失败: job_id={job_id}")
            await callback.notify_error(
                job_id,
                str(e),
                processed=len(job.get("items", [])),
                total=job.get("expected_total") or len(job.get("items", [])),
            )
