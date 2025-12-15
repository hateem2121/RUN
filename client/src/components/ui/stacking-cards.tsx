import { useTransform, motion, useScroll, MotionValue } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { AboutSection, MediaAsset } from "@shared/schema";

interface StackingCard {
  title: string;
  description: string;
  mediaId?: number;
  color: string;
  sectionType: string;
}

interface StackingCardsProps {
  sections: AboutSection[];
  getAssetUrl: (mediaId: number) => string | null;
  getAsset: (mediaId: number) => MediaAsset | null;
}

interface CardProps {
  i: number;
  title: string;
  description: string;
  mediaId?: number;
  color: string;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  getAssetUrl: (mediaId: number) => string | null;
  getAsset: (mediaId: number) => MediaAsset | null;
}

// Color mapping for different section types
const getSectionColor = (sectionType: string): string => {
  const colors: Record<string, string> = {
    manufacturing: "#5196fd",
    quality: "#8f89ff",
    global: "#13006c",
    innovation: "#ed649e",
    sustainability: "#fd521a",
    custom: "#2563eb",
  };
  return colors[sectionType] || "#6366f1";
};

// Hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export const Card: React.FC<CardProps> = ({
  i,
  title,
  description,
  mediaId,
  color,
  progress,
  range,
  targetScale,
  getAssetUrl,
  getAsset,
}) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "start start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  const imageUrl = mediaId ? getAssetUrl(mediaId) : null;
  const mediaAsset = mediaId ? getAsset(mediaId) : null;
  const isMobile = useIsMobile();

  return (
    <div ref={container} className="h-screen flex items-center justify-center sticky top-0">
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
          pointerEvents: "auto",
        }}
        className={`flex flex-col relative -top-[25%] min-h-[450px] w-[85%] max-w-6xl rounded-xl p-6 md:p-8 origin-top overflow-hidden group bg-white/10 dark:bg-white/5 backdrop-blur-md border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)]`}
      >
        {/* Gradient overlay with color accent */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none"
          style={{
            borderRadius: "0.75rem",
            backgroundColor: `${color}15`,
          }}
        />

        {/* Inner glow with color tint */}
        <div
          className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
          style={{
            background: `linear-gradient(to bottom right, ${color}10, transparent)`,
          }}
        />

        {/* Hover shimmer effect - disabled on mobile for performance */}
        {!isMobile && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ borderRadius: "0.75rem" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-4 shrink-0">
            {title}
          </h2>
          <div className={`flex flex-col md:flex-row flex-1 gap-6 md:gap-8 items-stretch`}>
            <div className={`w-full md:w-[40%] flex flex-col justify-center min-h-0`}>
              <p className="text-sm md:text-base text-white/90 leading-relaxed mb-6 flex-1">
                {description}
              </p>
              <div className="flex items-center gap-2 text-white/80 shrink-0">
                <span className="text-sm underline cursor-pointer hover:text-white transition-colors">
                  Learn more about our capabilities
                </span>
                <svg
                  width="22"
                  height="12"
                  viewBox="0 0 22 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21.5303 6.53033C21.8232 6.23744 21.8232 5.76256 21.5303 5.46967L16.7574 0.696699C16.4645 0.403806 15.9896 0.403806 15.6967 0.696699C15.4038 0.989592 15.4038 1.46447 15.6967 1.75736L19.9393 6L15.6967 10.2426C15.4038 10.5355 15.4038 11.0104 15.6967 11.3033C15.9896 11.5962 16.4645 11.5962 16.7574 11.3033L21.5303 6.53033ZM0 6.75L21 6.75V5.25L0 5.25L0 6.75Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <div
              className={`relative w-full md:w-[60%] min-h-[280px] md:min-h-[320px] rounded-lg overflow-hidden bg-white/10`}
            >
              {imageUrl && mediaAsset ? (
                <motion.div
                  className={`w-full h-full absolute inset-0`}
                  style={{ scale: imageScale }}
                >
                  {mediaAsset.type === "video" ? (
                    <video
                      src={imageUrl}
                      className="w-full h-full object-cover rounded-lg"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <OptimizedImage
                      mediaId={mediaId!}
                      alt={title}
                      quality={90}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <div className="text-center text-white/60">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm">Visual coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function StackingCards({ sections, getAssetUrl, getAsset }: StackingCardsProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  // Sort sections by position and filter active ones
  const sortedSections = sections
    .filter((section) => section.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Transform sections into stacking cards data
  const stackingCards: StackingCard[] = sortedSections.map((section) => ({
    title: section.title || "Manufacturing Capability",
    description: section.content || "Professional manufacturing services tailored to your needs.",
    mediaId: section.mediaIds && section.mediaIds.length > 0 ? section.mediaIds[0] : undefined,
    color: getSectionColor(section.sectionType),
    sectionType: section.sectionType,
  }));

  if (stackingCards.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Our Manufacturing Capabilities
          </h2>
          <p className="text-muted-foreground">No manufacturing capabilities configured yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={container} className="bg-slate-950 text-white">
      {/* Header Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.25, 0.25, 0.75],
            }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
              Our Manufacturing
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Capabilities
              </span>
            </h2>
            <motion.p
              className="mx-auto max-w-[700px] text-lg md:text-xl text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.25, 0.25, 0.25, 0.75],
              }}
            >
              Discover our comprehensive B2B sportswear solutions through our advanced manufacturing
              capabilities
            </motion.p>
            <motion.p
              className="text-sm text-gray-400 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.5,
                delay: 0.4,
                ease: [0.25, 0.25, 0.25, 0.75],
              }}
            >
              <span>Scroll down to explore</span>
              <svg
                className="w-4 h-4 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Stacking Cards Section */}
      <div>
        {stackingCards.map((card, i) => {
          const targetScale = 1 - (stackingCards.length - i) * 0.05;
          return (
            <Card
              key={`manufacturing_${i}`}
              i={i}
              title={card.title}
              description={card.description}
              mediaId={card.mediaId}
              color={card.color}
              progress={scrollYProgress}
              range={[i * (1 / stackingCards.length), 1]}
              targetScale={targetScale}
              getAssetUrl={getAssetUrl}
              getAsset={getAsset}
            />
          );
        })}
      </div>
    </section>
  );
}
