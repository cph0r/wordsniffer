import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db import get_db
from models.paragraph import Paragraph
from services.external_api import fetch_definitions_batch
from services.text_processing import word_frequency

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/dictionary")
async def dictionary(db: Session = Depends(get_db)):
    try:
        paragraphs = db.query(Paragraph).all()
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

    if not paragraphs:
        return {
            "data": [],
            "meta": {"total_paragraphs": 0, "message": "No paragraphs stored yet"},
            "error": None,
        }

    texts = [p.content for p in paragraphs]
    top_words = word_frequency(texts)

    if not top_words:
        return {
            "data": [],
            "meta": {
                "total_paragraphs": len(paragraphs),
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
        "meta": {"total_paragraphs": len(paragraphs), "total_words": len(results)},
        "error": None,
    }
