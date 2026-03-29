// Global overrides to fix compatibility issues between React 19 types and libraries
// built with React 18 assumptions (Radix UI, Lucide React, etc.)

import "react";

declare module "react" {
  // Force ForwardRefExoticComponent to return React.ReactNode to bypass strict ReactNode checks
  // (specifically the bigint mismatch between React 18/19 types)
  interface ForwardRefExoticComponent<P> extends NamedExoticComponent<P> {
    (props: P): React.ReactNode;
  }
}

declare global {
  namespace JSX {
    type ElementType = string | React.JSXElementConstructor<unknown>;
  }
}

declare module "lucide-react";
