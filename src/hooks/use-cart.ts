'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, MenuItem } from '@/lib/types';

interface CartState {
  businessId: string | null;
  businessName: string | null;
  items: CartItem[];
  addItem: (businessId: string, businessName: string, item: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      businessId: null,
      businessName: null,
      items: [],

      addItem: (businessId, businessName, item, quantity = 1) => {
        const state = get();

        if (state.businessId && state.businessId !== businessId) {
          set({ businessId, businessName, items: [{ menuItem: item, quantity, notes: '' }] });
          return;
        }

        const existingIndex = state.items.findIndex(
          (i) => i.menuItem.id === item.id
        );

        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({
            businessId,
            businessName,
            items: [...state.items, { menuItem: item, quantity, notes: '' }],
          });
        }
      },

      removeItem: (menuItemId) => {
        const newItems = get().items.filter((i) => i.menuItem.id !== menuItemId);
        if (newItems.length === 0) {
          set({ businessId: null, businessName: null, items: [] });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.menuItem.id === menuItemId ? { ...i, quantity } : i
        );
        set({ items: newItems });
      },

      clearCart: () => set({ businessId: null, businessName: null, items: [] }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'hatod-cart' }
  )
);
