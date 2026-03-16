from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Index, Integer, Text, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Paragraph(Base):
    __tablename__ = "paragraphs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False, unique=True)
    fetched_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    source_url = Column(Text, nullable=False)

    __table_args__ = (Index("ix_paragraphs_fetched_at", fetched_at.desc()),)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "content": self.content,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
            "source_url": self.source_url,
        }
