import type { Product } from "../../products/types/product";
import type { User } from "../../auth/types/auth";

export type Supplier = {
  id: string;
  name: string;
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: boolean;
};

export type PurchaseDetailPayload = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export type PurchasePayload = {
  supplier_id: string;
  invoice_number?: string | null;
  tax_amount: number;
  notes?: string | null;
  details: PurchaseDetailPayload[];
};

export type PurchaseDetail = {
  id: string;
  product_id: string;
  quantity: string;
  unit_cost: string;
  line_total: string;
  created_at: string;
  updated_at: string;
  product: Product;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  user_id: string;
  invoice_number?: string | null;
  subtotal: string;
  tax_amount: string;
  total: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier: Supplier;
  user: User;
  details: PurchaseDetail[];
};
