import { useGSAP } from "@gsap/react";
import type { Certificate } from "@shared/index";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle } from "lucide-react";
import { useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface CertificatesSectionProps {
  certificates: Certificate[];
  title?: string | undefined;
  description?: string | undefined;
  footerNote?: string | undefined;
}

function HexNode({ certificate }: { certificate: Certificate }) {
  return (
    <div className="hex-container group">
      {/* Hexagon shape */}
      <div className="hexagon">
        <div className="flex flex-col items-center justify-center p-2">
          {certificate.imageUrl ? (
            <img
              src={certificate.imageUrl}
              alt={certificate.name}
              className="max-h-16 max-w-[100px] object-contain transition-transform group-hover:scale-110 duration-300"
            />
          ) : (
            <span className="text-xl md:text-2xl font-bold text-[color:var(--s-text-head)] text-center leading-tight">
              {certificate.name}
            </span>
          )}
          <div className="flex items-center gap-1 bg-[color:var(--s-primary)]/10 px-2 py-0.5 rounded-full mt-2">
            <CheckCircle className="h-3.5 w-3.5 text-[color:var(--s-primary)]" />
            <span className="text-[10px] font-medium text-[color:var(--s-primary)] uppercase tracking-wide">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* SVG border overlay */}
      <svg className="hex-border" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" />
      </svg>

      {/* Hover tooltip */}
      <div className="hex-details">
        <h4 className="font-bold text-lg mb-1">{certificate.name}</h4>
        {certificate.issuingBody && (
          <p className="text-xs font-semibold mb-1 text-white/80">{certificate.issuingBody}</p>
        )}
        {certificate.description && (
          <p className="text-xs leading-relaxed mb-3 text-white/60">{certificate.description}</p>
        )}
        <div className="flex justify-between items-center border-t border-[color:var(--s-primary)]/30 pt-2">
          <span className="text-[10px] uppercase text-[color:var(--s-primary)]/80">
            {certificate.type || "Status"}
          </span>
          <span className="text-[10px] font-mono text-white/90">
            {certificate.status || "Verified"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CertificatesSection({
  certificates,
  title = "Trusted Standards",
  description = "We're proud to hold industry-leading certifications that validate our commitment to sustainable and ethical manufacturing practices.",
  footerNote = "These certifications represent our ongoing commitment to environmental responsibility, social accountability, and quality excellence in everything we do.",
}: CertificatesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Header text reveal
      gsap.from(".cert-header-content", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
      });

      // Hexagons staggered reveal
      gsap.from(".hex-container", {
        scrollTrigger: {
          trigger: ".hex-grid",
          start: "top 85%",
        },
        opacity: 0,
        scale: 0.8,
        y: 50,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });

      // Footer note reveal
      if (footerNote) {
        gsap.from(".cert-footer-note", {
          scrollTrigger: {
            trigger: ".cert-footer-note",
            start: "top 90%",
          },
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-[color:var(--s-bg-card)] border-t border-[color:var(--s-border-card)] z-10 overflow-hidden"
    >
      {/* Hex pattern SVG background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute w-full h-full opacity-[0.05]" height="100%" width="100%">
          <defs>
            <pattern height="40" id="hex-cert-pattern" patternUnits="userSpaceOnUse" width="40">
              <path
                d="M20 0 L40 10 L40 30 L20 40 L0 30 L0 10 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect fill="url(#hex-cert-pattern)" height="100%" width="100%" />
        </svg>
      </div>

      <div className="container mx-auto max-w-7xl px-6 lg:px-10 text-center relative z-10">
        <div className="cert-header-content mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--s-primary)] mb-2">
            Verified Impact
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--s-text-head)]">
            {title}
          </h2>
          {description && (
            <p className="mt-4 mx-auto max-w-2xl text-[color:var(--s-text-muted)]">{description}</p>
          )}
        </div>

        {/* Hex Grid */}
        <div className="hex-grid relative pt-10 pb-5">
          {/* Decorative connector lines mapping to Stitch design */}
          <div className="absolute top-[35%] left-[25%] w-[150px] h-[1px] bg-[color:var(--s-text-head)] opacity-5 rotate-12 hidden md:block pointer-events-none" />
          <div className="absolute top-[35%] right-[25%] w-[150px] h-[1px] bg-[color:var(--s-text-head)] opacity-5 -rotate-12 hidden md:block pointer-events-none" />
          <div className="absolute bottom-[35%] left-[30%] w-[100px] h-[1px] bg-[color:var(--s-text-head)] opacity-5 -rotate-45 hidden md:block pointer-events-none" />

          {certificates.map((certificate) => (
            <HexNode key={certificate.id} certificate={certificate} />
          ))}
        </div>

        {/* Footer note */}
        {footerNote && (
          <p className="cert-footer-note mx-auto max-w-2xl text-sm text-[color:var(--s-text-muted)] mt-12">
            {footerNote}
          </p>
        )}
      </div>
    </section>
  );
}
