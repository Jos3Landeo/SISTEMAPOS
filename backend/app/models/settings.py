from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AppSettings(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "app_settings"

    settings_key: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True, default="default")
    company_name: Mapped[str] = mapped_column(String(160), nullable=False, default="", server_default="")
    company_tax_id: Mapped[str] = mapped_column(String(20), nullable=False, default="", server_default="")
    company_address: Mapped[str] = mapped_column(String(255), nullable=False, default="", server_default="")
    company_phone: Mapped[str] = mapped_column(String(60), nullable=False, default="", server_default="")
    company_email: Mapped[str] = mapped_column(String(160), nullable=False, default="", server_default="")
    ticket_footer_message: Mapped[str] = mapped_column(String(255), nullable=False, default="", server_default="")
    scale_enabled: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")
    scale_ean13_prefix: Mapped[str] = mapped_column(String(3), nullable=False, default="20", server_default="20")
    scale_product_code_digits: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    scale_value_digits: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    scale_value_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="weight", server_default="weight")
    scale_value_decimals: Mapped[int] = mapped_column(Integer, nullable=False, default=3, server_default="3")
    scale_lookup_field: Mapped[str] = mapped_column(String(20), nullable=False, default="barcode", server_default="barcode")
    scale_lookup_format: Mapped[str] = mapped_column(String(30), nullable=False, default="code_only", server_default="code_only")
    scale_lookup_prefix: Mapped[str] = mapped_column(String(20), nullable=False, default="", server_default="")
