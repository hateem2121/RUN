import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AnimatedCardWrapper } from "./enhanced-animations";
import BentoCardErrorBoundary from "./error-boundary";

interface ExpandableCardProps {
  title: string;
  description: string;
  mediaUrl?: string | null;
  link?: string;
  expandedContent?: Array<{
    title: string;
    text: string;
  }>;
  cardId?: string;
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
  const [, setHasError] = useState(false);

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
    <BentoCardErrorBoundary>
      <AnimatedCardWrapper className="w-full h-full">
        {/* Collapsed Card */}
        <motion.div
          className={cn(
            "relative w-full h-full rounded-2xl overflow-hidden cursor-pointer",
            "border border-luxury-light",
            "shadow-sm-luxury-lg hover:shadow-sm-luxury-xl transition-all duration-300",
            "flex flex-col",
            "will-change-transform",
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
          {mediaUrl && (
            <motion.div
              className="absolute inset-0 contain-layout"
              initial={{ scale: 1.1 }}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={mediaUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
              />
            </motion.div>
          )}

          {/* Liquid Glass Effects */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-8">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <motion.h3
                className="md:text-4xl font-neue-stance font-bold text-white mb-2 drop-shadow-lg text-[27px]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {title}
              </motion.h3>
              <motion.p
                className="text-white/80 drop-shadow-md text-[14px]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {description}
              </motion.p>
              <motion.div
                className="mt-4 text-white/90 text-sm font-medium drop-shadow-md"
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
                className="fixed inset-0 bg-black/80 z-max"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
              >
                {/* Background */}
                {mediaUrl && (
                  <div className="absolute inset-0">
                    <img src={mediaUrl} alt={title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Close Button */}
                <motion.button
                  className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                  onClick={() => setIsExpanded(false)}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>

                {/* Modal Content */}
                <motion.div
                  className="relative h-full flex items-center justify-center p-8"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white/5 rounded-3xl p-8 md:p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <motion.div
                      className="space-y-8"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-center">
                        <motion.h2
                          className="text-4xl md:text-6xl font-neue-stance font-bold text-white mb-6 drop-shadow-lg"
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
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white/90 transition-all duration-300 hover:scale-105"
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
                            className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10"
                          >
                            <h4 className="text-2xl font-semibold text-white mb-4 drop-shadow-md">
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
    </BentoCardErrorBoundary>
  );
});

export default ExpandableCard;
