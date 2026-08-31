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

const DEFAULT_SLOGANS: SloganItem[] = [
  { id: 1, text: "PRECISION CUT", isActive: true, sortOrder: 1 },
  { id: 2, text: "HERITAGE CRAFT", isActive: true, sortOrder: 2 },
  { id: 3, text: "ETHICAL PRODUCTION", isActive: true, sortOrder: 3 },
  { id: 4, text: "SUSTAINABLE PERFORMANCE", isActive: true, sortOrder: 4 },
];

export const Slogans: React.FC<SlogansProps> = ({ data }) => {
  const activeData = data?.filter((s) => s.isActive !== false);
  const slogans = activeData && activeData.length > 0 ? activeData : DEFAULT_SLOGANS;

  const sortedSlogans = [...slogans].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <section
      className="w-full overflow-hidden border-y border-foreground/10 bg-background py-6 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      role="region"
      tabIndex={0}
      aria-label="Brand Philosophy Slogans"
    >
      <div
        className={cn(
          "flex animate-marquee whitespace-nowrap",
          "hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] motion-reduce:animate-none",
        )}
      >
        {/* Repeat 4x for seamless marquee */}
        {[1, 2, 3, 4].map((loop) => (
          <div key={loop} className="flex" aria-hidden={loop > 1}>
            {sortedSlogans.flatMap((slogan) => {
              const phrases = slogan.text.includes("|")
                ? slogan.text.split(/\s*\|\s*/).filter(Boolean)
                : [slogan.text];

              return phrases.map((phrase, phraseIdx) => (
                <span
                  key={`${loop}-${slogan.id}-${phraseIdx}`}
                  className={cn(
                    "mx-8 font-bold text-xl tracking-widest uppercase md:mx-16 md:text-2xl",
                    !slogan.color && "text-foreground/80",
                  )}
                  // CMS-driven color override — inline style required as color is dynamic from database
                  style={slogan.color ? { color: slogan.color } : undefined}
                >
                  {phrase}
                  <span
                    className="text-primary dark:text-brand-lime mx-4 inline-block text-sm"
                    aria-hidden="true"
                  >
                    ●
                  </span>
                </span>
              ));
            })}
          </div>
        ))}
      </div>
    </section>
  );
};
