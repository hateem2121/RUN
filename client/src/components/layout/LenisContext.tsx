import type Lenis from "lenis";
import { createContext, useContext } from "react";

interface LenisContextValue {
  lenis: Lenis | null;
}

export const LenisContext = createContext<LenisContextValue>({
  lenis: null,
});

export const useLenis = () => useContext(LenisContext);
