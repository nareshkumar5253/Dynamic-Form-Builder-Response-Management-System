
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.form import Form
from app.models.form_field import FormField
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.form_field import (
    ALLOWED_FIELD_TYPES,
    FormFieldCreate,
    FormFieldResponse,
    FormFieldUpdate,
)

router = APIRouter(
    prefix="/forms/{form_id}/fields",
    tags=["Form Fields"],
)


def get_user_form(
    form_id: int,
    current_user: User,
    db: Session,
) -> Form:
    form = (
        db.query(Form)
        .filter(
            Form.id == form_id,
            Form.created_by == current_user.id,
        )
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )

    return form


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


@router.post(
    "",
    response_model=FormFieldResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_field(
    form_id: int,
    field_data: FormFieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = get_user_form(form_id, current_user, db)

    field_type = field_data.field_type.upper()

    if field_type not in ALLOWED_FIELD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid field type. Allowed types: "
                "TEXT, NUMBER, EMAIL, DATE, DROPDOWN, "
                "CHECKBOX, RADIO, FILE, RATING"
            ),
        )

    existing_field = (
        db.query(FormField)
        .filter(
            FormField.form_id == form_id,
            FormField.field_name == field_data.field_name,
        )
        .first()
    )

    if existing_field:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field name already exists in this form",
        )

    new_field = FormField(
        form_id=form_id,
        field_name=field_data.field_name,
        field_label=field_data.field_label,
        field_type=field_type,
        placeholder=field_data.placeholder,
        help_text=field_data.help_text,
        is_required=field_data.is_required,
        field_order=field_data.field_order,
        validation_rules=field_data.validation_rules,
        conditional_logic=field_data.conditional_logic,
    )

    db.add(new_field)
    db.flush()

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FIELD_CREATED",
        entity_type="FORM_FIELD",
        entity_id=new_field.id,
        description=(
            f"Created field '{new_field.field_label}' "
            f"in form '{form.title}'"
        ),
    )

    db.commit()
    db.refresh(new_field)

    return new_field


@router.get(
    "",
    response_model=list[FormFieldResponse],
)
def get_fields(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_user_form(form_id, current_user, db)

    fields = (
        db.query(FormField)
        .filter(FormField.form_id == form_id)
        .order_by(FormField.field_order.asc(), FormField.id.asc())
        .all()
    )

    return fields


@router.get(
    "/{field_id}",
    response_model=FormFieldResponse,
)
def get_field(
    form_id: int,
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_user_form(form_id, current_user, db)

    field = (
        db.query(FormField)
        .filter(
            FormField.id == field_id,
            FormField.form_id == form_id,
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form field not found",
        )

    return field


@router.put(
    "/{field_id}",
    response_model=FormFieldResponse,
)
def update_field(
    form_id: int,
    field_id: int,
    field_data: FormFieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = get_user_form(form_id, current_user, db)

    field = (
        db.query(FormField)
        .filter(
            FormField.id == field_id,
            FormField.form_id == form_id,
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form field not found",
        )

    update_data = field_data.model_dump(exclude_unset=True)

    if "field_type" in update_data:
        field_type = update_data["field_type"].upper()

        if field_type not in ALLOWED_FIELD_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid field type",
            )

        update_data["field_type"] = field_type

    if "field_name" in update_data:
        existing_field = (
            db.query(FormField)
            .filter(
                FormField.form_id == form_id,
                FormField.field_name == update_data["field_name"],
                FormField.id != field_id,
            )
            .first()
        )

        if existing_field:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Field name already exists in this form",
            )

    old_label = field.field_label

    for key, value in update_data.items():
        setattr(field, key, value)

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FIELD_UPDATED",
        entity_type="FORM_FIELD",
        entity_id=field.id,
        description=(
            f"Updated field '{old_label}' "
            f"in form '{form.title}'"
        ),
    )

    db.commit()
    db.refresh(field)

    return field


@router.delete(
    "/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_field(
    form_id: int,
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = get_user_form(form_id, current_user, db)

    field = (
        db.query(FormField)
        .filter(
            FormField.id == field_id,
            FormField.form_id == form_id,
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form field not found",
        )

    field_label = field.field_label
    field_id_value = field.id

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FIELD_DELETED",
        entity_type="FORM_FIELD",
        entity_id=field_id_value,
        description=(
            f"Deleted field '{field_label}' "
            f"from form '{form.title}'"
        ),
    )

    db.delete(field)
    db.commit()

    return None
