import type { User } from "./types/auth";

export const PERMISSION_POS = "pos.access";
export const PERMISSION_POS_DISCOUNT = "pos.discount";
export const PERMISSION_PRODUCTS = "products.access";
export const PERMISSION_CATEGORIES = "categories.access";
export const PERMISSION_INVENTORY = "inventory.access";
export const PERMISSION_REPORTS = "reports.access";
export const PERMISSION_SETTINGS = "settings.access";
export const PERMISSION_CASHIERS = "cashiers.access";

export type AppPermission =
  | typeof PERMISSION_POS
  | typeof PERMISSION_POS_DISCOUNT
  | typeof PERMISSION_PRODUCTS
  | typeof PERMISSION_CATEGORIES
  | typeof PERMISSION_INVENTORY
  | typeof PERMISSION_REPORTS
  | typeof PERMISSION_SETTINGS
  | typeof PERMISSION_CASHIERS;

export const permissionOptions: Array<{ value: AppPermission; label: string; description: string }> = [
  { value: PERMISSION_POS, label: "POS", description: "Puede vender, buscar productos y usar caja rapida." },
  { value: PERMISSION_POS_DISCOUNT, label: "Descuentos POS", description: "Puede aplicar descuentos al confirmar una venta." },
  { value: PERMISSION_PRODUCTS, label: "Productos", description: "Puede crear y editar productos." },
  { value: PERMISSION_CATEGORIES, label: "Categorias", description: "Puede crear y editar categorias." },
  { value: PERMISSION_INVENTORY, label: "Inventario", description: "Puede ver movimientos y ajustar stock." },
  { value: PERMISSION_REPORTS, label: "Reportes", description: "Puede revisar ventas e informacion operativa." },
  { value: PERMISSION_SETTINGS, label: "Config", description: "Puede cambiar configuraciones del sistema." },
  { value: PERMISSION_CASHIERS, label: "Cajeros", description: "Puede administrar usuarios, roles y accesos." },
];

const fallbackRolePermissions: Record<string, AppPermission[]> = {
  admin: permissionOptions.map((option) => option.value),
  manager: [
    PERMISSION_POS,
    PERMISSION_POS_DISCOUNT,
    PERMISSION_PRODUCTS,
    PERMISSION_CATEGORIES,
    PERMISSION_INVENTORY,
    PERMISSION_REPORTS,
  ],
  cashier: [PERMISSION_POS],
};

export function getUserPermissions(user: User | null): AppPermission[] {
  if (!user) {
    return [];
  }

  const explicitPermissions = user.role.permissions;
  if (explicitPermissions && explicitPermissions.length > 0) {
    return explicitPermissions as AppPermission[];
  }

  return fallbackRolePermissions[user.role.name] ?? [];
}

export function hasPermission(user: User | null, permission: AppPermission): boolean {
  return getUserPermissions(user).includes(permission);
}
