/**
 * Category Color Coding System
 * Provides consistent color theming across product categories
 * Includes color variants for different UI elements
 */

export interface CategoryColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  hover: string;
  badge: string;
  gradient: string;
  tailwindClass: string;
}

// Subtle category hints for monochromatic luxury design
export const categoryColorSchemes: Record<string, CategoryColorScheme> = {
  // Sportswear & Athletic
  sportswear: {
    name: "Sportswear",
    primary: "#2D2D2D", // Consistent with luxury theme
    secondary: "#666666",
    accent: "#E8E8E8",
    background: "#FEFEFE",
    text: "#1A1A1A",
    border: "#4A90E2", // Subtle blue hint for category
    hover: "#1A1A1A",
    badge: "bg-gray-100 text-gray-800",
    gradient: "from-gray-50 to-gray-100",
    tailwindClass: "gray",
  },
  athletic: {
    name: "Athletic",
    primary: "#2D2D2D",
    secondary: "#666666",
    accent: "#E8E8E8",
    background: "#FEFEFE",
    text: "#1A1A1A",
    border: "#50C878", // Subtle green hint
    hover: "#1A1A1A",
    badge: "bg-gray-100 text-gray-800",
    gradient: "from-gray-50 to-gray-100",
    tailwindClass: "gray",
  },
  running: {
    name: "Running",
    primary: "#2D2D2D",
    secondary: "#666666",
    accent: "#E8E8E8",
    background: "#FEFEFE",
    text: "#1A1A1A",
    border: "#DC143C", // Subtle red hint
    hover: "#1A1A1A",
    badge: "bg-gray-100 text-gray-800",
    gradient: "from-gray-50 to-gray-100",
    tailwindClass: "gray",
  },

  // Casual & Lifestyle
  casual: {
    name: "Casual",
    primary: "#10b981", // Emerald
    secondary: "#059669",
    accent: "#34d399",
    background: "#ecfdf5",
    text: "#064e3b",
    border: "#10b981",
    hover: "#059669",
    badge: "bg-emerald-100 text-emerald-800",
    gradient: "from-emerald-500 to-emerald-600",
    tailwindClass: "emerald",
  },
  lifestyle: {
    name: "Lifestyle",
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    background: "#ecfdf5",
    text: "#064e3b",
    border: "#10b981",
    hover: "#059669",
    badge: "bg-emerald-100 text-emerald-800",
    gradient: "from-emerald-500 to-emerald-600",
    tailwindClass: "emerald",
  },
  everyday: {
    name: "Everyday",
    primary: "#8b5cf6", // Violet
    secondary: "#7c3aed",
    accent: "#a78bfa",
    background: "#f5f3ff",
    text: "#5b21b6",
    border: "#8b5cf6",
    hover: "#7c3aed",
    badge: "bg-violet-100 text-violet-800",
    gradient: "from-violet-500 to-violet-600",
    tailwindClass: "violet",
  },

  // Performance & Technical
  performance: {
    name: "Performance",
    primary: "#f59e0b", // Amber
    secondary: "#d97706",
    accent: "#fbbf24",
    background: "#fffbeb",
    text: "#92400e",
    border: "#f59e0b",
    hover: "#d97706",
    badge: "bg-amber-100 text-amber-800",
    gradient: "from-amber-500 to-amber-600",
    tailwindClass: "amber",
  },
  technical: {
    name: "Technical",
    primary: "#6366f1", // Indigo
    secondary: "#4f46e5",
    accent: "#818cf8",
    background: "#f0f9ff",
    text: "#3730a3",
    border: "#6366f1",
    hover: "#4f46e5",
    badge: "bg-indigo-100 text-indigo-800",
    gradient: "from-indigo-500 to-indigo-600",
    tailwindClass: "indigo",
  },

  // Premium & Luxury
  premium: {
    name: "Premium",
    primary: "#374151", // Gray
    secondary: "#1f2937",
    accent: "#6b7280",
    background: "#f9fafb",
    text: "#111827",
    border: "#374151",
    hover: "#1f2937",
    badge: "bg-gray-100 text-gray-800",
    gradient: "from-gray-500 to-gray-600",
    tailwindClass: "gray",
  },
  luxury: {
    name: "Luxury",
    primary: "#7c2d12", // Orange (dark)
    secondary: "#9a3412",
    accent: "#ea580c",
    background: "#fff7ed",
    text: "#7c2d12",
    border: "#ea580c",
    hover: "#9a3412",
    badge: "bg-orange-100 text-orange-800",
    gradient: "from-orange-600 to-orange-700",
    tailwindClass: "orange",
  },

  // Default fallback
  default: {
    name: "Default",
    primary: "#6b7280", // Gray-500
    secondary: "#4b5563",
    accent: "#9ca3af",
    background: "#f9fafb",
    text: "#374151",
    border: "#6b7280",
    hover: "#4b5563",
    badge: "bg-gray-100 text-gray-600",
    gradient: "from-gray-500 to-gray-600",
    tailwindClass: "gray",
  },
};

