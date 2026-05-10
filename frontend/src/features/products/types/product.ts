export type ProductUnit = "unit" | "kg" | "g" | "l";

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type Product = {
  id: string;
  category_id?: string | null;
  barcode: string;
  internal_code?: string | null;
  name: string;
  description?: string | null;
  unit_of_measure: ProductUnit;
  sale_price: string;
  average_cost: string;
  stock_current: string;
  stock_minimum: string;
  allows_decimal: boolean;
  is_active: boolean;
  category?: Category | null;
};

export type CategoryPayload = {
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type ProductPayload = {
  category_id?: string | null;
  barcode: string;
  internal_code?: string | null;
  name: string;
  description?: string | null;
  unit_of_measure: ProductUnit;
  sale_price: number;
  average_cost: number;
  stock_current?: number;
  stock_minimum: number;
  allows_decimal: boolean;
  is_active?: boolean;
};

export const productUnitOptions: Array<{ value: ProductUnit; label: string; priceLabel: string; stockLabel: string; allowsDecimal: boolean }> = [
  { value: "unit", label: "Unidad", priceLabel: "Precio por unidad", stockLabel: "un", allowsDecimal: false },
  { value: "kg", label: "Kilogramo", priceLabel: "Precio por kilo", stockLabel: "kg", allowsDecimal: true },
  { value: "g", label: "Gramo", priceLabel: "Precio por gramo", stockLabel: "g", allowsDecimal: true },
  { value: "l", label: "Litro", priceLabel: "Precio por litro", stockLabel: "l", allowsDecimal: true },
];

export function getProductUnitMeta(unit: ProductUnit) {
  return productUnitOptions.find((option) => option.value === unit) ?? productUnitOptions[0];
}
