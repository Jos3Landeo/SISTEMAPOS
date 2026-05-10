from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.settings import AppSettings
from app.repositories.base import BaseRepository


class SettingsRepository(BaseRepository[AppSettings]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AppSettings)

    def get_default(self) -> AppSettings | None:
        stmt = select(AppSettings).where(AppSettings.settings_key == "default")
        return self.db.scalar(stmt)
