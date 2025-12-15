import { createContext, useContext } from "react";
import type Lenis from "lenis";

interface LenisContextValue {
  lenis: Lenis | null;
}

export const LenisContext = createContext<LenisContextValue>({
  lenis: null,
});

export const useLenis = () => useContext(LenisContext);
