import { useGSAP } from "@gsap/react";
import type { AboutTimelineEntry } from "@shared/index";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { Calendar, Sparkles } from "lucide-react";
import { useRef } from "react";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Timeline3DProps {
  entries: AboutTimelineEntry[];
  getAssetUrl: (id: number) => string | null;
  getAsset: (id: number) => unknown;
}

export function Timeline3D({ entries, getAssetUrl, getAsset }: Timeline3DProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Animate section header
      gsap.from(".timeline-header", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Animate central timeline line
      gsap.from(".timeline-line", {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 1.5,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Animate timeline items (cards + markers)
      gsap.from(".timeline-item", {
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.15,
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Animate timeline markers
      gsap.from(".timeline-marker", {
        scale: 0,
        rotation: -180,
        duration: 0.6,
        stagger: 0.2,
        delay: 0.5,
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Floating decorator animation (infinite)
      gsap.to(".timeline-decorator", {
        y: -10,
        rotation: 5,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5,
      });

      // Floating background elements (infinite)
      gsap.to(".timeline-bg-float", {
        y: -15,
        opacity: 0.6,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 1.2,
      });
    },
    { scope: timelineRef },
  );

  return (
    <section className="relative overflow-hidden bg-gradient-light-luxury py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="timeline-header mb-16 text-center">
          <h2 className="luxury-heading-light mb-6 font-bold font-neue-stance text-4xl md:text-5xl">
            Our Journey Through Time
          </h2>
          <p className="luxury-text-light mx-auto max-w-3xl text-xl leading-relaxed">
            From artisanal craftsmanship to modern innovation, discover the milestones that shaped
            RUN APPAREL's legacy of excellence.
          </p>
        </div>

        {/* 3D Timeline Container */}
        <div ref={timelineRef} className="timeline-3d-light relative">
          {/* Central Timeline Line */}
          <div
            className="timeline-line absolute left-1/2 w-1 -translate-x-1/2 transform rounded-full bg-linear-to-b from-blue-200 via-blue-400 to-blue-600 shadow-sm-luxury-light"
            style={{ height: `${entries.length * 300}px`, top: "50px" }}
          />

          {/* Timeline Entries */}
          <div className="space-y-24">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`timeline-item relative flex items-center ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } flex-col`}
              >
                {/* Timeline Marker */}
                <div
                  className={cn(
                    "timeline-marker",
                    cardVariants({ variant: "glass-premium" }),
                    "absolute left-1/2 z-elevated flex h-16 w-16 -translate-x-1/2 transform items-center justify-center rounded-full shadow-sm-luxury-elevated",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Content Card */}
                <div
                  className={`timeline-card-3d w-full md:w-5/12 ${
                    index % 2 === 0 ? "md:mr-auto md:pr-16" : "md:ml-auto md:pl-16"
                  }`}
                >
                  <div
                    className={cn(
                      cardVariants({ variant: "glass-premium" }),
                      "rounded-3xl p-8 shadow-sm-luxury-elevated",
                    )}
                  >
                    {/* Year Badge */}
                    <div className="mb-4 inline-flex items-center gap-2">
                      <div className="stat-card-light rounded-full px-4 py-2">
                        <span className="luxury-heading-light font-bold text-2xl">
                          {entry.year}
                        </span>
                      </div>
                      <Sparkles className="h-5 w-5 text-blue-500" />
                    </div>

                    {/* Title */}
                    <h3 className="luxury-heading-light mb-4 font-bold font-neue-stance text-2xl md:text-3xl">
                      {entry.title}
                    </h3>

                    {/* Description */}
                    <p className="luxury-text-light mb-6 leading-relaxed">{entry.description}</p>

                    {/* Media */}
                    {entry.imageId && getAsset(entry.imageId) && (
                      <div className="relative overflow-hidden rounded-2xl shadow-sm-luxury-light">
                        <img
                          src={getAssetUrl(entry.imageId) || ""}
                          alt={entry.title}
                          className="h-48 w-full object-cover brightness-105 filter"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                      </div>
                    )}

                    {/* Floating Decorator */}
                    <div
                      className={cn(
                        "timeline-decorator",
                        cardVariants({ variant: "glass-subtle" }),
                        `absolute -top-4 ${index % 2 === 0 ? "-right-4" : "-left-4"} h-8 w-8 rounded-full opacity-60`,
                      )}
                    />
                  </div>
                </div>

                {/* Floating Background Elements */}
                <div
                  className={cn(
                    "timeline-bg-float",
                    cardVariants({ variant: "glass-subtle" }),
                    `absolute z-behind ${index % 2 === 0 ? "right-8" : "left-8"} top-8 h-20 w-20 rounded-full opacity-30`,
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div
          className={cn(
            cardVariants({ variant: "glass-subtle" }),
            "floating-element absolute top-20 left-10 h-32 w-32 rounded-full opacity-40",
          )}
        />
        <div
          className={cn(
            cardVariants({ variant: "glass-subtle" }),
            "floating-element absolute right-10 bottom-20 h-24 w-24 rounded-full opacity-30",
          )}
          style={{ animationDelay: "3s" }}
        />
      </div>
    </section>
  );
}
