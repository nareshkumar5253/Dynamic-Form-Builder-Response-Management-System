
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.form import Form
from app.models.form_field import FormField
from app.models.field_option import FieldOption
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.field_option import (
    FieldOptionCreate,
    FieldOptionResponse,
    FieldOptionUpdate,
)

router = APIRouter(
    prefix="/fields/{field_id}/options",
    tags=["Field Options"],
)


def get_user_field(
    field_id: int,
    current_user: User,
    db: Session,
) -> FormField:
    field = (
        db.query(FormField)
        .join(Form, FormField.form_id == Form.id)
        .filter(
            FormField.id == field_id,
            Form.created_by == current_user.id,
        )
        .first()
    )

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form field not found",
        )

    return field


def validate_option_field_type(field: FormField):
    allowed_types = {"DROPDOWN", "CHECKBOX", "RADIO"}

    if field.field_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Options can only be added to "
                "DROPDOWN, CHECKBOX, or RADIO fields"
            ),
        )


def create_activity_log(
    db: Session,
    user_id: int,
    action: str,
    entity_id: int,
    description: str,
):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type="FIELD_OPTION",
        entity_id=entity_id,
        description=description,
    )
    db.add(log)


@router.post(
    "",
    response_model=FieldOptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_option(
    field_id: int,
    option_data: FieldOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_user_field(field_id, current_user, db)
    validate_option_field_type(field)

    existing_option = (
        db.query(FieldOption)
        .filter(
            FieldOption.field_id == field_id,
            FieldOption.option_value == option_data.option_value,
        )
        .first()
    )

    if existing_option:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Option value already exists for this field",
        )

    new_option = FieldOption(
        field_id=field_id,
        option_label=option_data.option_label,
        option_value=option_data.option_value,
        option_order=option_data.option_order,
    )

    db.add(new_option)
    db.flush()

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="OPTION_CREATED",
        entity_id=new_option.id,
        description=(
            f"Created option '{new_option.option_label}' "
            f"for field '{field.field_label}'"
        ),
    )

    db.commit()
    db.refresh(new_option)

    return new_option


@router.get(
    "",
    response_model=list[FieldOptionResponse],
)
def get_options(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_user_field(field_id, current_user, db)
    validate_option_field_type(field)

    options = (
        db.query(FieldOption)
        .filter(FieldOption.field_id == field_id)
        .order_by(
            FieldOption.option_order.asc(),
            FieldOption.id.asc(),
        )
        .all()
    )

    return options


@router.get(
    "/{option_id}",
    response_model=FieldOptionResponse,
)
def get_option(
    field_id: int,
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_user_field(field_id, current_user, db)
    validate_option_field_type(field)

    option = (
        db.query(FieldOption)
        .filter(
            FieldOption.id == option_id,
            FieldOption.field_id == field_id,
        )
        .first()
    )

    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field option not found",
        )

    return option


@router.put(
    "/{option_id}",
    response_model=FieldOptionResponse,
)
def update_option(
    field_id: int,
    option_id: int,
    option_data: FieldOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_user_field(field_id, current_user, db)
    validate_option_field_type(field)

    option = (
        db.query(FieldOption)
        .filter(
            FieldOption.id == option_id,
            FieldOption.field_id == field_id,
        )
        .first()
    )

    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field option not found",
        )

    update_data = option_data.model_dump(exclude_unset=True)

    if "option_value" in update_data:
        existing_option = (
            db.query(FieldOption)
            .filter(
                FieldOption.field_id == field_id,
                FieldOption.option_value == update_data["option_value"],
                FieldOption.id != option_id,
            )
            .first()
        )

        if existing_option:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Option value already exists for this field",
            )

    old_label = option.option_label

    for key, value in update_data.items():
        setattr(option, key, value)

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="OPTION_UPDATED",
        entity_id=option.id,
        description=(
            f"Updated option '{old_label}' "
            f"for field '{field.field_label}'"
        ),
    )

    db.commit()
    db.refresh(option)

    return option


@router.delete(
    "/{option_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_option(
    field_id: int,
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_user_field(field_id, current_user, db)
    validate_option_field_type(field)

    option = (
        db.query(FieldOption)
        .filter(
            FieldOption.id == option_id,
            FieldOption.field_id == field_id,
        )
        .first()
    )

    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field option not found",
        )

    option_label = option.option_label
    option_id_value = option.id

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="OPTION_DELETED",
        entity_id=option_id_value,
        description=(
            f"Deleted option '{option_label}' "
            f"from field '{field.field_label}'"
        ),
    )

    db.delete(option)
    db.commit()

    return None
