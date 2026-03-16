import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db import get_db
from models.paragraph import Paragraph
from services.text_processing import normalize_search_words, search_paragraphs

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/search")
def search(
    words: str = Query(
        ...,
        description="Comma-separated list of words to search for",
    ),
    operator: str = Query(
        "or",
        description="Search operator: 'or' or 'and'",
        pattern="^(or|and)$",
    ),
    db: Session = Depends(get_db),
):
    raw_words = [w.strip() for w in words.split(",") if w.strip()]
    normalized_words = normalize_search_words(raw_words)

    if not normalized_words:
        return {
            "data": [],
            "meta": {"count": 0, "operator": operator, "words": []},
            "error": None,
        }

    try:
        paragraphs = db.query(Paragraph).all()
    except SQLAlchemyError as exc:
        logger.exception("Database error during search")
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "Database error while searching paragraphs.",
                    "type": "database_error",
                },
            },
        )

    matching = [
        p.to_dict()
        for p in paragraphs
        if search_paragraphs(p.content, normalized_words, operator)
    ]

    return {
        "data": matching,
        "meta": {
            "count": len(matching),
            "operator": operator,
            "words": normalized_words,
        },
        "error": None,
    }
