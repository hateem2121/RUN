import type { MediaAsset } from "@shared/index";
import type { SustainabilityInitiative } from "@shared/schemas/content/sustainability";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Individual Initiative Card (alternating split)
   ───────────────────────────────────────────── */
function InitiativeRow({
  initiative,
  initiativeImage,
  index,
}: {
  initiative: SustainabilityInitiative;
  initiativeImage?: MediaAsset;
  index: number;
}) {
  const isEven = index % 2 === 0;
  const rowRef = useRef<HTMLDivElement>(null);

  const imageUrl =
    initiativeImage?.url ||
    (initiativeImage?.id && initiativeImage.id < 1000000000000
      ? `/api/media/${initiativeImage.id}/content`
      : undefined);

  useGSAP(
    () => {
      // Content slide-in from left or right
      const contentEl = rowRef.current?.querySelector(".initiative-content");
      if (contentEl) {
        gsap.from(contentEl, {
          scrollTrigger: {
            trigger: rowRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          x: isEven ? 40 : -40,
          duration: 0.8,
          ease: "power3.out",
        });
      }

      // Image parallax effect
      const imageEl = rowRef.current?.querySelector(".initiative-image");
      if (imageEl) {
        gsap.from(imageEl, {
          scrollTrigger: {
            trigger: rowRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          scale: 1.05,
          duration: 1,
          ease: "power2.out",
        });
      }
    },
    { scope: rowRef },
  );

  // Split title: last word gets emerald accent
  const titleWords = initiative.title.split(" ");
  const titleMain = titleWords.slice(0, -1).join(" ");
  const titleAccent = titleWords.slice(-1)[0] ?? "";

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex flex-col items-center gap-12 lg:flex-row",
        !isEven && "lg:flex-row-reverse",
      )}
    >
      {/* Image side */}
      <div className="initiative-image relative h-[400px] w-full overflow-hidden rounded-[32px] lg:w-1/2 group shadow-xl hover:shadow-2xl transition-all duration-500">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={initiative.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[color:var(--s-primary)]/10 to-[color:var(--s-primary)]/5 flex items-center justify-center">
            <div className="text-[color:var(--s-primary)]/30 text-6xl">🌿</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Category label overlay */}
        {initiative.category && (
          <div className="absolute bottom-6 left-6 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-lg">
            {initiative.category}
          </div>
        )}
      </div>

      {/* Content side */}
      <div className={cn("initiative-content flex flex-col gap-6 lg:w-1/2 lg:p-16")}>
        {initiative.impact && (
          <span className="text-sm font-bold uppercase tracking-widest text-[color:var(--s-primary)]">
            {initiative.impact}
          </span>
        )}
        <h3 className="text-4xl lg:text-5xl font-light text-[color:var(--s-text-head)]">
          {titleMain} <span className="font-bold text-[color:var(--s-primary)]">{titleAccent}</span>
        </h3>
        {initiative.description && (
          <p className="text-lg leading-relaxed text-[color:var(--s-text-muted)]">
            {initiative.description}
          </p>
        )}
        {initiative.status && initiative.status !== "inactive" && (
          <a
            href="/sustainability"
            className="group inline-flex items-center text-[color:var(--s-primary)] hover:text-[color:var(--s-text-head)] transition-colors"
          >
            <span className="font-bold">Learn More</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Initiatives Section — Alternating split-screen
   ───────────────────────────────────────────── */
export function InitiativesSection({
  initiatives,
  mediaAssets = [],
  title = "Our Sustainability Initiatives",
  description = "Discover our comprehensive sustainability programs and initiatives driving positive environmental impact.",
}: {
  initiatives: SustainabilityInitiative[];
  mediaAssets?: MediaAsset[];
  title?: string | undefined;
  description?: string | undefined;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Header reveal
      gsap.from(".initiatives-header", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative bg-[color:var(--s-bg)] py-24"
      aria-label="Sustainability initiatives"
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="initiatives-header mb-20 max-w-2xl">
          <h2 className="font-neue-stance text-3xl font-bold text-[color:var(--s-text-head)] md:text-5xl mb-4">
            {title}
          </h2>
          <p className="text-lg text-[color:var(--s-text-muted)]">{description}</p>
        </div>

        <div className="flex flex-col gap-24">
          {initiatives.map((initiative, index) => {
            const initiativeImage = mediaAssets.find((asset) => asset.id === initiative.imageId);
            return (
              <InitiativeRow
                key={initiative.id}
                initiative={initiative}
                index={index}
                {...(initiativeImage !== undefined ? { initiativeImage } : {})}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
