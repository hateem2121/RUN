import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Button component with support for multiple variants including a new 'glass' style.
 * Uses `cva` for variant management and `radix-ui/slot` for polymorphism.
 */
const buttonVariants = cva(
  "inline-center-flex gap-2 whitespace-nowrap rounded-md font-medium text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "border border-white/10 bg-custom-misc-366 text-white backdrop-blur-md hover:bg-white/20 hover:shadow-xl focus-visible:ring-white/50 active:bg-white/30",
        "glowing-hover":
          "relative overflow-hidden rounded-full border-2 border-primary bg-linear-to-r from-muted to-muted/80 px-6 font-medium text-foreground transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard dark:border-primary dark:from-primary/10 dark:to-primary/20 dark:text-primary-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        pill: "h-12 px-6", // Added for the larger pill shape of the original button
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

const Button = ({ className, variant, size, asChild = false, ref, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
};
Button.displayName = "Button";

export { Button, buttonVariants };
