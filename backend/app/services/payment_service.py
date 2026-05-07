from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.repositories.payment_repository import PaymentMethodRepository
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate


class PaymentMethodService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.payment_methods = PaymentMethodRepository(db)

    def list_methods(self):
        return self.payment_methods.list()

    def create_method(self, payload: PaymentMethodCreate):
        method = self.payment_methods.create(payload.model_dump())
        self.db.commit()
        return method

    def update_method(self, method_id: str, payload: PaymentMethodUpdate):
        method = self.payment_methods.get_by_id(method_id)
        if not method:
            raise AppError("Metodo de pago no encontrado", status.HTTP_404_NOT_FOUND)
        updated = self.payment_methods.update(method, payload.model_dump(exclude_unset=True))
        self.db.commit()
        return updated

