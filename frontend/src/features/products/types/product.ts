export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  barcode: string;
  internal_code: string;
  name: string;
  description?: string | null;
  sale_price: string;
  average_cost: string;
  stock_current: string;
  stock_minimum: string;
  allows_decimal: boolean;
  is_active: boolean;
  category?: Category | null;
};

