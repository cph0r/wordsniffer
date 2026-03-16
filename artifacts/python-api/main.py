import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from db import init_db
from routes.dictionary import router as dictionary_router
from routes.fetch import router as fetch_router
from routes.paragraphs import router as paragraphs_router
from routes.search import router as search_router
from services.external_api import http_client

logger = logging.getLogger("paragraph_api")

STATIC_DIR = Path(__file__).parent / "static"
IS_PRODUCTION = os.environ.get("REPLIT_DEPLOYMENT", "") == "1"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    http_client.start()
    yield
    await http_client.close()


app = FastAPI(
    title="WordSniffer API",
    description="Fetch, search, and analyze paragraphs",
    version="1.0.0",
    lifespan=lifespan,
    root_path="" if IS_PRODUCTION else "/python-api",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "meta": None,
            "error": {
                "message": "An internal server error occurred.",
                "type": "internal_error",
            },
        },
    )


app.include_router(fetch_router)
app.include_router(paragraphs_router)
app.include_router(search_router)
app.include_router(dictionary_router)


@app.get("/health")
@app.get("/api/healthz")
def health_check():
    return {"status": "ok"}


if IS_PRODUCTION and STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = (STATIC_DIR / full_path).resolve()
        if file_path.is_relative_to(STATIC_DIR) and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
