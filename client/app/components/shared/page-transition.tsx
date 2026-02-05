import { AnimatePresence, motion } from "framer-motion";
import { useConcurrentLocation } from "@/hooks/useConcurrentLocation";

interface PageTransitionProps {
  children: React.ReactNode;
}
// ... variants ...
const _pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
  // biome-ignore lint/suspicious/noExplicitAny: Animation transition props
} as any;

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useConcurrentLocation();

  const animationProps = {
    initial: "initial",
    animate: "in",
    exit: "out",
    variants: _pageVariants,
    transition: pageTransition,
  };
  const delay = 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        {...animationProps}
        // biome-ignore lint/suspicious/noExplicitAny: Animation transition cast
        transition={{ ...animationProps.transition, delay } as any}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
