import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from models.paragraph import Base

_database_url = os.environ.get("DATABASE_URL", "")

if not _database_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is required but was not set. "
        "Please configure it before starting the application."
    )

_engine_kwargs: dict = {"pool_pre_ping": True}
if _database_url.startswith("postgresql"):
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 10

engine = create_engine(_database_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
