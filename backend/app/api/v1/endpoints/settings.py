from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_permission, require_permissions
from app.core.constants import PERMISSION_POS, PERMISSION_REPORTS, PERMISSION_SETTINGS
from app.db.session import get_db
from app.schemas.settings import GeneralSettingsRead, GeneralSettingsUpdate, ScaleSettingsRead, ScaleSettingsUpdate
from app.services.settings_service import SettingsService


router = APIRouter()


@router.get("/scale", response_model=ScaleSettingsRead)
def get_scale_settings(
    _: object = Depends(require_any_permission(PERMISSION_SETTINGS, PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> ScaleSettingsRead:
    return SettingsService(db).get_scale_settings()


@router.get("/general", response_model=GeneralSettingsRead)
def get_general_settings(
    _: object = Depends(require_any_permission(PERMISSION_SETTINGS, PERMISSION_POS, PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
) -> GeneralSettingsRead:
    return SettingsService(db).get_general_settings()


@router.put("/general", response_model=GeneralSettingsRead)
def update_general_settings(
    payload: GeneralSettingsUpdate,
    _: object = Depends(require_permissions(PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> GeneralSettingsRead:
    return SettingsService(db).update_general_settings(payload)


@router.put("/scale", response_model=ScaleSettingsRead)
def update_scale_settings(
    payload: ScaleSettingsUpdate,
    _: object = Depends(require_permissions(PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> ScaleSettingsRead:
    return SettingsService(db).update_scale_settings(payload)
