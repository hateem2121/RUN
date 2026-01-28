declare module "lenis/react" {
  import { ReactNode } from "react";

  export interface ReactLenisProps {
    root?: boolean;
    options?: unknown;
    autoRaf?: boolean;
    rafPriority?: number;
    className?: string;
    children?: ReactNode;
  }

  export const ReactLenis: React.FC<ReactLenisProps>;
  export const useLenis: (callback?: (lenis: unknown) => void, deps?: unknown[]) => unknown;
}
