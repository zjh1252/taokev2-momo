from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.schemas import CrawlJobRequest, CrawlJobResponse, CrawlJobStatus
from services.job_manager import JobManager

router = APIRouter()
job_manager = JobManager()


@router.get("/sources")
async def list_sources():
    """返回所有可用数据源"""
    return {"data": job_manager.get_available_sources()}


@router.post("/jobs", response_model=CrawlJobResponse)
async def create_job(request: CrawlJobRequest, bg: BackgroundTasks):
    """创建爬取任务，后台执行"""
    try:
        job_id = job_manager.create_job(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    bg.add_task(job_manager.run_job, job_id)
    return CrawlJobResponse(job_id=job_id, status="pending")


@router.get("/jobs/{job_id}", response_model=CrawlJobStatus)
async def get_job_status(job_id: str):
    """查询任务状态"""
    return job_manager.get_job_status(job_id)


@router.put("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """取消任务"""
    job_manager.cancel_job(job_id)
    return {"status": "cancelled"}
