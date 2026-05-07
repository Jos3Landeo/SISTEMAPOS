import type { Product } from "../../products/types/product";

export type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
};

export type PaymentLine = {
  payment_method_id: string;
  amount: number;
  reference?: string;
};

