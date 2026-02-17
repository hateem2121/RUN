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

export interface HeroData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface HomepageBatchResponse {
  hero: DataWithTimestamp<HeroData>;
  slogans: DataWithTimestamp<string[]>;
  sections: DataWithTimestamp<unknown[]>;
  featuredProductsSettings: DataWithTimestamp<unknown>;
  products: DataWithTimestamp<ProductItem[]>;
  categories: DataWithTimestamp<CategoryItem[]>;
  processCards: DataWithTimestamp<ProcessStep[]>;
}

// Global augmentation for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      shaderMaterial: any;
      group: any;
      directionalLight: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}

// Augmentation for React 19+ JSX namespace
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      shaderMaterial: any;
      group: any;
      directionalLight: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}
