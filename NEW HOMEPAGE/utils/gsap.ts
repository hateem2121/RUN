import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const splitTextAnimation = (element: HTMLElement) => {
	// Simple fade up util for now since we don't have SplitText plugin (paid)
	return gsap.fromTo(
		element,
		{ y: 100, opacity: 0 },
		{ y: 0, opacity: 1, duration: 1.2, ease: "power4.out" },
	);
};

export default gsap;
