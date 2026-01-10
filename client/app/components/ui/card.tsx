import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-xl transition-all duration-300", {
  variants: {
    variant: {
      default: "border border-border bg-card text-card-foreground shadow-card",
      // Premium glass effect with glow (migrated from glass-card)
      "glass-premium":
        "relative overflow-hidden border border-white/10 bg-(--glass-premium) text-white shadow-glass shadow-glow-lg backdrop-blur-md md:shadow-glow-lg-desktop dark:border-white/5",
      // Subtle glass for lighter use cases
      "glass-subtle": "border border-white/5 bg-white/5 text-white shadow-none backdrop-blur-sm",
      // Elevated with stronger shadow
      elevated: "border border-border bg-card text-card-foreground shadow-popup",
      // Outline only (no fill)
      outline: "border border-border bg-transparent text-card-foreground",
    },
    size: {
      default: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
    interactive: {
      true: "cursor-pointer transition-all duration-300 hover:border-primary/20 hover:shadow-popup",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    interactive: false,
  },
});

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

const Card = React.memo(({ className, variant, size, interactive, ref, ...props }: CardProps) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, size, interactive }), className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.memo(({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.memo(({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div
    ref={ref}
    className={cn("font-semibold text-2xl leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.memo(({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.memo(({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.memo(({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
