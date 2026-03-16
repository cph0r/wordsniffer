from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from models.paragraph import Paragraph
from services.text_processing import normalize_search_words, search_paragraphs

router = APIRouter()


@router.get("/search")
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

    paragraphs = db.query(Paragraph).all()
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
