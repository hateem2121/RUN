import { create } from 'zustand';
import { CursorVariant } from './types';

interface AppState {
  cursorVariant: CursorVariant;
  cursorText: string;
  cursorImage: string | null;
  setCursor: (variant: CursorVariant, text?: string, image?: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  cursorVariant: CursorVariant.DEFAULT,
  cursorText: "",
  cursorImage: null,
  setCursor: (variant, text = "", image = null) => set({ cursorVariant: variant, cursorText: text, cursorImage: image }),
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));