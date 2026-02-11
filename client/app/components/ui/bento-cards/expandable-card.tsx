import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { memo, useState } from "react";
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

const ExpandableCard = memo(function ExpandableCard({
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

  return (
    <EnhancedBentoCardErrorBoundary showTechnicalDetails={false}>
      <AnimatedCardWrapper className="h-full w-full">
        {/* Collapsed Card */}
        <motion.div
          className={cn(
            "relative h-full w-full cursor-pointer overflow-hidden rounded-2xl",
            "border border-luxury-light",
            "shadow-luxury-lg transition-all duration-300 hover:shadow-luxury-xl",
            "flex flex-col",
            "contain-layout",
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleCardClick}
          layoutId={layoutId}
          style={{
            minHeight: "320px",
            height: "auto",
            maxHeight: "500px",
          }}
        >
          {/* Background Image */}
          {mediaUrl && !hasError && (
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.1 }}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.6 }}
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
            </motion.div>
          )}

          {/* Fallback for missing/error media */}
          {(!mediaUrl || hasError) && (
            <div className="center-flex absolute inset-0 bg-linear-to-br from-luxury-gray-50 to-luxury-gray-100 dark:from-muted dark:to-background">
              <div className="text-center text-text-muted dark:text-muted-foreground">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted dark:bg-muted">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <motion.h3
                className="mb-2 font-bold font-neue-stance text-3xl text-white drop-shadow-lg md:text-4xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {title}
              </motion.h3>
              <motion.p
                className="text-sm text-white/80 drop-shadow-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {description}
              </motion.p>
              <motion.div
                className="mt-4 font-medium text-sm text-white/90 drop-shadow-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Click to explore →
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Full-Screen Modal */}
        {isExpanded &&
          createPortal(
            <AnimatePresence>
              <motion.div
                className="fixed inset-0 z-modal bg-black/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
              >
                {/* Background */}
                {mediaUrl && (
                  <div className="absolute inset-0">
                    <img src={mediaUrl} alt={title} className="h-full w-full object-cover" />
                  </div>
                )}

                {/* Close Button */}
                <motion.button
                  className="absolute top-6 right-6 z-elevated rounded-full bg-white/10 p-3 transition-colors hover:bg-white/20"
                  onClick={() => setIsExpanded(false)}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-6 w-6 text-white" />
                </motion.button>

                {/* Modal Content */}
                <motion.div
                  className="relative flex h-full items-center justify-center p-8"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="max-h-modal w-full max-w-4xl overflow-y-auto rounded-3xl p-8 md:p-12">
                    <motion.div
                      className="space-y-8"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-center">
                        <motion.h2
                          className="mb-6 font-bold font-neue-stance text-4xl text-white drop-shadow-lg md:text-6xl"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          {title}
                        </motion.h2>

                        {link && (
                          <motion.a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-white/90 transition-all duration-300 hover:scale-105 hover:bg-white/20"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            Explore More Stories
                            <span className="text-lg">→</span>
                          </motion.a>
                        )}
                      </div>

                      <div className="space-y-8">
                        {content.map((section, index) => (
                          <motion.div
                            key={section.title}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="rounded-2xl border border-glass bg-white/5 p-6 md:p-8"
                          >
                            <h4 className="mb-4 font-semibold text-2xl text-white drop-shadow-md">
                              {section.title}
                            </h4>
                            <p className="text-white/70 leading-relaxed">{section.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
      </AnimatedCardWrapper>
    </EnhancedBentoCardErrorBoundary>
  );
});

export default ExpandableCard;
