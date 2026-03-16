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

engine = create_engine(_database_url, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
