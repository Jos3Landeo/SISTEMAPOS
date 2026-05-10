import type { Product } from "../../products/types/product";

export type InventoryMovement = {
  id: string;
  movement_type: string;
  quantity: string;
  previous_stock: string;
  new_stock: string;
  reference?: string | null;
  notes?: string | null;
  created_at: string;
  product: Product;
};

export type StockAdjustmentPayload = {
  reason: string;
  notes?: string | null;
  details: Array<{
    product_id: string;
    quantity: number;
  }>;
};
