from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.catalog import Category, Product, Supplier
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Category)


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Product)

    def list(self) -> list[Product]:
        stmt = select(Product).options(joinedload(Product.category)).order_by(Product.name.asc())
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, entity_id: str) -> Product | None:
        stmt = select(Product).options(joinedload(Product.category)).where(Product.id == entity_id)
        return self.db.scalar(stmt)

    def get_by_barcode_or_code(self, value: str) -> Product | None:
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(or_(Product.barcode == value, Product.internal_code == value))
        )
        return self.db.scalar(stmt)

    def search(self, term: str) -> list[Product]:
        like = f"%{term}%"
        stmt = (
            select(Product)
            .options(joinedload(Product.category))
            .where(or_(Product.name.ilike(like), Product.barcode.ilike(like), Product.internal_code.ilike(like)))
            .order_by(Product.name.asc())
        )
        return list(self.db.scalars(stmt).unique().all())


class SupplierRepository(BaseRepository[Supplier]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Supplier)
