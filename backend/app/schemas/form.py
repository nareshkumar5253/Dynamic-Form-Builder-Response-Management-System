from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FormCreate(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=200
    )
    description: str | None = None
    is_public: bool = False


class FormUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200
    )
    description: str | None = None
    is_public: bool | None = None
    is_enabled: bool | None = None


class FormResponse(BaseModel):
    id: int
    title: str
    description: str | None
    created_by: int
    is_public: bool
    is_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )