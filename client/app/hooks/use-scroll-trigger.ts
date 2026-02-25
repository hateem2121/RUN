import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hook to manage GSAP ScrollTrigger registration and lifecycle.
 * Provides a context-safe way to use ScrollTrigger within components.
 */
export function useScrollTrigger(
  callback: () => void,
  dependencies: any[] = []
): void {
  useGSAP(() => {
    callback();

    // Refresh ScrollTrigger after a slight delay to ensure all DOM elements are rendered
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Kill all triggers associated with this component on unmount
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger) {
          trigger.kill();
        }
      });
    };
  }, dependencies);
}

/**
 * Utility to register common ScrollTrigger defaults for use in this project.
 */
export function registerScrollDefaults() {
  ScrollTrigger.defaults({
    markers: process.env.NODE_ENV === 'development',
    toggleActions: 'play none none reverse',
  });
}
