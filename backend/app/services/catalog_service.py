from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.repositories.catalog_repository import CategoryRepository, ProductRepository, SupplierRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.supplier import SupplierCreate, SupplierUpdate


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.categories = CategoryRepository(db)

    def list_categories(self):
        return self.categories.list()

    def create_category(self, payload: CategoryCreate):
        category = self.categories.create(payload.model_dump())
        self.db.commit()
        return category

    def update_category(self, category_id: str, payload: CategoryUpdate):
        category = self.categories.get_by_id(category_id)
        if not category:
            raise AppError("Categoria no encontrada", status.HTTP_404_NOT_FOUND)
        updated = self.categories.update(category, payload.model_dump(exclude_unset=True))
        self.db.commit()
        return updated


class ProductService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.products = ProductRepository(db)

    def list_products(self, search: str | None = None):
        if search:
            return self.products.search(search)
        return self.products.list()

    def get_product(self, product_id: str):
        product = self.products.get_by_id(product_id)
        if not product:
            raise AppError("Producto no encontrado", status.HTTP_404_NOT_FOUND)
        return product

    def find_sellable_product(self, code: str):
        product = self.products.get_by_barcode_or_code(code)
        if not product or not product.is_active:
            raise AppError("Producto no disponible", status.HTTP_404_NOT_FOUND)
        return product

    def create_product(self, payload: ProductCreate):
        product = self.products.create(payload.model_dump())
        self.db.commit()
        return self.get_product(str(product.id))

    def update_product(self, product_id: str, payload: ProductUpdate):
        product = self.get_product(product_id)
        updated = self.products.update(product, payload.model_dump(exclude_unset=True))
        self.db.commit()
        return self.get_product(str(updated.id))


class SupplierService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.suppliers = SupplierRepository(db)

    def list_suppliers(self):
        return self.suppliers.list()

    def create_supplier(self, payload: SupplierCreate):
        supplier = self.suppliers.create(payload.model_dump())
        self.db.commit()
        return supplier

    def update_supplier(self, supplier_id: str, payload: SupplierUpdate):
        supplier = self.suppliers.get_by_id(supplier_id)
        if not supplier:
            raise AppError("Proveedor no encontrado", status.HTTP_404_NOT_FOUND)
        supplier = self.suppliers.update(supplier, payload.model_dump(exclude_unset=True))
        self.db.commit()
        return supplier
