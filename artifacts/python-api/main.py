from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from routes.dictionary import router as dictionary_router
from routes.fetch import router as fetch_router
from routes.search import router as search_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


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

app.include_router(fetch_router)
app.include_router(search_router)
app.include_router(dictionary_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
