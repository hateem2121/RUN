import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants (using semantic tokens from @theme)
        "status-active":
          "border-transparent bg-status-success-muted text-status-success dark:bg-status-success/20",
        "status-inactive":
          "border-transparent bg-status-inactive-muted text-status-inactive dark:bg-muted dark:text-muted-foreground",
        "status-warning":
          "border-transparent bg-status-warning-muted text-status-warning dark:bg-status-warning/20",
        "status-info":
          "border-transparent bg-status-info-muted text-status-info dark:bg-status-info/20",
        "status-purple":
          "border-transparent bg-status-purple-muted text-primary dark:bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
