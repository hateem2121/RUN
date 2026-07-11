import type {
  CategoryItem,
  HomepageFeaturedSettings,
  ProcessStep,
  ProductItem,
} from "@shared/types/homepage";

/** @public */ export const CursorVariant = {
  DEFAULT: "DEFAULT",
  TEXT: "TEXT",
  VIEW: "VIEW",
  BUTTON: "BUTTON",
} as const;

export type CursorVariant = (typeof CursorVariant)[keyof typeof CursorVariant];

/** @public */ export interface NavItem {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface Partner {
  name: string;
  tag: string;
}

// Re-export common types from shared for convenience in existing components
export type { CategoryItem, HomepageFeaturedSettings, ProcessStep, ProductItem };
