
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResponseDetailCreate(BaseModel):
    field_id: int = Field(gt=0)
    value: object | None = None


class FormResponseCreate(BaseModel):
    responses: list[ResponseDetailCreate] = Field(
        min_length=1
    )


class ResponseDetailUpdate(BaseModel):
    field_id: int = Field(gt=0)
    value: object | None = None


class FormResponseUpdate(BaseModel):
    responses: list[ResponseDetailUpdate] = Field(
        min_length=1
    )


class ResponseDetailResponse(BaseModel):
    id: int
    response_id: int
    field_id: int
    value: object | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FormResponseResponse(BaseModel):
    id: int
    form_id: int
    submitted_by: int | None
    status: str
    submitted_at: datetime
    updated_at: datetime
    details: list[ResponseDetailResponse] = []

    model_config = ConfigDict(from_attributes=True)


class FormResponseListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    responses: list[FormResponseResponse]


class ResponseHistoryResponse(BaseModel):
    id: int
    response_id: int
    field_id: int
    changed_by: int | None
    old_value: object | None
    new_value: object | None
    action: str
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)
