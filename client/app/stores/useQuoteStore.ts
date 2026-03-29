import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface QuoteItem {
  id: number;
  name: string;
  quantity: number;
  minOrderQuantity: number;
  notes?: string;
  imageUrl?: string;
}

export interface QuoteStore {
  items: QuoteItem[];
  addToQuote: (item: QuoteItem) => void;
  removeFromQuote: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateNotes: (id: number, notes: string) => void;
  clearQuote: () => void;
  totalItems: () => number;
  // UI State
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToQuote: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            // If already in quote, just update quantity (not exceeding logical limits if any, but unrestricted for B2B)
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeFromQuote: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity: quantity } : i)),
        })),

      updateNotes: (id, notes) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, notes: notes } : i)),
        })),

      clearQuote: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, _item) => acc + 1, 0), // Count distinct items

      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "quote-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
