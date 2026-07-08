import { GsapFadeIn, GsapSlideUp } from "./GsapWrappers";

interface SectionHeaderProps {
  sectionNumber?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({
  sectionNumber,
  title,
  subtitle,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {sectionNumber && (
        <GsapFadeIn delay={0.1}>
          <div className="flex items-center gap-4 text-manufacturing-accent uppercase tracking-widest text-sm font-sans">
            <span className="w-8 h-px bg-manufacturing-accent" />
            SECTION {sectionNumber}
          </div>
        </GsapFadeIn>
      )}
      <GsapSlideUp delay={0.2}>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-heading font-medium tracking-tight text-manufacturing-head">
          {title}
        </h2>
      </GsapSlideUp>
      {subtitle && (
        <GsapSlideUp delay={0.3}>
          <p className="text-lg md:text-xl text-manufacturing-muted max-w-2xl font-sans">
            {subtitle}
          </p>
        </GsapSlideUp>
      )}
    </div>
  );
}
