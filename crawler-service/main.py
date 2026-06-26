import uvicorn
from fastapi import FastAPI
from api.crawl_router import router as crawl_router
from config import SERVER_PORT

app = FastAPI(title="淘课网爬虫服务", version="0.1.0")
app.include_router(crawl_router, prefix="/api/crawl")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=SERVER_PORT, reload=True)
