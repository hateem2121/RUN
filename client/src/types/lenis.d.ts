declare module 'lenis/react' {
  import { ReactNode } from 'react';

  export interface ReactLenisProps {
    root?: boolean;
    options?: any;
    autoRaf?: boolean;
    rafPriority?: number;
    className?: string;
    children?: ReactNode;
  }

  export const ReactLenis: React.FC<ReactLenisProps>;
  export const useLenis: (callback?: (lenis: any) => void, deps?: any[]) => any;
}
