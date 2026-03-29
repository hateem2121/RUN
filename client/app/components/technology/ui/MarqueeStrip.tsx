import { cn } from "@/lib/utils";

interface MarqueeStripProps {
  items: string[];
  accentColor?: string;
  className?: string;
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
}

export function MarqueeStrip({
  items,
  className,
  direction = "left",
  speed = "normal",
}: MarqueeStripProps) {
  // Duplicate items to ensure smooth infinite scrolling
  const displayItems = [...items, ...items, ...items, ...items];

  const speedClass = {
    slow: "animate-marquee-slow",
    normal: "animate-marquee",
    fast: "animate-marquee-fast",
  }[speed];

  const directionClass = direction === "right" ? "direction-reverse" : "";

  return (
    <div
      className={cn(
        "py-4 overflow-hidden shadow-2xl dark:shadow-[0_0_30px_rgba(0,212,255,0.2)] z-20 relative border-y transition-colors duration-500",
        "bg-[#0047AB] dark:bg-[#00D4FF]",
        "border-white/10 dark:border-white/20",
        className,
      )}
    >
      <div className="relative flex overflow-hidden group">
        <div className={cn("flex whitespace-nowrap group-hover:pause", speedClass, directionClass)}>
          {displayItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="font-neue-stance text-sm text-white dark:text-black font-bold uppercase tracking-[0.3em] mx-6"
            >
              {item} •
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
