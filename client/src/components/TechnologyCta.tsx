import type React from "react";

import { cn } from "@/lib/utils"; // Assuming a utility for class merging exists, otherwise standard template literals

// CTA section uses Tech Card styling; content managed via /admin/technology
export interface TechnologyCtaProps {
  headline: string;
  content: string;
  buttonLabel: string;
  buttonUrl: string;
  benefits?: string[];
  className?: string;
}

const TechnologyCta: React.FC<TechnologyCtaProps> = ({
  headline,
  content,
  buttonLabel,
  buttonUrl,
  benefits = [],
  className,
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
      <div className="rounded-xl border border-border bg-card p-8 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-2xl">
          {/* Wrapper for card styling */}
          <div className={cn("relative mx-auto max-w-[500px]", className)}>
            <div className="relative">
              {/* Card */}
              <div className="group relative grid min-h-[300px] grid-rows-[auto_auto_auto_1fr] items-start gap-6 rounded-[15px] border border-border bg-card p-8 text-foreground transition-all duration-300 ease-in-out hover:-translate-y-[5px] hover:border-primary hover:bg-card hover:text-foreground hover:shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none contrast-more:border-2 contrast-more:border-white contrast-more:hover:shadow-[0_0_0_3px_hsl(var(--primary))] max-md:min-h-auto max-md:p-6">
                <h2 className="m-0 text-center font-semibold text-2xl text-white group-hover:text-foreground max-md:text-xl">
                  {headline}
                </h2>

                <p className="m-0 text-center text-base text-muted-foreground/80 leading-relaxed group-hover:text-foreground max-md:text-sm">
                  {content}
                </p>

                {benefits && benefits.length > 0 && (
                  <ul className="m-0 list-none p-0 leading-relaxed group-hover:text-foreground">
                    {benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="relative mb-2 pl-6 before:absolute before:top-0 before:left-0 before:font-bold before:text-[hsl(165,82.26%,51.37%)] before:content-['✓'] group-hover:text-foreground group-hover:before:text-foreground"
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  className="mx-auto mt-4 block cursor-pointer self-end rounded-[10px] border border-border bg-transparent px-6 py-3.5 text-center font-inherit font-semibold text-base text-foreground no-underline transition-all duration-300 ease-in-out hover:-translate-y-[2px] hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] group-hover:border-border group-hover:bg-background group-hover:text-foreground motion-reduce:transition-none motion-reduce:hover:transform-none"
                  onClick={handleClick}
                  type="button"
                >
                  {buttonLabel}
                </button>
              </div>

              {/* Overlay */}
              <div className="ease pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(135deg,hsla(165,82.26%,51.37%,0.1)_0%,transparent_50%,hsla(165,82.26%,51.37%,0.05)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyCta;
