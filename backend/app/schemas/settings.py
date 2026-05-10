from typing import Literal

from pydantic import BaseModel, Field, field_validator


ScaleValueMode = Literal["weight", "price"]
ScaleLookupField = Literal["barcode", "internal_code"]
ScaleLookupFormat = Literal["code_only", "prefix_plus_code"]


def format_chilean_rut(value: str) -> str:
    sanitized = "".join(char for char in value if char.isdigit() or char.lower() == "k").upper()
    if not sanitized:
        return ""
    if len(sanitized) < 2:
        raise ValueError("El RUT debe incluir numero y digito verificador")

    body = sanitized[:-1]
    verifier = sanitized[-1]
    if not body.isdigit():
        raise ValueError("El RUT contiene caracteres invalidos")

    reversed_digits = map(int, reversed(body))
    factors = [2, 3, 4, 5, 6, 7]
    total = sum(digit * factors[index % len(factors)] for index, digit in enumerate(reversed_digits))
    remainder = 11 - (total % 11)
    expected_verifier = "0" if remainder == 11 else "K" if remainder == 10 else str(remainder)

    if verifier != expected_verifier:
        raise ValueError("El RUT no es valido")

    formatted_body_parts: list[str] = []
    remaining = body
    while remaining:
        formatted_body_parts.insert(0, remaining[-3:])
        remaining = remaining[:-3]

    return f"{'.'.join(formatted_body_parts)}-{verifier}"


class GeneralSettingsUpdate(BaseModel):
    company_name: str = Field(min_length=1, max_length=160)
    company_tax_id: str = Field(default="", max_length=20)
    company_address: str = Field(default="", max_length=255)
    company_phone: str = Field(default="", max_length=60)
    company_email: str = Field(default="", max_length=160)
    ticket_footer_message: str = Field(default="", max_length=255)

    @field_validator("company_tax_id")
    @classmethod
    def validate_company_tax_id(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            return ""
        return format_chilean_rut(stripped)


class GeneralSettingsRead(GeneralSettingsUpdate):
    pass


class ScaleSettingsUpdate(BaseModel):
    enabled: bool = True
    ean13_prefix: str = Field(default="20", min_length=1, max_length=3)
    product_code_digits: int = Field(default=5, ge=4, le=6)
    value_digits: int = Field(default=5, ge=4, le=6)
    value_mode: ScaleValueMode = "weight"
    value_decimals: int = Field(default=3, ge=0, le=4)
    lookup_field: ScaleLookupField = "barcode"
    lookup_format: ScaleLookupFormat = "code_only"
    lookup_prefix: str = Field(default="", max_length=20)

    @field_validator("ean13_prefix")
    @classmethod
    def validate_numeric_prefix(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("El prefijo EAN-13 debe ser numerico")
        return value


class ScaleSettingsRead(ScaleSettingsUpdate):
    pass
