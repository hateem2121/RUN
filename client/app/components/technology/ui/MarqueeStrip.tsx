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
  accentColor = "#00D4FF",
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
        "py-4 overflow-hidden shadow-lg z-20 relative border-y bg-transparent",
        className,
      )}
      style={{
        borderColor: `${accentColor}40`, // 25% opacity
      }}
    >
      {/* Background gradient overlay matching Stitch design */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
        }}
      />

      <div className="relative flex overflow-hidden group">
        <div className={cn("flex whitespace-nowrap group-hover:pause", speedClass, directionClass)}>
          {displayItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="font-display text-lg text-white font-bold uppercase tracking-[0.15em] mx-6"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
