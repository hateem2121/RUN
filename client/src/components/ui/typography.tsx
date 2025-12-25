import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const headingVariants = cva("mb-[0.75em] text-balance font-bold text-foreground", {
  variants: {
    variant: {
      h1: "text-4xl leading-[1.2] lg:text-5xl", // Matches index.css (2.5rem = text-4xl base)
      h2: "text-3xl leading-[1.25] lg:text-4xl", // Matches index.css (2rem = text-3xl base)
      h3: "text-2xl leading-[1.25] lg:text-3xl", // Matches index.css (1.75rem = text-2xl base)
      h4: "text-xl leading-snug",
      h5: "text-lg leading-snug",
      h6: "text-base leading-snug",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, as, ...props }, ref) => {
    const Component = as || variant || "h1";
    return (
      <Component ref={ref} className={cn(headingVariants({ variant }), className)} {...props} />
    );
  },
);
Heading.displayName = "Heading";

const P = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("mb-4 text-pretty", className)} // Matches index.css p { text-wrap: pretty; margin-bottom: 1rem; }
      {...props}
    />
  ),
);
P.displayName = "P";

const Typography = {
  H1: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h1" as="h1" {...props} />,
  H2: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h2" as="h2" {...props} />,
  H3: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h3" as="h3" {...props} />,
  H4: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h4" as="h4" {...props} />,
  H5: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h5" as="h5" {...props} />,
  H6: (props: Omit<HeadingProps, "variant" | "as">) => <Heading variant="h6" as="h6" {...props} />,
  P,
};

export { Typography };
