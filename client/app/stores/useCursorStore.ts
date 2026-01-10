import { create } from "zustand";

export type CursorVariant = "default" | "button" | "view";

interface CursorState {
  cursorVariant: CursorVariant;
  cursorImage: string | null;
  setCursor: (variant: CursorVariant, image?: string | null) => void;
  resetCursor: () => void;
}

/**
 * Cursor store for managing custom cursor state across the application.
 * Used by CustomCursor component to render different cursor states.
 */
export const useCursorStore = create<CursorState>((set) => ({
  cursorVariant: "default",
  cursorImage: null,
  setCursor: (variant, image = null) => set({ cursorVariant: variant, cursorImage: image }),
  resetCursor: () => set({ cursorVariant: "default", cursorImage: null }),
}));
