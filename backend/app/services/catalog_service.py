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

    def find_sellable_product_by_field(self, code: str, field: str | None = None):
        if field == "barcode":
            product = self.products.get_by_barcode(code)
        elif field == "internal_code":
            product = self.products.get_by_internal_code(code)
        else:
            product = self.products.get_by_barcode_or_code(code)

        if not product or not product.is_active:
            raise AppError("Producto no disponible", status.HTTP_404_NOT_FOUND)
        return product

    def create_product(self, payload: ProductCreate):
        existing_barcode = self.products.get_by_barcode(payload.barcode)
        if existing_barcode:
            raise AppError("Ya existe un producto con ese codigo de barras", status.HTTP_409_CONFLICT)

        existing_internal_code = self.products.get_by_internal_code(payload.internal_code)
        if payload.internal_code and existing_internal_code:
            raise AppError("Ya existe un producto con ese codigo interno", status.HTTP_409_CONFLICT)

        try:
            product = self.products.create(payload.model_dump())
            self.db.commit()
            return self.get_product(str(product.id))
        except Exception:
            self.db.rollback()
            raise

    def update_product(self, product_id: str, payload: ProductUpdate):
        product = self.get_product(product_id)
        data = payload.model_dump(exclude_unset=True)
        unit_of_measure = data.get("unit_of_measure", product.unit_of_measure)
        allows_decimal = data.get("allows_decimal", product.allows_decimal)
        if unit_of_measure in {"kg", "g", "l"} and not allows_decimal:
            raise AppError("La unidad seleccionada requiere cantidades decimales", status.HTTP_409_CONFLICT)

        if "barcode" in data and data["barcode"] != product.barcode:
            existing_barcode = self.products.get_by_barcode(data["barcode"])
            if existing_barcode:
                raise AppError("Ya existe un producto con ese codigo de barras", status.HTTP_409_CONFLICT)

        if "internal_code" in data and data["internal_code"] != product.internal_code:
            existing_internal_code = self.products.get_by_internal_code(data["internal_code"])
            if data["internal_code"] and existing_internal_code:
                raise AppError("Ya existe un producto con ese codigo interno", status.HTTP_409_CONFLICT)

        try:
            updated = self.products.update(product, data)
            self.db.commit()
            return self.get_product(str(updated.id))
        except Exception:
            self.db.rollback()
            raise


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
