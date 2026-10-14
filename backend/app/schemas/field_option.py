from pydantic import BaseModel, ConfigDict, Field


class FieldOptionCreate(BaseModel):
    option_label: str = Field(min_length=1, max_length=200)
    option_value: str = Field(min_length=1, max_length=200)
    option_order: int = Field(default=0, ge=0)


class FieldOptionUpdate(BaseModel):
    option_label: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    option_value: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    option_order: int | None = Field(
        default=None,
        ge=0,
    )


class FieldOptionResponse(BaseModel):
    id: int
    field_id: int
    option_label: str
    option_value: str
    option_order: int

    model_config = ConfigDict(from_attributes=True)