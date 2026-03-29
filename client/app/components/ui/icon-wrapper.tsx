import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const iconWrapperVariants = cva("inline-center-flex shrink-0", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
      icon: "h-10 w-10",
    },
    variant: {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
      warning: "text-warning",
      success: "text-success",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface IconWrapperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconWrapperVariants> {
  asChild?: boolean | undefined;
}

/**
 * reliable wrapper for icons to enforce consistent sizing and coloring
 * avoids "utility soup" like "h-5 w-5 text-neutral-500 shrink-0"
 */
const IconWrapper = ({
  className,
  size,
  variant,
  asChild = false,
  ref,
  ...props
}: IconWrapperProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp className={cn(iconWrapperVariants({ size, variant, className }))} ref={ref} {...props} />
  );
};
IconWrapper.displayName = "IconWrapper";

export { IconWrapper, iconWrapperVariants };
