import { Globe, Leaf, ShieldCheck, Zap } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { type CursorVariant, useCursorStore } from "@/stores/useCursorStore";

interface ValuesCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  colSpan?: string | undefined;
  withRipple?: boolean | undefined;
  isMobile: boolean;
  setCursor: (variant: CursorVariant, image?: string | null) => void;
  resetCursor: () => void;
  image: string;
}

const ValuesCard: React.FC<ValuesCardProps> = memo(
  ({ title, subtitle, icon: Icon, colSpan = "col-span-1", withRipple = false, image }) => {
    const IconComponent = Icon;

    return (
      <Card
        className={cn(
          colSpan,
          "scroll-reveal group relative flex min-h-value-card flex-col justify-between overflow-hidden border-border p-0 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl motion-reduce:transform-none",
        )}
        variant="glass-premium"
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-base">
          <ImageWithSkeleton
            src={image}
            alt={title}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-50 grayscale transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0"
            containerClassName="h-full w-full"
          />
        </div>

        {/* High-Contrast Gradient Overlay */}
        <div className="absolute inset-0 z-base bg-linear-to-t from-black/90 via-black/50 to-black/20" />

        {/* Hover Ripple Effect */}
        {withRipple && (
          <div className="absolute inset-0 z-base bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.3)_0%,transparent_70%)] opacity-0 transition-opacity duration-700 pointer-events-none group-hover:opacity-30" />
        )}

        <CardContent className="relative z-elevated flex h-full flex-col justify-between p-8">
          <div className="flex w-full justify-end">
            {IconComponent && (
              <IconComponent
                aria-hidden="true"
                className={cn(
                  "h-12 w-12 stroke-1 transition-colors duration-300",
                  withRipple ? "text-primary" : "text-white/70 group-hover:text-primary",
                )}
              />
            )}
          </div>
          <div>
            <h3 className="mb-2 font-bold text-2xl text-white uppercase tracking-tight">{title}</h3>
            <p className="text-white/80 leading-relaxed font-light text-base">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    );
  },
);

export const Values: React.FC = () => {
  const { setCursor, resetCursor } = useCursorStore();
  const isMobile = useIsMobile();

  return (
    <section
      className="w-full bg-background-alt px-4 py-32 md:px-8"
      aria-labelledby="values-heading"
    >
      <div className="mx-auto max-w-container-2xl">
        <h2
          id="values-heading"
          className="mb-16 text-center font-bold text-display-xl uppercase leading-none"
        >
          Built on <span className="font-serif italic">Precision</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ValuesCard
            title="Heritage Innovation"
            subtitle="135 Years of textile engineering mastery."
            icon={ShieldCheck}
            colSpan="md:col-span-2"
            isMobile={!!isMobile}
            setCursor={setCursor}
            resetCursor={resetCursor}
            image="/images/homepage/values-1.webp"
          />
          <ValuesCard
            title="Eco-Forward"
            subtitle="40% Water reduction in dyeing processes."
            icon={Leaf}
            withRipple={true}
            isMobile={!!isMobile}
            setCursor={setCursor}
            resetCursor={resetCursor}
            image="/images/homepage/values-2.webp"
          />
          <ValuesCard
            title="Global Reach"
            subtitle="Distribution centers in 12 countries."
            icon={Globe}
            isMobile={!!isMobile}
            setCursor={setCursor}
            resetCursor={resetCursor}
            image="/images/homepage/values-3.webp"
          />
          <ValuesCard
            title="Rapid Prototyping"
            subtitle="Concept to sample in 72 hours."
            icon={Zap}
            colSpan="md:col-span-2"
            isMobile={!!isMobile}
            setCursor={setCursor}
            resetCursor={resetCursor}
            image="/images/homepage/values-4.webp"
          />
        </div>

        {/* Scrolling Cert Ticker with WCAG Pause */}
        <section
          className="mt-24 w-full overflow-hidden border-foreground border-y py-6 motion-reduce:overflow-x-auto"
          aria-label="Quality and Environmental Certifications"
          tabIndex={0}
          role="region"
        >
          <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none">
            {Array(8)
              .fill("GOTS CERTIFIED • OEKO-TEX STANDARD 100 • FAIR TRADE • ISO 9001 • ")
              .map((text, i) => (
                <span key={i} className="mx-4 font-mono text-xl text-foreground font-medium">
                  {text}
                </span>
              ))}
          </div>
        </section>
      </div>
    </section>
  );
};
