import logging

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from config import METAPHORPSUM_URL
from db import get_db
from models.paragraph import Paragraph
from services.external_api import fetch_paragraph

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/fetch")
async def fetch_and_store(db: Session = Depends(get_db)):
    try:
        text = await fetch_paragraph()
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        logger.warning("External API fetch failed: %s", exc)
        return JSONResponse(
            status_code=502,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "Failed to fetch paragraph from external API.",
                    "type": "external_api_error",
                },
            },
        )

    if not text:
        return JSONResponse(
            status_code=502,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "External API returned empty content",
                    "type": "empty_response",
                },
            },
        )

    paragraph = Paragraph(content=text, source_url=METAPHORPSUM_URL)
    try:
        db.add(paragraph)
        db.commit()
        db.refresh(paragraph)
    except IntegrityError:
        db.rollback()
        existing = db.query(Paragraph).filter(Paragraph.content == text).first()
        if existing:
            return {
                "data": existing.to_dict(),
                "meta": {"duplicate": True},
                "error": None,
            }
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error while storing paragraph")
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "Database error while storing paragraph.",
                    "type": "database_error",
                },
            },
        )

    try:
        total = db.query(Paragraph).count()
    except SQLAlchemyError:
        total = None

    return {
        "data": paragraph.to_dict(),
        "meta": {"duplicate": False, "total_paragraphs": total},
        "error": None,
    }
