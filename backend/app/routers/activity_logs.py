
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse

router = APIRouter(
    prefix="/activity-logs",
    tags=["Activity Logs"],
)


@router.get("")
def get_activity_logs(
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    user_id: int | None = Query(default=None, gt=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(ActivityLog)

    if action:
        query = query.filter(
            ActivityLog.action.ilike(f"%{action.strip()}%")
        )

    if entity_type:
        query = query.filter(
            ActivityLog.entity_type.ilike(
                f"%{entity_type.strip()}%"
            )
        )

    if user_id is not None:
        query = query.filter(ActivityLog.user_id == user_id)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size

    logs = (
        query.order_by(ActivityLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "logs": [
            ActivityLogResponse.model_validate(log).model_dump()
            for log in logs
        ],
    }
