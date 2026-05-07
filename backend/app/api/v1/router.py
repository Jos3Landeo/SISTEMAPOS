from fastapi import APIRouter

from app.api.v1.endpoints import auth, cash, categories, inventory, payment_methods, products, roles, sales, suppliers, users


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(payment_methods.router, prefix="/payment-methods", tags=["payment-methods"])
api_router.include_router(cash.router, prefix="/cash", tags=["cash"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
