import { create } from "zustand";

import type { CartItem } from "../types/pos";
import type { Product } from "../../products/types/product";

type PosState = {
  items: CartItem[];
  addItem: (product: Product, quantityOverride?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export const usePosStore = create<PosState>((set) => ({
  items: [],
  addItem: (product, quantityOverride) =>
    set((state) => {
      const increment = quantityOverride ?? (product.allows_decimal ? 0.5 : 1);
      const existingItem = state.items.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + increment,
                }
              : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          { product, quantity: increment, unitPrice: Number(product.sale_price) },
        ],
      };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(item.product.allows_decimal ? 0.01 : 1, quantity) }
          : item,
      ),
    })),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) })),
  clearCart: () => set({ items: [] }),
}));
