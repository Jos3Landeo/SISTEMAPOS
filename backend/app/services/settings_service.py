from sqlalchemy.orm import Session

from app.models.settings import AppSettings
from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import GeneralSettingsRead, GeneralSettingsUpdate, ScaleSettingsRead, ScaleSettingsUpdate


class SettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = SettingsRepository(db)

    def get_scale_settings(self) -> ScaleSettingsRead:
        settings = self._get_or_create_default()
        return self._to_scale_schema(settings)

    def get_general_settings(self) -> GeneralSettingsRead:
        settings = self._get_or_create_default()
        return self._to_general_schema(settings)

    def update_general_settings(self, payload: GeneralSettingsUpdate) -> GeneralSettingsRead:
        settings = self._get_or_create_default()
        settings.company_name = payload.company_name.strip()
        settings.company_tax_id = payload.company_tax_id.strip()
        settings.company_address = payload.company_address.strip()
        settings.company_phone = payload.company_phone.strip()
        settings.company_email = payload.company_email.strip()
        settings.ticket_footer_message = payload.ticket_footer_message.strip()
        self.db.commit()
        self.db.refresh(settings)
        return self._to_general_schema(settings)

    def update_scale_settings(self, payload: ScaleSettingsUpdate) -> ScaleSettingsRead:
        settings = self._get_or_create_default()
        settings.scale_enabled = payload.enabled
        settings.scale_ean13_prefix = payload.ean13_prefix
        settings.scale_product_code_digits = payload.product_code_digits
        settings.scale_value_digits = payload.value_digits
        settings.scale_value_mode = payload.value_mode
        settings.scale_value_decimals = payload.value_decimals
        settings.scale_lookup_field = payload.lookup_field
        settings.scale_lookup_format = payload.lookup_format
        settings.scale_lookup_prefix = payload.lookup_prefix
        self.db.commit()
        self.db.refresh(settings)
        return self._to_scale_schema(settings)

    def _get_or_create_default(self) -> AppSettings:
        settings = self.settings.get_default()
        if settings:
            return settings

        settings = self.settings.create({"settings_key": "default"})
        self.db.commit()
        self.db.refresh(settings)
        return settings

    @staticmethod
    def _to_scale_schema(settings: AppSettings) -> ScaleSettingsRead:
        return ScaleSettingsRead(
            enabled=settings.scale_enabled,
            ean13_prefix=settings.scale_ean13_prefix,
            product_code_digits=settings.scale_product_code_digits,
            value_digits=settings.scale_value_digits,
            value_mode=settings.scale_value_mode,
            value_decimals=settings.scale_value_decimals,
            lookup_field=settings.scale_lookup_field,
            lookup_format=settings.scale_lookup_format,
            lookup_prefix=settings.scale_lookup_prefix,
        )

    @staticmethod
    def _to_general_schema(settings: AppSettings) -> GeneralSettingsRead:
        return GeneralSettingsRead(
            company_name=settings.company_name,
            company_tax_id=settings.company_tax_id,
            company_address=settings.company_address,
            company_phone=settings.company_phone,
            company_email=settings.company_email,
            ticket_footer_message=settings.ticket_footer_message,
        )
