
from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.form import Form
from app.models.form_field import FormField
from app.models.form_response import FormResponse
from app.models.response_detail import ResponseDetail
from app.models.user import User


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard Analytics"],
)


@router.get("/analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_forms = db.query(func.count(Form.id)).scalar() or 0

    enabled_forms = (
        db.query(func.count(Form.id))
        .filter(Form.is_enabled.is_(True))
        .scalar()
        or 0
    )

    disabled_forms = total_forms - enabled_forms

    total_responses = (
        db.query(func.count(FormResponse.id)).scalar() or 0
    )

    submitted_responses = (
        db.query(func.count(FormResponse.id))
        .filter(FormResponse.status == "SUBMITTED")
        .scalar()
        or 0
    )

    updated_responses = (
        db.query(func.count(FormResponse.id))
        .filter(FormResponse.status == "UPDATED")
        .scalar()
        or 0
    )

    form_statistics = (
        db.query(
            Form.id,
            Form.title,
            Form.is_enabled,
            func.count(FormResponse.id).label("response_count"),
        )
        .outerjoin(
            FormResponse,
            FormResponse.form_id == Form.id,
        )
        .group_by(Form.id, Form.title, Form.is_enabled)
        .order_by(Form.id.desc())
        .all()
    )

    forms = [
        {
            "form_id": row.id,
            "title": row.title,
            "is_enabled": row.is_enabled,
            "response_count": row.response_count,
        }
        for row in form_statistics
    ]

    # Response submissions by date, covering the last 7 days.
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)

    daily_rows = (
        db.query(
            func.date(FormResponse.submitted_at).label("submission_date"),
            func.count(FormResponse.id).label("count"),
        )
        .filter(
            FormResponse.submitted_at >= datetime.combine(
                start_date, datetime.min.time()
            ),
            FormResponse.submitted_at < datetime.combine(
                today + timedelta(days=1), datetime.min.time()
            ),
        )
        .group_by(func.date(FormResponse.submitted_at))
        .all()
    )

    daily_counts = {
        str(row.submission_date): row.count
        for row in daily_rows
    }

    submission_trend = [
        {
            "date": str(start_date + timedelta(days=offset)),
            "count": daily_counts.get(
                str(start_date + timedelta(days=offset)), 0
            ),
        }
        for offset in range(7)
    ]

    recent_responses = (
        db.query(FormResponse)
        .options(
            selectinload(FormResponse.form),
            selectinload(FormResponse.user),
        )
        .order_by(
            FormResponse.submitted_at.desc(),
            FormResponse.id.desc(),
        )
        .limit(10)
        .all()
    )

    recent_submissions = [
        {
            "response_id": response.id,
            "form_id": response.form_id,
            "form_title": (
                response.form.title
                if response.form
                else "Deleted Form"
            ),
            "submitted_by": (
                response.user.email
                if response.user
                else "Anonymous"
            ),
            "status": response.status,
            "submitted_at": response.submitted_at,
        }
        for response in recent_responses
    ]

    return {
        "summary": {
            "total_forms": total_forms,
            "enabled_forms": enabled_forms,
            "disabled_forms": disabled_forms,
            "total_responses": total_responses,
            "submitted_responses": submitted_responses,
            "updated_responses": updated_responses,
        },
        "forms": forms,
        "submission_trend": submission_trend,
        "recent_submissions": recent_submissions,
    }


@router.get("/forms/{form_id}/analytics")
def get_form_analytics(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    days: int = Query(default=7, ge=1, le=90),
):
    form = db.query(Form).filter(Form.id == form_id).first()

    if form is None:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )

    total_responses = (
        db.query(func.count(FormResponse.id))
        .filter(FormResponse.form_id == form_id)
        .scalar()
        or 0
    )

    status_rows = (
        db.query(
            FormResponse.status,
            func.count(FormResponse.id).label("count"),
        )
        .filter(FormResponse.form_id == form_id)
        .group_by(FormResponse.status)
        .all()
    )

    status_breakdown = [
        {"status": row.status, "count": row.count}
        for row in status_rows
    ]

    start_date = datetime.utcnow().date() - timedelta(days=days - 1)

    daily_rows = (
        db.query(
            func.date(FormResponse.submitted_at).label("submission_date"),
            func.count(FormResponse.id).label("count"),
        )
        .filter(
            FormResponse.form_id == form_id,
            FormResponse.submitted_at >= datetime.combine(
                start_date, datetime.min.time()
            ),
            FormResponse.submitted_at < datetime.combine(
                datetime.utcnow().date() + timedelta(days=1),
                datetime.min.time(),
            ),
        )
        .group_by(func.date(FormResponse.submitted_at))
        .all()
    )

    daily_counts = {
        str(row.submission_date): row.count
        for row in daily_rows
    }

    submission_trend = [
        {
            "date": str(start_date + timedelta(days=offset)),
            "count": daily_counts.get(
                str(start_date + timedelta(days=offset)), 0
            ),
        }
        for offset in range(days)
    ]

    fields = (
        db.query(FormField)
        .filter(FormField.form_id == form_id)
        .order_by(FormField.field_order)
        .all()
    )

    field_analytics = []

    for field in fields:
        details = (
            db.query(ResponseDetail.value)
            .join(
                FormResponse,
                ResponseDetail.response_id == FormResponse.id,
            )
            .filter(
                FormResponse.form_id == form_id,
                ResponseDetail.field_id == field.id,
            )
            .all()
        )

        answer_counts = Counter()

        for detail in details:
            value = detail.value

            if value is None or value == "":
                continue

            if isinstance(value, list):
                for item in value:
                    answer_counts[str(item)] += 1
            elif isinstance(value, (str, int, float, bool)):
                answer_counts[str(value)] += 1
            else:
                answer_counts[str(value)] += 1

        field_analytics.append(
            {
                "field_id": field.id,
                "field_name": field.field_name,
                "field_label": field.field_label,
                "field_type": field.field_type,
                "answer_count": len(details),
                "answer_distribution": [
                    {"value": value, "count": count}
                    for value, count in answer_counts.most_common()
                ],
            }
        )

    return {
        "form_id": form.id,
        "form_title": form.title,
        "total_responses": total_responses,
        "status_breakdown": status_breakdown,
        "submission_trend": submission_trend,
        "field_analytics": field_analytics,
    }
