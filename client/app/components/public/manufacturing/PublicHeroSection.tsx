import { useGSAP } from "@gsap/react";
import type { ManufacturingHero, MediaAsset } from "@shared/index";
import gsap from "gsap";
import { useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { countUpAnimation } from "@/lib/gsap-animations";
import { cn, sanitizeContent } from "@/lib/utils";

interface PublicHeroSectionProps {
  mediaAssets: MediaAsset[];
  hero: ManufacturingHero | undefined;
  stats?: Array<{ label: string; value: number; suffix: string; icon: string }>;
}

export function PublicHeroSection({
  mediaAssets,
  hero,
  stats: dynamicStats,
}: PublicHeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const heroBackgroundAsset =
    Array.isArray(mediaAssets) && hero?.backgroundMediaId
      ? mediaAssets.find((asset) => asset.id === hero.backgroundMediaId)
      : null;

  useGSAP(
    () => {
      if (!hero || !headlineRef.current) return;

      // Split headline into words for staggered animation
      const words = headlineRef.current.innerText.split(" ");
      headlineRef.current.innerHTML = words
        .map((word) => {
          const isHighlighted = word.startsWith("**") && word.endsWith("**");
          const cleanWord = isHighlighted ? word.slice(2, -2) : word;
          return `<span class="inline-block overflow-hidden pb-2 pr-4"><span class="word inline-block ${
            isHighlighted ? "text-[var(--color-manufacturing-accent)] relative" : ""
          }">${cleanWord}${
            isHighlighted
              ? '<span class="absolute -top-2 -right-4 w-3 h-3 bg-[var(--color-manufacturing-accent)] rotate-45 animate-pulse shadow-[0_0_10px_var(--color-manufacturing-accent)]"></span>'
              : ""
          }</span></span>`;
        })
        .join(" ");

      const wordElements = headlineRef.current.querySelectorAll(".word");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headlineRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      tl.from(wordElements, {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power4.out",
      })
        .from(
          subheadlineRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.6",
        )
        .from(
          ctaRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.4",
        );

      const statsElements = statsRef.current?.querySelectorAll(".stat-number");
      statsElements?.forEach((stat) => {
        gsap.from(stat, {
          scrollTrigger: {
            trigger: stat,
            start: "top 90%",
            onEnter: () =>
              countUpAnimation(
                stat as HTMLElement,
                parseFloat((stat as HTMLElement).dataset.target || "0"),
              ),
          },
        });
      });
    },
    { scope: containerRef, dependencies: [hero, dynamicStats] },
  );

  if (!hero) return null;

  const defaultStats = [
    { label: "Machines", value: 200, suffix: "+", icon: "TrendingUp" },
    { label: "Capacity", value: 100, suffix: "K", icon: "Cpu" },
    { label: "Defects", value: 0.05, suffix: "%", icon: "ShieldCheck" },
    { label: "Cycle", value: 24, suffix: "/7", icon: "Zap" },
  ];

  const stats = dynamicStats && dynamicStats.length >= 4 ? dynamicStats : defaultStats;

  const defaultHeadline = "Precision Engineered Performance";
  const displayHeadline = hero.headline || defaultHeadline;

  return (
    <ManufacturingErrorBoundary>
      <div ref={containerRef} className="relative bg-[var(--color-manufacturing-bg)]">
        {/* Header Section */}
        <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
          {/* Floating Sparks Animation Layer */}
          <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute bg-[var(--color-manufacturing-accent)] shadow-[0_0_8px_var(--color-manufacturing-accent)] opacity-40 pointer-events-none spark",
                  i % 3 === 0 ? "w-1 h-1" : i % 2 === 0 ? "w-1.5 h-1.5" : "w-0.5 h-0.5",
                )}
                style={
                  {
                    "--spark-left": `${10 + i * 10}%`,
                    "--spark-bottom": i % 2 === 0 ? "0" : `-${10 + i * 5}%`,
                    "--spark-duration": `${6 + (i % 5)}s`,
                    "--spark-delay": `${i * 0.5}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          <style
            // biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS for spark animation
            dangerouslySetInnerHTML={{
              __html: `
            .spark {
              left: var(--spark-left);
              bottom: var(--spark-bottom);
              animation: float-up var(--spark-duration) linear infinite;
              animation-delay: var(--spark-delay);
            }
            @keyframes float-up {
              0% { transform: translateY(120%) scale(0.5); opacity: 0; }
              10% { opacity: 0.4; }
              90% { opacity: 0.4; }
              100% { transform: translateY(-120%) scale(1.2); opacity: 0; }
            }
          `,
            }}
          />

          {/* Background Images / Gradients */}
          <div className="absolute inset-0 z-0">
            {heroBackgroundAsset ? (
              <OptimizedImage
                mediaId={heroBackgroundAsset.id}
                alt="Manufacturing Background"
                className="w-full h-full object-cover opacity-20 grayscale sepia hue-rotate-15 mix-blend-overlay"
                priority={true}
              />
            ) : (
              <img
                alt="Macro photography of sewing machine needle"
                className="w-full h-full object-cover opacity-20 grayscale sepia hue-rotate-15 mix-blend-overlay"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkSaFr8satMiHuubKnq6ZmnTrhos9xLMveFMM4olbG-J23bK5ywE9wF3atm-z3ne_0ztbPnL1etAMv6bRuKpUbC42HETMKBh0VuEUmOffoQdi7Y_2ipx8QjbDa12BKfSsZhvdoahTOEOsW20djY3Hi8a29So3_Cd0OMzm7Kl1UHZViy2Skj4o7hv61vKsFdjYtgSJp7klmS0SdpX6k9ltAN73ADtT0Yb4TZM_DIhlFs2pGb5ygJWMVAcZJz9wEh5bBtgRByWiLhmw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-manufacturing-bg)] via-[var(--color-manufacturing-bg)]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--color-manufacturing-bg)_100%)]"></div>
            <div className="absolute inset-0 tech-grid-manufacturing [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center h-full pb-20 mt-10">
            <div className="max-w-6xl">
              <div className="inline-flex items-center space-x-3 border-l-4 border-[var(--color-manufacturing-accent)] pl-4 mb-8">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-manufacturing-accent)] font-bold">
                  Est. 1889
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-[#68869A]">
                  ISO 9001:2015 Certified
                </span>
              </div>

              <h1
                id="hero-title"
                ref={headlineRef}
                className="text-[clamp(2.5rem,8vw,5rem)] md:text-[clamp(3.5rem,9vw,7rem)] lg:text-[clamp(4.5rem,10vw,8rem)] font-neue-stance font-bold tracking-tighter uppercase italic leading-[0.85] mb-8 text-white relative transform skew-x-[-2deg] break-words text-balance pr-10"
                aria-label={sanitizeContent(displayHeadline.replace(/\*\*/g, ""))}
              >
                {sanitizeContent(displayHeadline)}
              </h1>

              <p
                ref={subheadlineRef}
                className="text-base md:text-xl text-manufacturing-light max-w-2xl font-light leading-relaxed mb-12 border-l border-white/10 pl-6"
              >
                {sanitizeContent(hero.subheadline) ||
                  "193,000 sq ft of cutting-edge manufacturing space dedicated to the future of technical apparel. Where algorithmic precision meets artisanal expertise."}
              </p>

              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6">
                <a
                  className="inline-flex items-center justify-center bg-[var(--color-manufacturing-accent)] hover:bg-white hover:text-black text-black px-10 py-5 text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] skew-x-[-10deg]"
                  href={hero.ctaLink || "#process"}
                >
                  {hero.ctaText || "Explore Our Process"}
                </a>
                <a
                  className="inline-flex items-center justify-center border border-white/30 hover:border-[var(--color-manufacturing-accent)] hover:text-[var(--color-manufacturing-accent)] text-white px-10 py-5 text-sm font-bold uppercase tracking-widest transition-all hover:bg-[#121212]/50 backdrop-blur-sm skew-x-[-10deg]"
                  href="#tour"
                >
                  Request Factory Tour
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bar Sticky */}
        <section
          ref={statsRef}
          className="sticky top-20 z-40 bg-[var(--color-manufacturing-bg)]/95 backdrop-blur-md border-y border-[var(--color-manufacturing-accent)]/20 shadow-lg shadow-[var(--color-manufacturing-accent)]/10 transition-all duration-300"
          aria-label="Manufacturing Statistics"
        >
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center overflow-x-auto no-scrollbar">
            <div className="flex space-x-12 md:space-x-24 min-w-max mx-auto md:mx-0 w-full md:w-auto justify-between md:justify-start">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row items-center gap-1 md:gap-3 group cursor-default"
                >
                  <span className="text-[var(--color-manufacturing-accent)] font-neue-stance font-bold italic text-3xl group-hover:scale-110 transition-transform skew-x-[-5deg] flex items-baseline">
                    {stat.value === 0.05 ? "<" : ""}
                    <span className="stat-number" data-target={stat.value}>
                      0
                    </span>
                    {stat.suffix}
                  </span>
                  <span className="text-[10px] text-[#E3DFD6] uppercase tracking-widest border-t border-transparent group-hover:border-[var(--color-manufacturing-accent)]/50 pt-1 transition-all font-bold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-[var(--color-manufacturing-accent)]">
              <span className="w-2 h-2 rounded-none rotate-45 bg-[var(--color-manufacturing-accent)] animate-pulse"></span>
              <span className="font-bold tracking-wider">LIVE PRODUCTION STATUS: ACTIVE</span>
            </div>
          </div>
        </section>
      </div>
    </ManufacturingErrorBoundary>
  );
}
