from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResponseDetail(Base):
    __tablename__ = "response_details"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    response_id: Mapped[int] = mapped_column(
        ForeignKey("form_responses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    field_id: Mapped[int] = mapped_column(
        ForeignKey("form_fields.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    value: Mapped[object | None] = mapped_column(
        JSON,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    response = relationship(
        "FormResponse",
        back_populates="details"
    )

    field = relationship(
        "FormField",
        backref="response_details"
    )