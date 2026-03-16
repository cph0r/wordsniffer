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

DEFAULT_LIMIT = 10
MAX_LIMIT = 200


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
    limit: int = Query(
        DEFAULT_LIMIT,
        ge=1,
        le=MAX_LIMIT,
        description="Maximum number of results",
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of results to skip",
    ),
    db: Session = Depends(get_db),
):
    raw_words = [w.strip() for w in words.split(",") if w.strip()]
    normalized_words = normalize_search_words(raw_words)

    if not normalized_words:
        return {
            "data": [],
            "meta": {
                "count": 0,
                "total": 0,
                "operator": operator,
                "words": [],
                "limit": limit,
                "offset": offset,
                "has_more": False,
            },
            "error": None,
        }

    try:
        query = db.query(Paragraph)
        for word in normalized_words:
            like_pattern = f"%{word}%"
            if operator == "and":
                query = query.filter(Paragraph.content.ilike(like_pattern))
            else:
                break

        if operator == "or":
            from sqlalchemy import or_

            conditions = [Paragraph.content.ilike(f"%{w}%") for w in normalized_words]
            query = db.query(Paragraph).filter(or_(*conditions))

        candidates = query.all()
    except SQLAlchemyError:
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
        for p in candidates
        if search_paragraphs(p.content, normalized_words, operator)
    ]

    total = len(matching)
    paginated = matching[offset : offset + limit]

    return {
        "data": paginated,
        "meta": {
            "count": len(paginated),
            "total": total,
            "operator": operator,
            "words": normalized_words,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(paginated)) < total,
        },
        "error": None,
    }
