import type React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// CVA Definition for the Tech Card to eliminate "Utility Soup"
const techCardVariants = cva(
  "group relative grid min-h-72 grid-rows-[auto_auto_auto_1fr] items-start gap-6 rounded-xl border border-border bg-card p-6 text-foreground transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:bg-card hover:text-foreground hover:shadow-glow-lg motion-reduce:transition-none motion-reduce:hover:transform-none contrast-more:border-2 contrast-more:border-white contrast-more:hover:shadow-none md:p-8",
  {
    variants: {
      intent: {
        default: "border-border",
        highlight: "border-primary",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  },
);

export interface TechnologyCtaProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof techCardVariants> {
  headline: string;
  content: string;
  buttonLabel: string;
  buttonUrl: string;
  benefits?: string[];
}

const TechnologyCta: React.FC<TechnologyCtaProps> = ({
  headline,
  content,
  buttonLabel,
  buttonUrl,
  benefits = [],
  className,
  intent,
  ...props
}) => {
  const handleClick = () => {
    // Open external URLs in new tab
    if (buttonUrl.startsWith("http")) {
      window.open(buttonUrl, "_blank", "noopener,noreferrer");
    } else {
      // Internal navigation
      window.location.href = buttonUrl;
    }
  };

  return (
    <div className="technology-cta mb-16">
      <div className="rounded-xl border border-border bg-card p-8 shadow-glow-sm">
        <div className="mx-auto max-w-2xl">
          {/* Wrapper for card styling */}
          <div className={cn("relative mx-auto max-w-lg", className)}>
            <div className="relative">
              {/* Card */}
              <div className={cn(techCardVariants({ intent }))} {...props}>
                <Typography.H2 className="m-0 text-center font-semibold text-2xl text-white group-hover:text-foreground max-md:text-xl">
                  {headline}
                </Typography.H2>

                <Typography.P className="m-0 text-center text-base text-muted-foreground/80 leading-relaxed group-hover:text-foreground max-md:text-sm">
                  {content}
                </Typography.P>

                {benefits && benefits.length > 0 && (
                  <ul className="m-0 list-none p-0 leading-relaxed group-hover:text-foreground">
                    {benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="relative mb-2 pl-6 before:absolute before:top-0 before:left-0 before:font-bold before:text-brand-teal before:content-['✓'] group-hover:text-foreground group-hover:before:text-foreground"
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant="outline"
                  className="mx-auto mt-4 block self-end transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow-md group-hover:border-border group-hover:bg-background group-hover:text-foreground motion-reduce:transition-none motion-reduce:hover:transform-none"
                  onClick={handleClick}
                  type="button"
                >
                  {buttonLabel}
                </Button>
              </div>

              {/* Overlay */}
              <div className="ease pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-brand-teal),transparent_90%)_0%,transparent_50%,color-mix(in_oklch,var(--color-brand-teal),transparent_95%)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyCta;
