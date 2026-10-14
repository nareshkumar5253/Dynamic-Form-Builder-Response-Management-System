from datetime import date, datetime
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.form import Form
from app.models.form_field import FormField
from app.models.field_option import FieldOption
from app.models.form_response import FormResponse
from app.models.response_detail import ResponseDetail
from app.models.response_history import ResponseHistory
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.form_response import (
    FormResponseCreate,
    FormResponseListResponse,
    FormResponseResponse,
    FormResponseUpdate,
    ResponseHistoryResponse,
)

router = APIRouter(
    prefix="/forms/{form_id}/responses",
    tags=["Form Responses"],
)


# ============================================================
# Helper Functions
# ============================================================

def create_activity_log(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int | None,
    description: str,
):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
    )

    db.add(log)


def get_form_or_404(
    form_id: int,
    db: Session,
) -> Form:
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )

    return form


def get_response_or_404(
    form_id: int,
    response_id: int,
    db: Session,
) -> FormResponse:
    response = (
        db.query(FormResponse)
        .filter(
            FormResponse.id == response_id,
            FormResponse.form_id == form_id,
        )
        .first()
    )

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found",
        )

    return response


def validate_field_value(
    field: FormField,
    value,
    db: Session,
):
    field_type = field.field_type.upper()

    # --------------------------------------------------------
    # Required validation
    # --------------------------------------------------------

    if field.is_required:
        if value is None or value == "" or value == []:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field.field_label} is required",
            )

    if value is None or value == "":
        return

    validation_rules = field.validation_rules or {}

    # --------------------------------------------------------
    # TEXT
    # --------------------------------------------------------

    if field_type == "TEXT":
        if not isinstance(value, str):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be text",
            )

        min_length = validation_rules.get("min")
        max_length = validation_rules.get("max")

        if min_length is not None and len(value) < min_length:
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must contain at least {min_length} characters",
            )

        if max_length is not None and len(value) > max_length:
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must contain at most {max_length} characters",
            )

    # --------------------------------------------------------
    # NUMBER
    # --------------------------------------------------------

    elif field_type == "NUMBER":
        if isinstance(value, bool) or not isinstance(
            value,
            (int, float),
        ):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be a number",
            )

        min_value = validation_rules.get("min")
        max_value = validation_rules.get("max")

        if min_value is not None and value < min_value:
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be at least {min_value}",
            )

        if max_value is not None and value > max_value:
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be at most {max_value}",
            )

    # --------------------------------------------------------
    # EMAIL
    # --------------------------------------------------------

    elif field_type == "EMAIL":
        if not isinstance(value, str):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be a valid email address",
            )

        email_pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

        if not re.match(email_pattern, value):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be a valid email address",
            )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    elif field_type == "DATE":
        if not isinstance(value, str):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must use YYYY-MM-DD format",
            )

        try:
            datetime.strptime(
                value,
                "%Y-%m-%d",
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must use YYYY-MM-DD format",
            )

    # --------------------------------------------------------
    # DROPDOWN / RADIO
    # --------------------------------------------------------

    elif field_type in {"DROPDOWN", "RADIO"}:
        if not isinstance(value, str):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must contain a valid option",
            )

        options = (
            db.query(FieldOption)
            .filter(FieldOption.field_id == field.id)
            .all()
        )

        allowed_values = {
            option.option_value
            for option in options
        }

        if value not in allowed_values:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid option for {field.field_label}",
            )

    # --------------------------------------------------------
    # CHECKBOX
    # --------------------------------------------------------

    elif field_type == "CHECKBOX":
        if not isinstance(value, list):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must contain a list of options",
            )

        options = (
            db.query(FieldOption)
            .filter(FieldOption.field_id == field.id)
            .all()
        )

        allowed_values = {
            option.option_value
            for option in options
        }

        for selected_value in value:
            if selected_value not in allowed_values:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid option for {field.field_label}: {selected_value}",
                )

    # --------------------------------------------------------
    # FILE
    # --------------------------------------------------------

    elif field_type == "FILE":
        if not isinstance(value, str):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must contain a file reference",
            )

        allowed_extensions = validation_rules.get(
            "allowed_extensions"
        )

        if allowed_extensions:
            extension = value.split(".")[-1].lower()

            if extension not in [
                ext.lower()
                for ext in allowed_extensions
            ]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Invalid file type for {field.field_label}. "
                        f"Allowed: {', '.join(allowed_extensions)}"
                    ),
                )

    # --------------------------------------------------------
    # RATING
    # --------------------------------------------------------

    elif field_type == "RATING":
        if isinstance(value, bool) or not isinstance(
            value,
            (int, float),
        ):
            raise HTTPException(
                status_code=400,
                detail=f"{field.field_label} must be a number",
            )

        min_value = validation_rules.get(
            "min",
            1,
        )

        max_value = validation_rules.get(
            "max",
            5,
        )

        if value < min_value or value > max_value:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{field.field_label} must be between "
                    f"{min_value} and {max_value}"
                ),
            )



