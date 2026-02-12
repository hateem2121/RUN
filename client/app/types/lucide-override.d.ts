// Global overrides to fix compatibility issues between React 19 types and libraries
// built with React 18 assumptions (Radix UI, Lucide React, etc.)

import "react";

declare module "react" {
  // Force ForwardRefExoticComponent to return any to bypass strict ReactNode checks
  // (specifically the bigint mismatch between React 18/19 types)
  interface ForwardRefExoticComponent<P> extends NamedExoticComponent<P> {
    // biome-ignore lint/suspicious/noExplicitAny: Required for React 19 type compatibility
    (props: P): any;
  }
}

declare global {
  namespace JSX {
    // biome-ignore lint/suspicious/noExplicitAny: Required for React 19 type compatibility
    type ElementType = any;
  }
}

declare module "lucide-react";
