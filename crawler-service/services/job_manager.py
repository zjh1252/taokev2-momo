import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

from models.schemas import CrawlJobRequest, CrawlJobStatus
from services.callback_service import CallbackService
from crawlers.base import BaseCrawler
from crawlers.course_utils import should_skip_expired_public_course

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
        from crawlers.shchance_course import ShchanceCourseSpider
        from crawlers.qiyingschool_course import QiyingSchoolCourseSpider
        from crawlers.champconsult_course import ChampconsultCourseSpider
        from crawlers.free863_course import Free863CourseSpider
        from crawlers.chinacpx_course import ChinacpxCourseSpider
        from crawlers.qgpx_course import QgpxCourseSpider
        from crawlers.gaopei_course import GaopeiCourseSpider
        from crawlers.vmta_course import VmtaCourseSpider
        from crawlers.hztbc_course import HztbcCourseSpider
        from crawlers.easyfinance_course import EasyFinanceCourseSpider
        from crawlers.jyqc_course import JyqcCourseSpider
        from crawlers.zqzhpx_course import ZqzhpxCourseSpider
        from crawlers.keycourse_course import KeycourseCourseSpider
        from crawlers.qianjinyuan_course import QianjinyuanCourseSpider
        from crawlers.hjcn_course import HjcnCourseSpider
        from crawlers.learnbank_course import LearnbankCourseSpider
        from crawlers.bosum_course import BosumCourseSpider
        from crawlers.huide_course import HuideCourseSpider
        from crawlers.beiuec_course import BeiuecCourseSpider

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
            "shchance_course": ShchanceCourseSpider,
            "qiyingschool_course": QiyingSchoolCourseSpider,
            "champconsult_course": ChampconsultCourseSpider,
            "free863_course": Free863CourseSpider,
            "chinacpx_course": ChinacpxCourseSpider,
            "qgpx_course": QgpxCourseSpider,
            "gaopei_course": GaopeiCourseSpider,
            "vmta_course": VmtaCourseSpider,
            "hztbc_course": HztbcCourseSpider,
            "easyfinance_course": EasyFinanceCourseSpider,
            "jyqc_course": JyqcCourseSpider,
            "zqzhpx_course": ZqzhpxCourseSpider,
            "keycourse_course": KeycourseCourseSpider,
            "qianjinyuan_course": QianjinyuanCourseSpider,
            "hjcn_course": HjcnCourseSpider,
            "learnbank_course": LearnbankCourseSpider,
            "bosum_course": BosumCourseSpider,
            "huide_course": HuideCourseSpider,
            "beiuec_course": BeiuecCourseSpider,
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
            {
                "code": "shchance",
                "name": "上海强思企管",
                "url": "http://www.shchance.com.cn",
                "data_type": "COURSE",
            },
            {
                "code": "qiyingschool",
                "name": "企赢培训学院",
                "url": "https://www.qiyingschool.com",
                "data_type": "COURSE",
            },
            {
                "code": "champconsult",
                "name": "冠卓顾问",
                "url": "http://www.champconsult.com",
                "data_type": "COURSE",
            },
            {
                "code": "free863",
                "name": "复锐咨询",
                "url": "https://www.free863.com",
                "data_type": "COURSE",
            },
            {
                "code": "chinacpx",
                "name": "中培网",
                "url": "https://www.chinacpx.com",
                "data_type": "COURSE",
            },
            {
                "code": "qgpx",
                "name": "中华企管培训网",
                "url": "https://www.qgpx.com",
                "data_type": "COURSE",
            },
            {
                "code": "gaopei",
                "name": "高培商院",
                "url": "http://www.gaopei.org",
                "data_type": "COURSE",
            },
            {
                "code": "vmta",
                "name": "健峰企管集团",
                "url": "https://www.vmta.com",
                "data_type": "COURSE",
            },
            {
                "code": "hztbc",
                "name": "时代光华",
                "url": "https://www.hztbc.com",
                "data_type": "COURSE",
            },
            {
                "code": "easyfinance",
                "name": "安越财商院",
                "url": "https://www.easyfinance.com.cn",
                "data_type": "COURSE",
            },
            {
                "code": "jyqc",
                "name": "锦业企程",
                "url": "http://www.jyqc.cn",
                "data_type": "COURSE",
            },
            {
                "code": "zqzhpx",
                "name": "中企智慧培训",
                "url": "http://www.zqzhpx.com",
                "data_type": "COURSE",
            },
            {
                "code": "keycourse",
                "name": "睿选优课",
                "url": "https://www.keycourse.com",
                "data_type": "COURSE",
            },
            {
                "code": "qianjinyuan",
                "name": "前锦园",
                "url": "http://www.qianjinyuan.org",
                "data_type": "COURSE",
            },
            {
                "code": "hjcn",
                "name": "HJCN",
                "url": "http://www.hjcn.com",
                "data_type": "COURSE",
            },
            {
                "code": "learnbank",
                "name": "Learnbank",
                "url": "http://www.learnbank.com.cn",
                "data_type": "COURSE",
            },
            {
                "code": "bosum",
                "name": "博商管理科学研究院",
                "url": "https://bosum.com",
                "data_type": "COURSE",
            },
            {
                "code": "huide",
                "name": "惠德培训",
                "url": "http://www.huide.net",
                "data_type": "COURSE",
            },
            {
                "code": "beiuec",
                "name": "上海倍跃企业管理咨询",
                "url": "http://www.beiuec.com",
                "data_type": "COURSE",
            },
        ]

    def _progress_message(self, job: Dict[str, Any]) -> str:
        accepted_count = len(job.get("items", []))
        skipped_count = job.get("skipped_count", 0)
        if skipped_count:
            return f"已抓取 {accepted_count} 条，已跳过 {skipped_count} 条"
        return f"已抓取 {accepted_count} 条"

    def _complete_message(self, job: Dict[str, Any]) -> str:
        accepted_count = len(job.get("items", []))
        skipped_count = job.get("skipped_count", 0)
        if not skipped_count:
            return f"爬取完成，共抓取 {accepted_count} 条"

        skipped_reasons = job.get("skipped_reasons", {})
        reason_summary = "、".join(
            f"{reason} {count} 条"
            for reason, count in sorted(skipped_reasons.items(), key=lambda item: item[0])
        )
        if reason_summary:
            return f"爬取完成，共抓取 {accepted_count} 条，跳过 {skipped_count} 条（{reason_summary}）"
        return f"爬取完成，共抓取 {accepted_count} 条，跳过 {skipped_count} 条"

    def create_job(self, request: CrawlJobRequest) -> str:
        """创建爬取任务。"""
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
            "skipped_count": 0,
            "skipped_reasons": {},
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
            skipped_count=job.get("skipped_count", 0),
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

        spider_key = f"{job['source']}_{job['data_type'].lower()}"
        SpiderClass = self._spider_registry.get(spider_key)
        if not SpiderClass:
            job["status"] = "failed"
            job["error"] = f"未找到爬虫: {spider_key}"
            logger.error(f"未找到爬虫: {spider_key}")
            return

        callback = CallbackService(
            callback_url=job.get("callback_url"),
            callback_token=job.get("callback_token"),
        )

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

                skip_item, skip_reason = should_skip_expired_public_course(item)
                if skip_item:
                    reason_key = skip_reason or "skipped"
                    job["skipped_count"] = job.get("skipped_count", 0) + 1
                    skipped_reasons = job.setdefault("skipped_reasons", {})
                    skipped_reasons[reason_key] = skipped_reasons.get(reason_key, 0) + 1
                    logger.info(
                        "%s: source=%s title=%s url=%s",
                        skip_reason,
                        job["source"],
                        item.get("title"),
                        item.get("source_url") or item.get("sourceUrl"),
                    )
                    continue

                job["items"].append(item)
                batch_buffer.append(item)

                # 每 N 条回调一次
                if len(batch_buffer) >= 10:
                    await callback.send_batch(job_id, batch_buffer)
                    await callback.notify_progress(
                        job_id,
                        total=expected_total or len(job["items"]),
                        processed=len(job["items"]),
                        message=self._progress_message(job),
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
                    message=self._progress_message(job),
                    error_count=job.get("error_count", 0),
                )

            if job["status"] != "cancelled":
                job["status"] = "completed"
                total = expected_total or len(job["items"])
                await callback.notify_complete(
                    job_id,
                    total,
                    processed=len(job["items"]),
                    message=self._complete_message(job),
                )
                logger.info(f"任务完成: job_id={job_id}, total={len(job['items'])}")

        except Exception as e:
            job["status"] = "failed"
            job["error"] = str(e)
            logger.exception(f"任务失败: job_id={job_id}")
            try:
                await callback.notify_error(
                    job_id,
                    str(e),
                    processed=len(job.get("items", [])),
                    total=job.get("expected_total") or len(job.get("items", [])),
                )
            except Exception:
                logger.exception("Failed to notify crawler error callback: job_id=%s", job_id)
