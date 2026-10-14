from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FormField(Base):
    __tablename__ = "form_fields"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    field_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    field_label: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    field_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    placeholder: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    help_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    field_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    validation_rules: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    conditional_logic: Mapped[dict | None] = mapped_column(
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

    form = relationship(
        "Form",
        back_populates="fields"
    )

    options = relationship(
        "FieldOption",
        back_populates="field",
        cascade="all, delete-orphan",
        order_by="FieldOption.option_order"
    )