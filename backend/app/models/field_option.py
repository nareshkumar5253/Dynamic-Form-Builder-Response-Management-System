from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FieldOption(Base):
    __tablename__ = "field_options"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    field_id: Mapped[int] = mapped_column(
        ForeignKey("form_fields.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    option_label: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    option_value: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    option_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    field = relationship(
        "FormField",
        back_populates="options"
    )