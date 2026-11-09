from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_name: Mapped[str] = mapped_column(String(200), default="Unknown candidate", index=True)
    match_score: Mapped[int] = mapped_column(Integer, index=True)
    report_json: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(40), default="unknown")
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