// Helper function to get color scheme from category name or path
export function getCategoryColorScheme(
  categoryName?: string | null,
  categoryPath?: string | null,
): CategoryColorScheme {
  if (!categoryName && !categoryPath) {
    return categoryColorSchemes.default!;
  }

  // Clean and normalize category name
  const searchTerm = (categoryName || categoryPath || "").toLowerCase().trim();

  // Direct matches first
  const directMatch = categoryColorSchemes[searchTerm];
  if (directMatch) {
    return directMatch;
  }

  // Fuzzy matching for partial matches
  const fuzzyMatches = Object.entries(categoryColorSchemes).find(([key, scheme]) => {
    return (
      searchTerm.includes(key) ||
      key.includes(searchTerm) ||
      searchTerm.includes(scheme.name.toLowerCase())
    );
  });

  if (fuzzyMatches) {
    return fuzzyMatches[1];
  }

  // Default fallback
  return categoryColorSchemes.default!;
}

const categoryClassMap = {
  gray: {
    border: "border-gray-500",
    bg: "bg-gray-50",
    text: "text-gray-700",
    hover: "hover:bg-gray-100",
  },
  emerald: {
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    hover: "hover:bg-emerald-100",
  },
  violet: {
    border: "border-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
    hover: "hover:bg-violet-100",
  },
  amber: {
    border: "border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    hover: "hover:bg-amber-100",
  },
  indigo: {
    border: "border-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    hover: "hover:bg-indigo-100",
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    hover: "hover:bg-orange-100",
  },
} as const;

// Helper function to generate category-themed classes
export function getCategoryClasses(categoryName?: string | null, categoryPath?: string | null) {
  const scheme = getCategoryColorScheme(categoryName, categoryPath);
  // Fallback to gray if the tailwindClass isn't in our map (safety)
  const styles =
    categoryClassMap[scheme.tailwindClass as keyof typeof categoryClassMap] ||
    categoryClassMap.gray;

  return {
    badge: scheme.badge,
    gradient: `bg-gradient-to-r ${scheme.gradient}`,
    border: styles.border,
    bg: styles.bg,
    text: styles.text,
    hover: styles.hover,
    accent: scheme.tailwindClass,
    scheme: scheme,
  };
}

// Generate dynamic CSS custom properties for category theming
export function getCategoryStyles(categoryName?: string | null, categoryPath?: string | null) {
  const scheme = getCategoryColorScheme(categoryName, categoryPath);

  return {
    "--category-primary": scheme.primary,
    "--category-secondary": scheme.secondary,
    "--category-accent": scheme.accent,
    "--category-background": scheme.background,
    "--category-text": scheme.text,
    "--category-border": scheme.border,
    "--category-hover": scheme.hover,
  } as React.CSSProperties;
}

// Category-specific icon mappings (optional enhancement)
export const categoryIcons = {
  sportswear: "🏃‍♂️",
  athletic: "⚡",
  running: "🏃‍♀️",
  casual: "👕",
  lifestyle: "🌟",
  everyday: "📅",
  performance: "🚀",
  technical: "⚙️",
  premium: "💎",
  luxury: "👑",
  default: "📦",
} as const;

// Export utility to get category icon
export function getCategoryIcon(categoryName?: string | null): string {
  const searchTerm = (categoryName || "").toLowerCase().trim();

  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (searchTerm.includes(key)) {
      return icon;
    }
  }

  return categoryIcons.default;
}
