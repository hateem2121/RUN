import { Transition } from "framer-motion";

// Spring animation config for "Organic/Spring" feel
export const springTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1,
};

// Standard fade in up animation for sections
export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: springTransition,
};
