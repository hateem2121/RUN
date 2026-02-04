export const CursorVariant = {
  DEFAULT: "DEFAULT",
  TEXT: "TEXT",
  VIEW: "VIEW",
  BUTTON: "BUTTON",
} as const;

export type CursorVariant = (typeof CursorVariant)[keyof typeof CursorVariant];

export interface NavItem {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface Partner {
  name: string;
  tag: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
}

// Batch API Data Wrappers
export interface DataWithTimestamp<T> {
  result: T;
  timestamp: string;
}

export interface HomepageBatchResponse {
  hero: DataWithTimestamp<any>;
  slogans: DataWithTimestamp<any[]>;
  sections: DataWithTimestamp<any[]>;
  featuredProductsSettings: DataWithTimestamp<any>;
  products: DataWithTimestamp<any[]>;
  categories: DataWithTimestamp<any[]>;
}

// Global augmentation for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      mesh: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      planeGeometry: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      shaderMaterial: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      group: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      directionalLight: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      ambientLight: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      pointLight: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      primitive: any;
    }
  }
}

// Augmentation for React 18+ JSX namespace
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      mesh: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      planeGeometry: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      shaderMaterial: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      group: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      directionalLight: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      ambientLight: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      pointLight: any;
      // biome-ignore lint/suspicious/noExplicitAny: Three.js types
      primitive: any;
    }
  }
}
