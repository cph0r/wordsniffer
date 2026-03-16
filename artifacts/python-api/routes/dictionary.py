from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from models.paragraph import Paragraph
from services.external_api import fetch_definitions_batch
from services.text_processing import word_frequency

router = APIRouter()


@router.get("/dictionary")
async def dictionary(db: Session = Depends(get_db)):
    paragraphs = db.query(Paragraph).all()

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
                "definition": defn.get("definition"),
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