def validate_form_responses(
    form_id: int,
    submitted_values: dict,
    db: Session,
):
    fields = (
        db.query(FormField)
        .filter(FormField.form_id == form_id)
        .order_by(FormField.field_order, FormField.id)
        .all()
    )

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="Form has no fields",
        )

    field_map = {field.id: field for field in fields}

    # Reject fields that do not belong to this form.
    for field_id in submitted_values:
        if field_id not in field_map:
            raise HTTPException(
                status_code=400,
                detail=f"Field {field_id} does not belong to this form",
            )

    def is_empty(value):
        return value is None or value == "" or value == []

    def is_visible(field):
        condition = field.conditional_logic

        # No condition means the field is always visible.
        if not condition:
            return True

        if not isinstance(condition, dict):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid conditional logic for {field.field_label}",
            )

        source_id = condition.get("field_id")
        operator = condition.get("operator", "equals")
        expected = condition.get("value")

        # Validate the condition definition.
        if (
            isinstance(source_id, bool)
            or not isinstance(source_id, int)
            or source_id not in field_map
            or source_id == field.id
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid condition source for {field.field_label}",
            )

        if operator not in {
            "equals",
            "not_equals",
            "contains",
            "not_contains",
        }:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported condition operator for {field.field_label}",
            )

        actual = submitted_values.get(source_id)

        if operator == "equals":
            return actual == expected

        if operator == "not_equals":
            return actual != expected

        if operator == "contains":
            if isinstance(actual, (str, list)):
                return expected in actual
            return False

        if operator == "not_contains":
            if isinstance(actual, (str, list)):
                return expected not in actual
            return True

        return True

    # Determine visibility before validating any values.
    visible_fields = {
        field.id: is_visible(field)
        for field in fields
    }

    # Ignore values supplied for hidden fields.
    for field_id, value in submitted_values.items():
        if not visible_fields[field_id] and not is_empty(value):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{field_map[field_id].field_label} is hidden "
                    "and must not be submitted"
                ),
            )

    # Validate values only for visible fields.
    for field_id, value in submitted_values.items():
        if visible_fields[field_id]:
            validate_field_value(
                field_map[field_id],
                value,
                db,
            )

    # Required validation applies only to visible fields.
    for field in fields:
        if not visible_fields[field.id]:
            continue

        if field.is_required:
            value = submitted_values.get(field.id)

            if is_empty(value):
                raise HTTPException(
                    status_code=400,
                    detail=f"{field.field_label} is required",
                )

    # --------------------------------------------------------
    # Check field IDs
    # --------------------------------------------------------

    for field_id in submitted_values:
        if field_id not in field_map:
            raise HTTPException(
                status_code=400,
                detail=f"Field {field_id} does not belong to this form",
            )

    # --------------------------------------------------------
    # Validate every submitted field
    # --------------------------------------------------------

    for field_id, value in submitted_values.items():
        validate_field_value(
            field_map[field_id],
            value,
            db,
        )

    # --------------------------------------------------------
    # Check required fields
    # --------------------------------------------------------

    for field in fields:
        if field.is_required:
            value = submitted_values.get(field.id)

            if value is None or value == "" or value == []:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field.field_label} is required",
                )


# ============================================================
# Submit Response
# ============================================================

