from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.form import Form
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.form import FormCreate, FormResponse, FormUpdate

router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)


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
    response_model=FormResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_form(
    form_data: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_form = Form(
        title=form_data.title,
        description=form_data.description,
        created_by=current_user.id,
        is_public=form_data.is_public,
        is_enabled=True,
    )

    db.add(new_form)
    db.flush()

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FORM_CREATED",
        entity_type="FORM",
        entity_id=new_form.id,
        description=f"Created form '{new_form.title}'",
    )

    db.commit()
    db.refresh(new_form)

    return new_form


@router.get(
    "",
    response_model=list[FormResponse],
)
def get_forms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forms = (
        db.query(Form)
        .filter(Form.created_by == current_user.id)
        .order_by(Form.id.desc())
        .all()
    )

    return forms


@router.get(
    "/{form_id}",
    response_model=FormResponse,
)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


@router.put(
    "/{form_id}",
    response_model=FormResponse,
)
def update_form(
    form_id: int,
    form_data: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    update_data = form_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(form, field, value)

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FORM_UPDATED",
        entity_type="FORM",
        entity_id=form.id,
        description=f"Updated form '{form.title}'",
    )

    db.commit()
    db.refresh(form)

    return form


@router.delete(
    "/{form_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
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

    if form.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own forms",
        )

    form_title = form.title
    form_id_value = form.id

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FORM_DELETED",
        entity_type="FORM",
        entity_id=form_id_value,
        description=f"Deleted form '{form_title}'",
    )

    db.delete(form)
    db.commit()

    return None


@router.patch(
    "/{form_id}/enable",
    response_model=FormResponse,
)
def enable_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    form.is_enabled = True

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FORM_ENABLED",
        entity_type="FORM",
        entity_id=form.id,
        description=f"Enabled form '{form.title}'",
    )

    db.commit()
    db.refresh(form)

    return form


@router.patch(
    "/{form_id}/disable",
    response_model=FormResponse,
)
def disable_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    form.is_enabled = False

    create_activity_log(
        db=db,
        user_id=current_user.id,
        action="FORM_DISABLED",
        entity_type="FORM",
        entity_id=form.id,
        description=f"Disabled form '{form.title}'",
    )

    db.commit()
    db.refresh(form)

    return form