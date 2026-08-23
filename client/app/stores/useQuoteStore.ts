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

const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(name)
        : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch {
      // Ignore storage errors in SSR or restricted environments
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {
      // Ignore
    }
  },
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToQuote: (item) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex((i) => i.id === item.id);
          const existingItem = existingItemIndex > -1 ? state.items[existingItemIndex] : undefined;
          if (existingItem) {
            const newItems = [...state.items];
            newItems[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + item.quantity,
            };
            return { items: newItems };
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
      name: "quote-storage",
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
