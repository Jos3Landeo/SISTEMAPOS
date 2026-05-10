PRODUCT_UNIT_VALUES = ("unit", "kg", "g", "l")

PERMISSION_POS = "pos.access"
PERMISSION_POS_DISCOUNT = "pos.discount"
PERMISSION_PRODUCTS = "products.access"
PERMISSION_CATEGORIES = "categories.access"
PERMISSION_INVENTORY = "inventory.access"
PERMISSION_REPORTS = "reports.access"
PERMISSION_SETTINGS = "settings.access"
PERMISSION_CASHIERS = "cashiers.access"

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin": [
        PERMISSION_POS,
        PERMISSION_POS_DISCOUNT,
        PERMISSION_PRODUCTS,
        PERMISSION_CATEGORIES,
        PERMISSION_INVENTORY,
        PERMISSION_REPORTS,
        PERMISSION_SETTINGS,
        PERMISSION_CASHIERS,
    ],
    "manager": [
        PERMISSION_POS,
        PERMISSION_POS_DISCOUNT,
        PERMISSION_PRODUCTS,
        PERMISSION_CATEGORIES,
        PERMISSION_INVENTORY,
        PERMISSION_REPORTS,
    ],
    "cashier": [
        PERMISSION_POS,
    ],
}

AVAILABLE_PERMISSIONS = tuple(ROLE_PERMISSIONS["admin"])
