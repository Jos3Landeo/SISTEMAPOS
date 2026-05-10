import type { Product } from "../../products/types/product";
import type { GeneralSettings } from "../../settings/types/settings";

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

export type SaleReceiptDetail = {
  id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_amount: string;
  line_total: string;
  product: Product;
};

export type SaleReceiptPayment = {
  id: string;
  payment_method_id: string;
  amount: string;
  reference?: string | null;
  payment_method: {
    id: string;
    name: string;
    code: string;
  };
};

export type SaleReceipt = {
  id: string;
  user_id: string;
  sale_number: string;
  status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total: string;
  notes?: string | null;
  created_at: string;
  user?: {
    full_name: string;
  };
  details: SaleReceiptDetail[];
  payments: SaleReceiptPayment[];
};

export type SaleListItem = {
  id: string;
  sale_number: string;
  status: string;
  created_at: string;
  total: string;
};

export type TicketPrintPayload = {
  sale: SaleReceipt;
  general: GeneralSettings;
  cashierName?: string | null;
};
