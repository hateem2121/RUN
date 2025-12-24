import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { PROCESS_STEPS } from "./constants";

// Register Plugin Local Scope as well to be safe
gsap.registerPlugin(ScrollTrigger);

const Process: React.FC = () => {
	const sectionRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const pathRef = useRef<SVGPathElement>(null);

	useEffect(() => {
		// Strict null checks
		if (!sectionRef.current || !triggerRef.current || !pathRef.current) return;

		// Capture refs for cleanup usage
		const triggerEl = triggerRef.current;
		const pathEl = pathRef.current;

		const ctx = gsap.context(() => {
			// Safe Scoped Selector with explicit Generic Type
			const sections = gsap.utils.toArray<HTMLElement>(
				triggerEl.querySelectorAll(".process-card"),
			);

			// Prevent GSAP target null warning if empty
			if (sections.length === 0) return;

			// Initial set for SVG line
			if (pathEl) {
				const length = pathEl.getTotalLength();
				gsap.set(pathEl, { strokeDasharray: length, strokeDashoffset: length });
			}

			// Define animations for different breakpoints
			const setupDesktopAnimation = () => {
				// Calculate exact scroll distance needed for 1:1 mapping
				// Making it slightly larger (e.g. * 1) per section ensures smoother feeling
				const totalScroll = window.innerWidth * (sections.length - 1);

				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: triggerEl,
						pin: true,
						scrub: 1,
						// "top top" works well if header doesn't obscure.
						// If header overlays, "top top" is fine because we want it pinned at viewport top.
						start: "top top",
						end: () => "+=" + totalScroll,
						invalidateOnRefresh: true,
						anticipatePin: 1,
					},
				});

				// Horizontal Scroll - Animate the Wrapper
				if (sectionRef.current) {
					tl.to(
						sectionRef.current,
						{
							xPercent: -100 * (sections.length - 1),
							ease: "none",
						},
						0,
					);
				}

				// SVG Line Drawing syncs with scroll
				if (pathEl) {
					tl.to(
						pathEl,
						{
							strokeDashoffset: 0,
							ease: "none",
						},
						0,
					);
				}
			};

			const setupMobileAnimation = () => {
				if (sectionRef.current) {
					gsap.set(sectionRef.current, { xPercent: 0 });
				}
				gsap.set(sections, { xPercent: 0 });

				// Simple reveal for mobile cards
				sections.forEach((section) => {
					const content = section.querySelector(".content-container");
					if (content) {
						gsap.fromTo(
							content,
							{ y: 50, opacity: 0 },
							{
								y: 0,
								opacity: 1,
								duration: 0.8,
								ease: "power2.out",
								scrollTrigger: {
									trigger: section,
									start: "top 85%",
									toggleActions: "play none none reverse",
								},
							},
						);
					}
				});
			};

			ScrollTrigger.matchMedia({
				// Desktop: Horizontal Scroll
				"(min-width: 768px)": setupDesktopAnimation,

				// Mobile: Vertical Stack (Reset transforms)
				"(max-width: 767px)": setupMobileAnimation,
			});
		}, triggerEl); // Pass element directly, not ref object

		// Force refresh to ensure start/end positions are calculated correctly after render
		ScrollTrigger.refresh();

		return () => {
			ctx.revert();
		};
	}, []);

	return (
		<section className="overflow-hidden bg-[#050505] text-[#FAFAFA]">
			<div
				ref={triggerRef}
				className="min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] w-full flex flex-col md:flex-row md:items-center overflow-x-hidden relative"
			>
				<div className="absolute top-8 left-8 z-20">
					<h3 className="text-sm md:text-xl uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-xs bg-black/20">
						Production Pipeline
					</h3>
				</div>

				{/* Decorative Drawing SVG - Desktop Only */}
				<div
					className="hidden md:block absolute top-1/2 left-0 w-full h-[300px] -translate-y-1/2 pointer-events-none z-0 opacity-30"
					aria-hidden="true"
				>
					<svg
						className="w-full h-full"
						viewBox="0 0 1000 200"
						preserveAspectRatio="none"
					>
						<path
							ref={pathRef}
							d="M0,100 C250,200 500,0 1000,100"
							fill="none"
							stroke="#3300FF"
							strokeWidth="5"
						/>
					</svg>
				</div>

				{/* Container */}
				<div
					className="flex flex-col md:flex-row h-auto md:h-full w-full pt-24 md:pt-0 will-change-transform"
					ref={sectionRef}
				>
					{PROCESS_STEPS.map((step) => (
						<div
							key={step.id}
							className="process-card w-full md:w-screen md:h-full shrink-0 flex items-center justify-center p-4 md:p-12 border-b md:border-b-0 md:border-r border-white/10 relative z-10 min-h-[60vh] md:min-h-0"
						>
							<div className="content-container max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-[#050505]/80 backdrop-blur-md p-6 md:p-12 rounded-xl border border-white/5 overflow-hidden">
								{/* Image Side */}
								<div className="relative aspect-square md:aspect-auto md:h-full overflow-hidden rounded-lg group">
									<img
										src={step.image}
										alt={step.title}
										loading="lazy"
										decoding="async"
										className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 grayscale group-hover:grayscale-0"
									/>
									<div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />

									{/* Big Number Overlay */}
									<span className="absolute top-0 left-0 p-4 text-[15vw] md:text-[8vw] leading-none font-bold text-white mix-blend-overlay opacity-50">
										{step.id}
									</span>
								</div>

								{/* Content Side */}
								<div className="flex flex-col justify-center relative">
									<h2 className="text-[10vw] md:text-[4vw] leading-[0.9] uppercase font-bold mb-4 md:mb-8">
										{step.title}
									</h2>
									<p className="text-base md:text-xl font-light text-gray-400 mb-8 max-w-md leading-relaxed">
										{step.description}
									</p>
									<div className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-white flex items-center justify-center group cursor-pointer hover:bg-white hover:text-black transition-all duration-300">
										<ArrowRight className="w-5 h-5 md:w-6 md:h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<style>{`
        .stroke-text-white {
          -webkit-text-stroke: 2px #FFFFFF;
        }
      `}</style>
		</section>
	);
};

export default Process;
