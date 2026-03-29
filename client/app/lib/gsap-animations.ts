import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animate a number from its current value to a target value.
 */
export const countUpAnimation = (
  element: HTMLElement | null,
  target: number,
  duration: number = 2,
) => {
  if (!element) return;

  const obj = { value: 0 };
  gsap.to(obj, {
    value: target,
    duration: duration,
    ease: "power2.out",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
    },
    onUpdate: () => {
      element.innerHTML = Math.floor(obj.value).toLocaleString();
    },
  });
};

/**
 * Create a simple marquee animation for an element.
 */
export const marqueeAnimation = (
  element: HTMLElement | null,
  speed: number = 100,
  direction: "left" | "right" = "left",
) => {
  if (!element) return;

  const width = element.offsetWidth;
  const xVal = direction === "left" ? -width / 2 : width / 2;

  const tl = gsap.timeline({ repeat: -1 });
  tl.to(element, {
    x: xVal,
    duration: speed,
    ease: "none",
  });

  return tl;
};

/**
 * Staggered reveal of multiple elements.
 */
export const staggerReveal = (
  elements: HTMLElement[] | NodeListOf<HTMLElement>,
  stagger: number = 0.1,
  y: number = 50,
) => {
  if (!elements.length) return;

  gsap.from(elements, {
    y: y,
    opacity: 0,
    duration: 1,
    stagger: stagger,
    ease: "power3.out",
    scrollTrigger: {
      trigger: elements[0] as HTMLElement,
      start: "top 85%",
    },
  });
};

/**
 * Sets up horizontal scroll locking (pinning) for a section.
 */
export const horizontalScrollLock = (
  container: HTMLElement | null,
  sections: HTMLElement[] | NodeListOf<HTMLElement>,
) => {
  if (!container || !sections.length) return;

  const totalWidth = Array.from(sections).reduce((acc, sec) => acc + sec.offsetWidth, 0);

  gsap.to(sections, {
    x: () => -(totalWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: container,
      pin: true,
      scrub: 1,
      snap: 1 / (sections.length - 1),
      end: () => `+=${totalWidth}`,
    },
  });
};
