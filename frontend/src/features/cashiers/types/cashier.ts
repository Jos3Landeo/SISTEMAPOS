import type { AppPermission } from "../../auth/access";

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  permissions: AppPermission[];
};

export type RolePayload = {
  name: string;
  description?: string | null;
  permissions: AppPermission[];
};

export type CashierUser = {
  id: string;
  full_name: string;
  username: string;
  email?: string | null;
  is_active: boolean;
  role: Role;
};

export type CashierUserPayload = {
  role_id: string;
  full_name: string;
  username: string;
  email?: string | null;
  password?: string;
  is_active?: boolean;
};
