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
    <div className="mb-16 technology-cta">
      <div className="bg-card rounded-xl p-8 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto">
          {/* Wrapper for card styling */}
          <div className={cn("relative max-w-[500px] mx-auto", className)}>
            <div className="relative">
              {/* Card */}
              <div
                className="
                group
                relative p-8 grid grid-rows-[auto_auto_auto_1fr] items-start gap-6
                min-h-[300px] max-md:min-h-auto max-md:p-6
                bg-card text-foreground border border-border rounded-[15px]
                transition-all duration-300 ease-in-out
                hover:bg-card hover:text-foreground hover:border-primary
                hover:shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.12)]
                hover:-translate-y-[5px]
                motion-reduce:transition-none motion-reduce:hover:transform-none
                contrast-more:border-2 contrast-more:border-white contrast-more:hover:shadow-[0_0_0_3px_hsl(var(--primary))]
              "
              >
                <h2
                  className="
                  text-2xl font-semibold m-0 text-white text-center
                  max-md:text-xl
                  group-hover:text-foreground
                "
                >
                  {headline}
                </h2>

                <p
                  className="
                  text-base leading-relaxed m-0 text-muted-foreground/80 text-center
                  max-md:text-sm
                  group-hover:text-foreground
                "
                >
                  {content}
                </p>

                {benefits && benefits.length > 0 && (
                  <ul
                    className="
                    m-0 p-0 list-none leading-relaxed
                    group-hover:text-foreground
                  "
                    role="list"
                  >
                    {benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="
                        relative pl-6 mb-2
                        before:content-['✓'] before:absolute before:left-0 before:top-0
                        before:text-[hsl(165,82.26%,51.37%)] before:font-bold
                        group-hover:text-foreground group-hover:before:text-foreground
                      "
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  className="
                    block self-end mt-4 mx-auto
                    text-center no-underline
                    text-foreground bg-transparent
                    border border-border rounded-[10px]
                    py-3.5 px-6
                    text-base font-semibold font-inherit
                    cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:bg-primary hover:border-primary hover:text-primary-foreground
                    hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]
                    group-hover:bg-background group-hover:border-border group-hover:text-foreground
                    motion-reduce:transition-none motion-reduce:hover:transform-none
                  "
                  onClick={handleClick}
                  type="button"
                >
                  {buttonLabel}
                </button>
              </div>

              {/* Overlay */}
              <div
                className="
                absolute inset-0 pointer-events-none rounded-[15px]
                bg-[linear-gradient(135deg,hsla(165,82.26%,51.37%,0.1)_0%,transparent_50%,hsla(165,82.26%,51.37%,0.05)_100%)]
                opacity-0 transition-opacity duration-300 ease
                group-hover:opacity-100
                motion-reduce:transition-none
              "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyCta;
