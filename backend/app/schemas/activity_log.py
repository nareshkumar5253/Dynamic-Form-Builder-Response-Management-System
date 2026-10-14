
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    description: str | None
    log_metadata: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
