import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { X } from "lucide-react";
import { memo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
// import { LoadingState } from "./enhanced-loading-states";
import { AnimatedCardWrapper } from "./enhanced-animations";
import { EnhancedBentoCardErrorBoundary } from "./enhanced-error-boundary";

interface ExpandableCardProps {
  title: string;
  description: string;
  mediaUrl?: string | null | undefined;
  link?: string | undefined;
  expandedContent?: Array<{
    title: string;
    text: string;
  }>;
  cardId?: string | undefined;
}

export const ExpandableCard = memo(function ExpandableCard({
  title,
  description,
  mediaUrl,
  link,
  expandedContent,
  cardId = "expandable-card",
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [, setMediaLoadError] = useState(false);

  const cardRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleCardClick = () => {
    setIsExpanded(true);
  };

  const layoutId = `${cardId}-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const content =
    expandedContent && expandedContent.length > 0
      ? [{ title, text: description }, ...expandedContent]
      : [
          { title, text: description },
          {
            title: "Features",
            text: "Advanced features and technologies in this category.",
          },
          {
            title: "Quality",
            text: "Our commitment to quality and performance standards.",
          },
          {
            title: "Customization",
            text: "Various customization options available.",
          },
        ];

  // Card entrance animation
  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.from(cardRef.current, { opacity: 0, scale: 0.9, duration: 0.6, ease: "power2.out" });
  }, []);

  // Card text stagger animations
  useGSAP(() => {
    const targets = [titleRef.current, descRef.current, ctaRef.current].filter(Boolean);
    if (!targets.length) return;
    gsap.from(targets, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.2,
    });
  }, []);

  // Modal entrance animation
  useGSAP(() => {
    if (!isExpanded || !modalRef.current) return;
    gsap.from(modalRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    if (closeButtonRef.current) {
      gsap.from(closeButtonRef.current, {
        opacity: 0,
        scale: 0,
        duration: 0.3,
        delay: 0.3,
        ease: "back.out(1.7)",
      });
    }
    if (modalContentRef.current) {
      gsap.from(modalContentRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.3,
        delay: 0.2,
        ease: "power2.out",
      });
    }
  }, [isExpanded]);

  return (
    <EnhancedBentoCardErrorBoundary showTechnicalDetails={false}>
      <AnimatedCardWrapper className="h-full w-full">
        {/* Collapsed Card */}
        <button
          ref={cardRef}
          type="button"
          data-layout-id={layoutId}
          className={cn(
            "relative h-full w-full cursor-pointer overflow-hidden rounded-2xl text-left",
            "border border-luxury-light",
            "shadow-luxury-lg transition-all duration-300 hover:shadow-luxury-xl hover:scale-[1.02]",
            "flex flex-col",
            "contain-layout",
          )}
          style={{
            minHeight: "320px",
            height: "auto",
            maxHeight: "500px",
          }}
          onClick={handleCardClick}
          aria-label={`Expand ${title} details`}
        >
          {/* Background Image */}
          {mediaUrl && !hasError && (
            <div
              ref={bgImageRef}
              className="absolute inset-0 transition-transform duration-700 hover:scale-[1.15]"
            >
              {isMediaLoading && (
                <div className="center-flex absolute inset-0 bg-linear-to-br from-luxury-gray-50 to-luxury-gray-100 dark:from-muted dark:to-background">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-emphasis border-t-blue-500"></div>
                </div>
              )}
              <img
                src={mediaUrl}
                alt={title}
                className="h-full w-full object-cover"
                onLoad={() => setIsMediaLoading(false)}
                onError={() => {
                  setHasError(true);
                  setIsMediaLoading(false);
                  setMediaLoadError(true);
                }}
              />
            </div>
          )}

          {/* Fallback for missing/error media */}
          {(!mediaUrl || hasError) && (
            <div className="center-flex absolute inset-0 bg-linear-to-br from-luxury-gray-50 to-luxury-gray-100 dark:from-muted dark:to-background">
              <div className="text-center text-text-muted dark:text-muted-foreground">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted dark:bg-muted">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm">
                  {hasError ? "Failed to load media" : "No media available"}
                </p>
              </div>
            </div>
          )}

          {/* Liquid Glass Effects */}
          <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

          {/* Content */}
          <div className="relative flex h-full flex-col justify-end p-8">
            <div className="rounded-2xl border border-glass bg-white/5 p-6">
              <h3
                ref={titleRef}
                className="mb-2 font-bold font-neue-stance text-3xl text-white drop-shadow-lg md:text-4xl"
              >
                {title}
              </h3>
              <p ref={descRef} className="text-sm text-white/80 drop-shadow-md">
                {description}
              </p>
              <div ref={ctaRef} className="mt-4 font-medium text-sm text-white/90 drop-shadow-md">
                Click to explore →
              </div>
            </div>
          </div>
        </button>

        {/* Full-Screen Modal */}
        {isExpanded &&
          createPortal(
            <button
              ref={modalRef}
              type="button"
              className="fixed inset-0 z-modal bg-black/80 border-none w-full h-full"
              onClick={() => setIsExpanded(false)}
              aria-label="Close expanded view"
            >
              {/* Background */}
              {mediaUrl && (
                <div className="absolute inset-0">
                  <img src={mediaUrl} alt={title} className="h-full w-full object-cover" />
                </div>
              )}

              {/* Close Button */}
              <button
                ref={closeButtonRef}
                type="button"
                className="absolute top-6 right-6 z-elevated rounded-full bg-white/10 p-3 transition-colors hover:scale-110 hover:bg-white/20"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>

              {/* Modal Content */}
              <div
                ref={modalContentRef}
                className="relative flex h-full items-center justify-center p-8"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="document"
              >
                <div className="max-h-modal w-full max-w-4xl overflow-y-auto rounded-3xl p-8 md:p-12">
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="mb-6 font-bold font-neue-stance text-4xl text-white drop-shadow-lg md:text-6xl">
                        {title}
                      </h2>

                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-white/90 transition-all duration-300 hover:scale-105 hover:bg-white/20"
                        >
                          Explore More Stories
                          <span className="text-lg">→</span>
                        </a>
                      )}
                    </div>

                    <div className="space-y-8">
                      {content.map((section, index) => (
                        <div
                          key={section.title}
                          className="rounded-2xl border border-glass bg-white/5 p-6 md:p-8"
                          style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                        >
                          <h4 className="mb-4 font-semibold text-2xl text-white drop-shadow-md">
                            {section.title}
                          </h4>
                          <p className="text-white/70 leading-relaxed">{section.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </button>,
            document.body,
          )}
      </AnimatedCardWrapper>
    </EnhancedBentoCardErrorBoundary>
  );
});
