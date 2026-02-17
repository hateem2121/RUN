import { Globe, Leaf, ShieldCheck, Zap } from "lucide-react";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { useStore } from "./store";
import { CursorVariant } from "./types";

interface ValuesCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  colSpan?: string | undefined;
  withRipple?: boolean | undefined;
  isMobile: boolean;
  setCursor: (variant: CursorVariant) => void;
  image: string;
}

const ValuesCard: React.FC<ValuesCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  colSpan = "col-span-1",
  withRipple = false, // Kept in prop interface but unused
  isMobile,
  setCursor,
  image,
}) => {
  const IconComponent = Icon;

  return (
    <Card
      className={cn(
        colSpan,
        "group relative flex min-h-value-card flex-col justify-between overflow-hidden border-border p-0 transition-all duration-500 will-change-transform hover:-translate-y-1 hover:shadow-2xl",
      )}
      variant="glass-premium"
      onMouseEnter={() => !isMobile && setCursor(CursorVariant.BUTTON)}
      onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-base">
        <ImageWithSkeleton
          src={image}
          alt={title}
          decoding="async"
          className="h-full w-full object-cover opacity-50 grayscale transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0"
          containerClassName="h-full w-full"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-base bg-linear-to-t from-surface-dark via-surface-dark/40 to-transparent dark:from-black dark:via-black/40" />

      {/* 
        Hover Ripple Effect Replacement 
        Simple CSS radial gradient overlay on hover instead of WebGL 
      */}
      {withRipple && (
        <div className="absolute inset-0 z-base bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.3)_0%,transparent_70%)] opacity-0 transition-opacity duration-700 pointer-events-none group-hover:opacity-30" />
      )}

      <CardContent className="relative z-elevated flex h-full flex-col justify-between p-8">
        <div className="flex w-full justify-end">
          {IconComponent && (
            <IconComponent
              className={cn(
                "h-12 w-12 stroke-1 transition-colors duration-300",
                withRipple ? "text-blue-400" : "text-muted-foreground/70 group-hover:text-blue-400",
              )}
            />
          )}
        </div>
        <div>
          <h3 className="mb-2 font-bold text-2xl text-foreground uppercase">{title}</h3>
          <p className="text-muted-foreground/70 transition-colors group-hover:text-foreground/80">
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Values: React.FC = () => {
  const setCursor = useStore((state) => state.setCursor);
  const isMobile = useIsMobile();

  return (
    <section
      className="w-full bg-background-alt px-4 py-32 md:px-8"
      role="region"
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
            image="https://images.unsplash.com/photo-1598967990158-b12e3e9d8995?q=80&w=2070&auto=format&fit=crop"
          />
          <ValuesCard
            title="Eco-Forward"
            subtitle="40% Water reduction in dyeing processes."
            icon={Leaf}
            withRipple={true}
            isMobile={!!isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1976&auto=format&fit=crop"
          />
          <ValuesCard
            title="Global Reach"
            subtitle="Distribution centers in 12 countries."
            icon={Globe}
            isMobile={!!isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
          />
          <ValuesCard
            title="Rapid Prototyping"
            subtitle="Concept to sample in 72 hours."
            icon={Zap}
            colSpan="md:col-span-2"
            isMobile={!!isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
          />
        </div>

        {/* Scrolling Ticker */}
        <div
          className="mt-24 w-full overflow-hidden border-foreground border-y py-6"
          aria-hidden="true"
        >
          <div className="flex animate-marquee whitespace-nowrap">
            {Array(10)
              .fill("GOTS CERTIFIED • OEKO-TEX STANDARD 100 • FAIR TRADE • ISO 9001 • ")
              .map((text, i) => (
                <span key={i} className="mx-4 font-mono text-xl">
                  {text}
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;
