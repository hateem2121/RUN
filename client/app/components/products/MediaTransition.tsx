import type { MediaAsset } from "@shared/index";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MediaTransitionProps {
  media: MediaAsset;
  isActive: boolean;
  direction: 1 | -1;
  className?: string | undefined;
  children: React.ReactNode;
}

// Smooth transition configurations for different media types
const transitionConfig = {
  image: {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction * 100,
      scale: 0.9,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction * -100,
      scale: 0.9,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    }),
  },
  video: {
    initial: (direction: number) => ({
      opacity: 0,
      y: direction * 50,
      scale: 0.95,
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      y: direction * -50,
      scale: 0.95,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  },
  "3d_model": {
    initial: {
      opacity: 0,
      scale: 0.8,
      rotateY: 180,
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      rotateY: -180,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  },
};

export function MediaTransition({
  media,
  isActive,
  direction,
  className,
  children,
}: MediaTransitionProps) {
  const mediaType = media.type || "image";
  const variants =
    transitionConfig[mediaType as keyof typeof transitionConfig] || transitionConfig.image;

  return (
    <AnimatePresence mode="wait" custom={direction}>
      {isActive && (
        <motion.div
          key={media.id}
          custom={direction}
          variants={variants as any}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn("absolute inset-0", className)}
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
