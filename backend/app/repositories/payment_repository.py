from sqlalchemy.orm import Session

from app.models.sales import PaymentMethod
from app.repositories.base import BaseRepository


class PaymentMethodRepository(BaseRepository[PaymentMethod]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, PaymentMethod)

