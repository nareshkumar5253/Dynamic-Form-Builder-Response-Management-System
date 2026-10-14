from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


ALLOWED_FIELD_TYPES = {
    "TEXT",
    "NUMBER",
    "EMAIL",
    "DATE",
    "DROPDOWN",
    "CHECKBOX",
    "RADIO",
    "FILE",
    "RATING",
}


class FormFieldCreate(BaseModel):
    field_name: str = Field(
        min_length=2,
        max_length=100
    )
    field_label: str = Field(
        min_length=2,
        max_length=200
    )
    field_type: str
    placeholder: str | None = None
    help_text: str | None = None
    is_required: bool = False
    field_order: int = Field(
        default=0,
        ge=0
    )
    validation_rules: dict | None = None
    conditional_logic: dict | None = None


class FormFieldUpdate(BaseModel):
    field_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    field_label: str | None = Field(
        default=None,
        min_length=2,
        max_length=200
    )
    field_type: str | None = None
    placeholder: str | None = None
    help_text: str | None = None
    is_required: bool | None = None
    field_order: int | None = Field(
        default=None,
        ge=0
    )
    validation_rules: dict | None = None
    conditional_logic: dict | None = None


class FormFieldResponse(BaseModel):
    id: int
    form_id: int
    field_name: str
    field_label: str
    field_type: str
    placeholder: str | None
    help_text: str | None
    is_required: bool
    field_order: int
    validation_rules: dict | None
    conditional_logic: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )