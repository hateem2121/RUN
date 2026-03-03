import type { AboutSection, MediaAsset } from "@shared/index";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaUrlBuilder } from "@/lib/media-url-builder";

interface AnimatedScrollProps {
  sections: AboutSection[];
  mediaAssets: MediaAsset[];
  title?: string | undefined;
  description?: string | undefined;
}

// Helper function to get media URL
const getMediaUrl = (mediaId: number | undefined, mediaAssets: MediaAsset[]): string | null => {
  if (!mediaId) {
    return null;
  }
  const asset = mediaAssets.find((a) => a.id === mediaId);
  return MediaUrlBuilder.buildContentUrl(asset?.id);
};

// Helper function to get first media ID from array
const getFirstMediaId = (mediaIds: number[] | undefined): number | undefined => {
  return mediaIds && mediaIds.length > 0 ? mediaIds[0] : undefined;
};

export default function AnimatedScroll({
  sections,
  mediaAssets,
  title,
  description,
}: AnimatedScrollProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const animTime = 1000;
  const scrolling = useRef(false);

  // Filter active sections and create pages
  const activeSections = sections.filter((section) => section.isActive);

  // Create pages from sections data
  const pages = activeSections.map((section, index) => {
    const isEven = index % 2 === 0;
    const mediaId = getFirstMediaId(section.mediaIds || undefined);
    const mediaUrl = getMediaUrl(mediaId, mediaAssets);

    return {
      leftBgImage: isEven ? mediaUrl : null,
      rightBgImage: !isEven ? mediaUrl : null,
      leftContent: !isEven
        ? {
            heading: section.title,
            description:
              section.content || `Professional ${section.sectionType || "manufacturing"} services`,
          }
        : null,
      rightContent: isEven
        ? {
            heading: section.title,
            description:
              section.content || `Advanced ${section.sectionType || "manufacturing"} capabilities`,
          }
        : null,
    };
  });

  // Add intro page if we have title/description
  if (title && pages.length > 0) {
    pages.unshift({
      leftBgImage: pages[0]?.leftBgImage || pages[0]?.rightBgImage || null,
      rightBgImage: null,
      leftContent: null,
      rightContent: {
        heading: title,
        description:
          description || "Comprehensive B2B sportswear solutions from design to delivery",
      },
    });
  }

  const finalNumOfPages = pages.length;

  const navigateUp = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const navigateDown = useCallback(() => {
    if (currentPage < finalNumOfPages) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, finalNumOfPages]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (scrolling.current) {
        return;
      }
      scrolling.current = true;
      e.deltaY > 0 ? navigateDown() : navigateUp();
      setTimeout(() => {
        scrolling.current = false;
      }, animTime);
    },
    [navigateDown, navigateUp],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (scrolling.current) {
        return;
      }
      if (e.key === "ArrowUp") {
        scrolling.current = true;
        navigateUp();
        setTimeout(() => {
          scrolling.current = false;
        }, animTime);
      } else if (e.key === "ArrowDown") {
        scrolling.current = true;
        navigateDown();
        setTimeout(() => {
          scrolling.current = false;
        }, animTime);
      }
    },
    [navigateUp, navigateDown],
  );

  useEffect(() => {
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, handleWheel]);

  // Don't render if no pages
  if (pages.length === 0) {
    return (
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <h2 className="mb-4 text-3xl font-bold">{title || "Manufacturing Capabilities"}</h2>
          <p className="text-muted-foreground">{description || "No sections configured yet."}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Page Indicator */}
      <div className="z-dock absolute top-8 right-8 flex flex-col gap-2">
        {Array.from({ length: finalNumOfPages }, (_, i) => (
          <button
            key={i + 1}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            onClick={() => {
              if (!scrolling.current) {
                setCurrentPage(i + 1);
              }
            }}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              currentPage === i + 1 ? "scale-125 bg-white" : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Navigation Instructions */}
      <div className="z-dock absolute bottom-8 left-8 text-sm text-white/70">
        <p>Use arrow keys or scroll to navigate</p>
        <p className="mt-1 text-xs">
          {currentPage} of {finalNumOfPages}
        </p>
      </div>

      {pages.map((page, i) => {
        const idx = i + 1;
        const isActive = currentPage === idx;
        const upOff = "translateY(-100%)";
        const downOff = "translateY(100%)";
        const leftTrans = isActive ? "translateY(0)" : downOff;
        const rightTrans = isActive ? "translateY(0)" : upOff;

        return (
          <div key={idx} className="absolute inset-0">
            {/* Left Half */}
            <div
              className="duration-style1-slow absolute top-0 left-0 h-full w-1/2 transition-transform ease-out"
              style={{ transform: leftTrans }}
            >
              <div
                className="relative h-full w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: page.leftBgImage ? `url(${page.leftBgImage})` : undefined,
                  backgroundColor: !page.leftBgImage ? "hsl(240 10% 10%)" : undefined, // surface-dark
                }}
              >
                {/* Overlay for better text readability */}
                {page.leftBgImage && <div className="absolute inset-0 bg-black/40"></div>}

                <div className="z-elevated relative flex h-full flex-col items-center justify-center p-8 text-white">
                  {page.leftContent && (
                    <>
                      <h2 className="mb-6 text-center text-2xl font-bold tracking-wide uppercase md:text-3xl lg:text-4xl">
                        {page.leftContent.heading}
                      </h2>
                      <p className="max-w-md text-center text-lg leading-relaxed md:text-xl">
                        {page.leftContent.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Half */}
            <div
              className="duration-style1-slow absolute top-0 left-1/2 h-full w-1/2 transition-transform ease-out"
              style={{ transform: rightTrans }}
            >
              <div
                className="relative h-full w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: page.rightBgImage ? `url(${page.rightBgImage})` : undefined,
                  backgroundColor: !page.rightBgImage ? "hsl(240 10% 16%)" : undefined, // surface-dark variant
                }}
              >
                {/* Overlay for better text readability */}
                {page.rightBgImage && <div className="absolute inset-0 bg-black/40"></div>}

                <div className="z-elevated relative flex h-full flex-col items-center justify-center p-8 text-white">
                  {page.rightContent && (
                    <>
                      <h2 className="mb-6 text-center text-2xl font-bold tracking-wide uppercase md:text-3xl lg:text-4xl">
                        {page.rightContent.heading}
                      </h2>
                      {typeof page.rightContent.description === "string" ? (
                        <p className="max-w-md text-center text-lg leading-relaxed md:text-xl">
                          {page.rightContent.description}
                        </p>
                      ) : (
                        <div className="max-w-md text-center text-lg leading-relaxed md:text-xl">
                          {page.rightContent.description}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
