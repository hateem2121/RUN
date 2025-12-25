import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "",
        ghost: "resize-none border-none bg-transparent shadow-none",
        filled:
          "resize-none border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-black focus:ring-offset-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = ({ className, variant, ref, ...props }: TextareaProps) => {
  return <textarea className={cn(textareaVariants({ variant, className }))} ref={ref} {...props} />;
};
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
