import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

// --- Headings ---

export const headingVariants = cva("text-balance font-bold transition-colors", {
  variants: {
    variant: {
      h1: "mb-6 text-4xl leading-[1.2] lg:text-5xl",
      h2: "mb-4 text-3xl leading-[1.25] lg:text-4xl",
      h3: "mb-3 text-2xl leading-[1.25] lg:text-3xl",
      h4: "mb-2 text-xl leading-snug",
      h5: "mb-2 text-lg leading-snug",
      h6: "mb-2 text-base leading-snug",
      "hero-heading":
        "mb-8 font-extrabold text-5xl leading-none tracking-tight drop-shadow-lg lg:text-7xl",
      // Display variants using new Phase 1 tokens (responsive clamp-based sizing)
      "display-xs": "font-extrabold text-display-xs tracking-tighter",
      "display-sm": "font-extrabold text-display-sm tracking-tighter",
      "display-md": "font-extrabold text-display-md tracking-tighter",
      "display-lg": "font-black text-display-lg tracking-tighter",
      "display-xl": "font-black text-display-xl tracking-tighter",
    },
    color: {
      default: "text-foreground",
      primary: "text-primary",
      muted: "text-muted-foreground",
      white: "text-white",
      gradient: "bg-linear-to-r from-primary to-brand-purple-light bg-clip-text text-transparent",
    },
  },
  defaultVariants: {
    variant: "h1",
    color: "default",
  },
});

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement;
}

const Heading = ({
  className,
  variant,
  color,
  as,
  ref,
  ...props
}: HeadingProps & { ref?: React.Ref<HTMLHeadingElement> }) => {
  // Default to strict 'h1' if not provided or if variant is special like 'hero-heading'
  const Component =
    as ||
    (variant && variant in ["h1", "h2", "h3", "h4", "h5", "h6"]
      ? (variant as HeadingElement)
      : "h1");

  return (
    <Component
      ref={ref}
      className={cn(className, headingVariants({ variant, color }))}
      {...props}
    />
  );
};
Heading.displayName = "Heading";

// --- Text / Paragraphs ---

export const textVariants = cva("text-pretty transition-colors", {
  variants: {
    variant: {
      p: "mb-4 text-base leading-relaxed",
      lead: "text-muted-foreground text-xl",
      large: "font-semibold text-lg",
      small: "font-medium text-sm leading-none",
      muted: "text-muted-foreground text-sm",
      tiny: "font-medium text-xs leading-[1.2]",
      "subtle-caption": "font-semibold text-muted-foreground text-xs uppercase tracking-wider",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning",
      white: "text-white opacity-90",
    },
  },
  defaultVariants: {
    variant: "p",
    color: "default",
  },
});

type TextElement = "p" | "span" | "div" | "label";

interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}

const Text = ({
  className,
  variant,
  color,
  as = "p",
  ref,
  ...props
}: TextProps & { ref?: React.Ref<HTMLElement> }) => {
  const Component = as;
  return (
    <Component
      // biome-ignore lint/suspicious/noExplicitAny: Component ref cast
      ref={ref as any}
      className={cn(className, textVariants({ variant, color }))}
      {...props}
    />
  );
};
Text.displayName = "Text";

// --- Exports ---

const Typography = {
  H1: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h1" as="h1" {...props} />,
  H2: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h2" as="h2" {...props} />,
  H3: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h3" as="h3" {...props} />,
  H4: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h4" as="h4" {...props} />,
  H5: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h5" as="h5" {...props} />,
  H6: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h6" as="h6" {...props} />,
  Hero: (props: HeadingProps) => <Heading variant="hero-heading" as="h1" {...props} />,
  P: (props: TextProps) => <Text variant="p" as="p" {...props} />,
  Lead: (props: TextProps) => <Text variant="lead" as="p" {...props} />,
  Large: (props: TextProps) => <Text variant="large" as="div" {...props} />,
  Small: (props: TextProps) => <Text variant="small" as="p" {...props} />, // 'small' usually expects p or span
  Muted: (props: TextProps) => <Text variant="muted" as="p" {...props} />,
  Caption: (props: TextProps) => <Text variant="subtle-caption" as="span" {...props} />,
  Text,
  Heading,
};

export { Typography, Heading, Text };
