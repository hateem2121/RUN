import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface BaseGsapProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function GsapFadeIn({ children, className = "", delay = 0, duration = 0.6 }: BaseGsapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
      });

      tl.from(containerRef.current, {
        opacity: 0,
        duration,
        delay,
        ease: "power2.out",
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.progress(1).kill();
      }
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export function GsapSlideUp({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: BaseGsapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
      });

      tl.from(containerRef.current, {
        y: 40,
        opacity: 0,
        duration,
        delay,
        ease: "power3.out",
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.progress(1).kill();
      }
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export function GsapParallax({
  children,
  className = "",
  speed = 0.5,
}: BaseGsapProps & { speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(containerRef.current, {
        yPercent: speed * 100,
        ease: "none",
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.progress(1).kill();
      }
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
