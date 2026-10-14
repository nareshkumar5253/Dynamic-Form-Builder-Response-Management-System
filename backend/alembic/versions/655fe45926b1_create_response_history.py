"""create response history

Revision ID: 655fe45926b1
Revises: 66f3850db097
Create Date: 2026-10-07 09:27:19.655843

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "655fe45926b1"
down_revision: Union[str, Sequence[str], None] = "66f3850db097"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create response_history table."""

    op.create_table(
        "response_history",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "response_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "field_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "changed_by",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "old_value",
            sa.JSON(),
            nullable=True,
        ),

        sa.Column(
            "new_value",
            sa.JSON(),
            nullable=True,
        ),

        sa.Column(
            "action",
            sa.String(length=30),
            nullable=False,
        ),

        sa.Column(
            "changed_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.ForeignKeyConstraint(
            ["response_id"],
            ["form_responses.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["field_id"],
            ["form_fields.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["changed_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_response_history_id",
        "response_history",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_response_history_response_id",
        "response_history",
        ["response_id"],
        unique=False,
    )

    op.create_index(
        "ix_response_history_field_id",
        "response_history",
        ["field_id"],
        unique=False,
    )

    op.create_index(
        "ix_response_history_changed_by",
        "response_history",
        ["changed_by"],
        unique=False,
    )


def downgrade() -> None:
    """Drop response_history table."""

    op.drop_index(
        "ix_response_history_changed_by",
        table_name="response_history",
    )

    op.drop_index(
        "ix_response_history_field_id",
        table_name="response_history",
    )

    op.drop_index(
        "ix_response_history_response_id",
        table_name="response_history",
    )

    op.drop_index(
        "ix_response_history_id",
        table_name="response_history",
    )

    op.drop_table("response_history")