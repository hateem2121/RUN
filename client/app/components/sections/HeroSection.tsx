import type { AboutHero } from "@shared/index";
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
      mediaSrc={
        mediaUrl ||
        "https://images.unsplash.com/photo-1558444479-c8f0105307ca?q=80&w=2070&auto=format&fit=crop"
      }
      bgImageSrc={
        mediaUrl ||
        "https://images.unsplash.com/photo-1558350849-d798f6583504?q=80&w=2070&auto=format&fit=crop"
      }
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
