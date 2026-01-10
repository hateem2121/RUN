import type { AboutHero } from "@shared/schema";
import { ScrollExpandMedia } from "@/components/ui/scroll-expansion-hero";
import { Typography } from "@/components/ui/typography";

interface HeroSectionProps {
  heroData: Partial<AboutHero>;
  mediaUrl?: string | undefined;
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
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <Typography.P className="text-lg text-muted-foreground leading-relaxed md:text-xl">
            {heroData.description}
          </Typography.P>
        </div>
      )}
    </ScrollExpandMedia>
  );
}
