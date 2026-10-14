from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResponseHistory(Base):
    __tablename__ = "response_history"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    response_id: Mapped[int] = mapped_column(
        ForeignKey(
            "form_responses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    field_id: Mapped[int] = mapped_column(
        ForeignKey(
            "form_fields.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    old_value: Mapped[object | None] = mapped_column(
        JSON,
        nullable=True,
    )

    new_value: Mapped[object | None] = mapped_column(
        JSON,
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="UPDATE",
    )

    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    response = relationship(
        "FormResponse",
        backref="history",
    )

    field = relationship(
        "FormField",
        backref="response_history",
    )

    user = relationship(
        "User",
        backref="response_history",
    )