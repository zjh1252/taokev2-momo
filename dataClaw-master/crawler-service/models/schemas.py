from pydantic import BaseModel
from typing import Optional


class CrawlJobRequest(BaseModel):
    """爬取任务请求"""
    source: str  # 数据源标识
    data_type: str  # 数据类型：TRAINER/COURSE
    callback_url: Optional[str] = None  # 回调地址（可选，覆盖默认）
    callback_token: Optional[str] = None  # 回调 token（可选，覆盖默认）
    max_items: Optional[int] = None  # 爬取数量限制
    start_url: Optional[str] = None  # 起始 URL（可选，覆盖默认）


class CrawlJobResponse(BaseModel):
    """爬取任务响应"""
    job_id: str
    status: str


class CrawlJobStatus(BaseModel):
    """任务状态"""
    job_id: str
    source: str
    data_type: str
    status: str  # pending/running/completed/failed/cancelled
    total_items: int = 0
    error: Optional[str] = None
