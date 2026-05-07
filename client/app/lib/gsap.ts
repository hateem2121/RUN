import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Centralized GSAP Registry
 * Resolves GS-003 by ensuring all plugins are registered once.
 * This is the Single Source of Truth for GSAP in RUN Remix.
 */

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };
