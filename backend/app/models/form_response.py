from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FormResponse(Base):
    __tablename__ = "form_responses"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    submitted_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="SUBMITTED",
        nullable=False
    )

    submitted_at: Mapped[datetime] = mapped_column(
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

    form = relationship(
        "Form",
        backref="responses"
    )

    user = relationship(
        "User",
        backref="form_responses"
    )

    details = relationship(
        "ResponseDetail",
        back_populates="response",
        cascade="all, delete-orphan"
    )