import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db import get_db
from models.paragraph import Paragraph

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/paragraphs/recent")
def recent_paragraphs(
    limit: int = Query(5, ge=1, le=100, description="Number of paragraphs to return"),
    offset: int = Query(0, ge=0, description="Number of paragraphs to skip"),
    db: Session = Depends(get_db),
):
    try:
        paragraphs = (
            db.query(Paragraph)
            .order_by(Paragraph.fetched_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        total = db.query(Paragraph).count()
    except SQLAlchemyError:
        logger.exception("Database error fetching recent paragraphs")
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "meta": None,
                "error": {
                    "message": "Database error while fetching paragraphs.",
                    "type": "database_error",
                },
            },
        )

    return {
        "data": [p.to_dict() for p in paragraphs],
        "meta": {
            "count": len(paragraphs),
            "total_paragraphs": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(paragraphs)) < total,
        },
        "error": None,
    }
