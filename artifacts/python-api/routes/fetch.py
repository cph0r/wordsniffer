import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config import METAPHORPSUM_URL
from db import get_db
from models.paragraph import Paragraph
from services.external_api import fetch_paragraph

router = APIRouter()


@router.get("/api/fetch")
async def fetch_and_store(db: Session = Depends(get_db)):
    try:
        text = await fetch_paragraph()
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        return JSONResponse(
            status_code=502,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": f"Failed to fetch paragraph from external API: {exc}",
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

    total = db.query(Paragraph).count()
    return {
        "data": paragraph.to_dict(),
        "meta": {"duplicate": False, "total_paragraphs": total},
        "error": None,
    }
