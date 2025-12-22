import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Enhanced animation variants for bento cards
export const cardVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
} as any;

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const fadeInUp = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const scaleIn = {
  initial: {
    scale: 0.8,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

interface AnimatedCardWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  enableHover?: boolean;
}

export function AnimatedCardWrapper({
  children,
  className = "",
  delay = 0,
  enableHover = true
}: AnimatedCardWrapperProps) {
  return (
    <motion.div
      className={className}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={enableHover ? "hover" : undefined}
      whileTap="tap"
      style={{
        transition: `transform 0.2s ease-out, box-shadow 0.2s ease-out`,
        willChange: 'transform, opacity'
      }}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

// Smooth loading state animation
export const LoadingSpinner = ({ size = 24, className = "" }) => (
  <motion.div
    className={`inline-block border-2 border-luxury-gray-300 border-t-luxury-gold rounded-full ${className}`}
    style={{ width: size, height: size }}
    animate={{ rotate: 360 }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }}
  />
);

// Smooth image loading animation
export const ImageLoadAnimation = {
  initial: { opacity: 0, scale: 1.1 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Modal animation variants
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Backdrop animation
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};