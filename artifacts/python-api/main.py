import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from db import init_db
from routes.dictionary import router as dictionary_router
from routes.fetch import router as fetch_router
from routes.paragraphs import router as paragraphs_router
from routes.search import router as search_router
from services.external_api import http_client

logger = logging.getLogger("paragraph_api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    http_client.start()
    yield
    await http_client.close()


app = FastAPI(
    title="Paragraph API",
    description="Fetch, search, and analyze paragraphs",
    version="1.0.0",
    lifespan=lifespan,
    root_path="/python-api",
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
def health_check():
    return {"status": "ok"}
