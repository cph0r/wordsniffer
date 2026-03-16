import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import func as sa_func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db import get_db
from models.paragraph import Paragraph
from services.external_api import fetch_definitions_batch
from services.text_processing import word_frequency

logger = logging.getLogger(__name__)

router = APIRouter()

BATCH_SIZE = 500


@router.get("/api/dictionary")
async def dictionary(db: Session = Depends(get_db)):
    try:
        total_paragraphs = db.query(sa_func.count(Paragraph.id)).scalar() or 0
    except SQLAlchemyError:
        logger.exception("Database error during dictionary count")
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "Database error while analyzing paragraphs.",
                    "type": "database_error",
                },
            },
        )

    if total_paragraphs == 0:
        return {
            "data": [],
            "meta": {"total_paragraphs": 0, "message": "No paragraphs stored yet"},
            "error": None,
        }

    try:
        all_texts: list[str] = []
        offset = 0
        while True:
            batch = (
                db.query(Paragraph.content)
                .order_by(Paragraph.id)
                .offset(offset)
                .limit(BATCH_SIZE)
                .all()
            )
            if not batch:
                break
            all_texts.extend(row[0] for row in batch)
            offset += BATCH_SIZE
            if len(batch) < BATCH_SIZE:
                break
    except SQLAlchemyError:
        logger.exception("Database error during dictionary analysis")
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "Database error while analyzing paragraphs.",
                    "type": "database_error",
                },
            },
        )

    top_words = word_frequency(all_texts)

    if not top_words:
        return {
            "data": [],
            "meta": {
                "total_paragraphs": total_paragraphs,
                "message": "No meaningful words found after filtering",
            },
            "error": None,
        }

    words_only = [word for word, _ in top_words]
    definitions = await fetch_definitions_batch(words_only)

    results = []
    for (word, freq), defn in zip(top_words, definitions, strict=False):
        results.append(
            {
                "word": word,
                "frequency": freq,
                "definition": defn.get("definition")
                if defn.get("found")
                else "definition_not_found",
                "phonetic": defn.get("phonetic"),
                "part_of_speech": defn.get("part_of_speech"),
                "found": defn.get("found", False),
            }
        )

    return {
        "data": results,
        "meta": {"total_paragraphs": total_paragraphs, "total_words": len(results)},
        "error": None,
    }
