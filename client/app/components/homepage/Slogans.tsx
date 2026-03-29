import type React from "react";
import { cn } from "@/lib/utils";

interface SloganItem {
  id: number;
  text: string;
  position?: string | null;
  fontSize?: string | null;
  color?: string | null;
  animationType?: string | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}

interface SlogansProps {
  data: SloganItem[] | undefined;
}

export const Slogans: React.FC<SlogansProps> = ({ data }) => {
  const slogans = data?.filter((s) => s.isActive !== false);

  if (!slogans || slogans.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full overflow-hidden border-y border-foreground/10 bg-background py-6"
      aria-label="Brand Slogans"
    >
      <div
        className={cn(
          "flex animate-marquee whitespace-nowrap will-change-transform",
          "motion-reduce:[animation-play-state:paused]",
        )}
      >
        {/* Repeat 4x for seamless marquee */}
        {[1, 2, 3, 4].map((loop) => (
          <div key={loop} className="flex" aria-hidden={loop > 1}>
            {slogans
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((slogan) => (
                <span
                  key={`${loop}-${slogan.id}`}
                  className={cn(
                    "mx-8 font-bold text-xl tracking-widest uppercase md:mx-16 md:text-2xl",
                    slogan.color ? `text-[${slogan.color}]` : "text-foreground/70",
                  )}
                >
                  {slogan.text}
                  <span className="text-brand-lime mx-4 inline-block text-sm" aria-hidden="true">
                    ●
                  </span>
                </span>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
};
