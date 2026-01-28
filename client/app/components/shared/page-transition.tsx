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

  // Assuming animationProps and delay are defined elsewhere or are placeholders for a larger refactor.
  // For the purpose of this instruction, we are applying the provided snippet directly.
  const animationProps = {
    initial: "initial",
    animate: "in",
    transition: pageTransition,
  };
  const delay = 0; // Placeholder for delay

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={animationProps.initial}
        animate={animationProps.animate}
        // biome-ignore lint/suspicious/noExplicitAny: Animation transition props
        // biome-ignore lint/suspicious/noExplicitAny: Animation transition cast
        transition={{ ...animationProps.transition, delay } as any}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
