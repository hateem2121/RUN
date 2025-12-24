import type { AboutHero } from "@shared/schema";
import { ScrollExpandMedia } from "@/components/ui/scroll-expansion-hero";

interface HeroSectionProps {
  heroData: Partial<AboutHero>;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export function HeroSection({ heroData, mediaUrl, mediaType = "image" }: HeroSectionProps) {
  return (
    <ScrollExpandMedia
      mediaType={mediaType}
      mediaSrc={mediaUrl || ""}
      bgImageSrc={mediaUrl || ""}
      title={heroData.title || "About RUN APPAREL"}
      scrollToExpand="Scroll to explore our journey"
      textBlend={false}
      headline={heroData.title || "Leading B2B Sportswear Manufacturing"}
      subheadline={
        heroData.subtitle ||
        "Since 1889, we've been crafting premium athletic apparel for businesses worldwide"
      }
    >
      {heroData.description && (
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {heroData.description}
          </p>
        </div>
      )}
    </ScrollExpandMedia>
  );
}