@router.post(
    "",
    response_model=FormResponseResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_response(
    form_id: int,
    payload: FormResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = get_form_or_404(
        form_id,
        db,
    )

    if not form.is_enabled:
        raise HTTPException(
            status_code=400,
            detail="Form is disabled",
        )

    if not form.is_public:
        # Authenticated submission is allowed.
        pass

    submitted_values = {
        item.field_id: item.value
        for item in payload.responses
    }

    validate_form_responses(
        form_id,
        submitted_values,
        db,
    )

    response = FormResponse(
        form_id=form_id,
        submitted_by=current_user.id,
        status="SUBMITTED",
    )

    db.add(response)
    db.flush()

    for field_id, value in submitted_values.items():
        detail = ResponseDetail(
            response_id=response.id,
            field_id=field_id,
            value=value,
        )

        db.add(detail)

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="RESPONSE_SUBMITTED",
        entity_type="FORM_RESPONSE",
        entity_id=response.id,
        description=f"Submitted response for form '{form.title}'",
    )

    db.commit()
    db.refresh(response)

    return response


# ============================================================
# List Responses
# ============================================================

@router.get(
    "",
    response_model=FormResponseListResponse,
)
def list_responses(
    form_id: int,
    page: int = Query(
        1,
        ge=1,
    ),
    page_size: int = Query(
        10,
        ge=1,
        le=100,
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status_filter",
    ),
    submitted_by: int | None = Query(
        default=None,
    ),
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
    ),
    search: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_form_or_404(
        form_id,
        db,
    )

    query = (
        db.query(FormResponse)
        .filter(FormResponse.form_id == form_id)
    )

    if status_filter:
        query = query.filter(
            FormResponse.status
            == status_filter.upper()
        )

    if submitted_by is not None:
        query = query.filter(
            FormResponse.submitted_by
            == submitted_by
        )

    if start_date:
        query = query.filter(
            FormResponse.submitted_at
            >= datetime.combine(
                start_date,
                datetime.min.time(),
            )
        )

    if end_date:
        query = query.filter(
            FormResponse.submitted_at
            < datetime.combine(
                end_date,
                datetime.max.time(),
            )
        )

    responses = (
        query
        .order_by(FormResponse.id.desc())
        .all()
    )

    # --------------------------------------------------------
    # Search inside response detail values
    # --------------------------------------------------------

    if search:
        search_lower = search.lower()

        filtered_responses = []

        for response in responses:
            found = False

            for detail in response.details:
                value = detail.value

                if value is None:
                    continue

                if isinstance(value, list):
                    text_value = " ".join(
                        str(item)
                        for item in value
                    )
                else:
                    text_value = str(value)

                if search_lower in text_value.lower():
                    found = True
                    break

            if found:
                filtered_responses.append(
                    response
                )

        responses = filtered_responses

    total = len(responses)

    total_pages = (
        (total + page_size - 1)
        // page_size
        if total > 0
        else 0
    )

    start = (page - 1) * page_size
    end = start + page_size

    paginated_responses = responses[
        start:end
    ]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "responses": paginated_responses,
    }


# ============================================================
# Get Single Response
# ============================================================

@router.get(
    "/{response_id}",
    response_model=FormResponseResponse,
)
def get_response(
    form_id: int,
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = get_response_or_404(
        form_id,
        response_id,
        db,
    )

    return response


# ============================================================
# Get Response History
# ============================================================

@router.get(
    "/{response_id}/history",
    response_model=list[ResponseHistoryResponse],
)
def get_response_history(
    form_id: int,
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = get_response_or_404(
        form_id,
        response_id,
        db,
    )

    history = (
        db.query(ResponseHistory)
        .filter(
            ResponseHistory.response_id
            == response.id
        )
        .order_by(
            ResponseHistory.changed_at.asc(),
            ResponseHistory.id.asc(),
        )
        .all()
    )

    return history


# ============================================================
# Update Response
# ============================================================

@router.put(
    "/{response_id}",
    response_model=FormResponseResponse,
)
def update_response(
    form_id: int,
    response_id: int,
    payload: FormResponseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = get_response_or_404(
        form_id,
        response_id,
        db,
    )

    form = get_form_or_404(
        form_id,
        db,
    )

    submitted_values = {
        item.field_id: item.value
        for item in payload.responses
    }

    validate_form_responses(
        form_id,
        submitted_values,
        db,
    )

    existing_details = {
        detail.field_id: detail
        for detail in response.details
    }

    changed_fields = 0

    for field_id, new_value in submitted_values.items():

        # ----------------------------------------------------
        # Existing response detail
        # ----------------------------------------------------

        if field_id in existing_details:
            detail = existing_details[field_id]

            old_value = detail.value

            if old_value != new_value:

                history = ResponseHistory(
                    response_id=response.id,
                    field_id=field_id,
                    changed_by=current_user.id,
                    old_value=old_value,
                    new_value=new_value,
                    action="UPDATE",
                )

                db.add(history)

                detail.value = new_value

                changed_fields += 1

        # ----------------------------------------------------
        # New response detail
        # ----------------------------------------------------

        else:
            new_detail = ResponseDetail(
                response_id=response.id,
                field_id=field_id,
                value=new_value,
            )

            db.add(new_detail)

            history = ResponseHistory(
                response_id=response.id,
                field_id=field_id,
                changed_by=current_user.id,
                old_value=None,
                new_value=new_value,
                action="CREATE",
            )

            db.add(history)

            changed_fields += 1

    response.status = "UPDATED"

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="RESPONSE_UPDATED",
        entity_type="FORM_RESPONSE",
        entity_id=response.id,
        description=(
            f"Updated response {response.id} "
            f"for form '{form.title}' "
            f"({changed_fields} field(s) changed)"
        ),
    )

    db.commit()
    db.refresh(response)

    return response