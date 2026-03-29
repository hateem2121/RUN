// import { useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Award,
  Factory,
  Globe2,
  Package,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AboutHeroSectionProps {
  headline: string;
  subheadline: string;
  statistics?: Array<{
    label: string;
    value: string;
    unit: string;
    icon: string;
  }>;
  backgroundImage?: string | undefined;
}

export function AboutHeroSection({
  headline,
  subheadline,
  statistics = [],
  backgroundImage,
}: AboutHeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".about-hero-text", { opacity: 0, y: 20, duration: 0.6, stagger: 0.15 });
      gsap.from(".about-hero-image", { opacity: 0, x: 100, duration: 0.8 });

      if (statsRef.current) {
        ScrollTrigger.create({
          trigger: statsRef.current,
          start: "top 85%",
          onEnter: () =>
            gsap.from(".about-stat-item", {
              opacity: 0,
              scale: 0.8,
              duration: 0.5,
              stagger: 0.1,
            }),
        });
      }
    },
    { scope: containerRef },
  );

  return (
    <section className="w-full overflow-hidden py-12 md:py-24 lg:py-32 xl:py-48">
      <div
        ref={containerRef}
        className="container rounded-3xl border border-muted bg-linear-to-br from-background to-muted/30 px-4 md:px-6"
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_400px] lg:gap-3 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4 py-10">
            <div className="space-y-3">
              <div className="about-hero-text inline-flex items-center rounded-3xl bg-muted px-3 py-1 text-sm">
                <Zap className="mr-1 h-3 w-3" />
                B2B Sportswear Manufacturing
              </div>
              <h1 className="about-hero-text font-bold text-4xl tracking-tighter sm:text-5xl xl:text-6xl/none">
                {headline.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  {headline.split(" ").slice(-1)[0]}
                </span>
              </h1>
              <p className="about-hero-text max-w-2xl text-muted-foreground md:text-xl">
                {subheadline}
              </p>
            </div>
            <div className="about-hero-text flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="group rounded-3xl">
                Explore Our Capabilities
                <span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button variant="outline" size="lg" className="rounded-3xl">
                Global Presence
              </Button>
            </div>
          </div>
          <div className="about-hero-image center-flex">
            <div className="relative h-[350px] w-full overflow-hidden rounded-3xl md:h-[450px] lg:h-modal-sm xl:h-[550px]">
              {backgroundImage ? (
                <img
                  src={backgroundImage}
                  alt="About RUN APPAREL"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-purple-500/20">
                  <Factory className="h-24 w-24 text-primary/40" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        {statistics.length > 0 && (
          <div ref={statsRef} className="mt-8 mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {statistics.map((stat, index) => {
              const IconComponent =
                stat.icon === "Globe"
                  ? Globe2
                  : stat.icon === "Award"
                    ? Award
                    : stat.icon === "TrendingUp"
                      ? TrendingUp
                      : stat.icon === "Sparkles"
                        ? Sparkles
                        : stat.icon === "Factory"
                          ? Factory
                          : stat.icon === "Users"
                            ? Users
                            : Package;

              return (
                <div
                  key={index}
                  className="about-stat-item rounded-2xl border bg-muted/20 p-4 text-center transition-colors hover:bg-muted/30"
                >
                  <IconComponent className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <div className="font-bold text-2xl text-foreground md:text-3xl">
                    {stat.value}
                    <span className="ml-1 font-normal text-muted-foreground text-sm">
                      {stat.unit}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

interface ClientsSectionProps {
  title?: string | undefined;
  description?: string | undefined;
  clientLogos?: Array<{
    name: string;
    logo: string;
    website?: string | undefined;
  }>;
}

export function ClientsSection({
  title = "Our Global Partners",
  description = "We're proud to partner with leading brands worldwide",
  clientLogos = [],
}: ClientsSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 85%",
        onEnter: () => {
          gsap.from(".clients-heading-item", { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 });
          gsap.from(".clients-logo-item", {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.08,
            delay: 0.3,
          });
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <section id="clients" className="w-full py-12 md:py-16 lg:py-20">
      <div
        ref={containerRef}
        className="container rounded-3xl border border-muted bg-muted/20 px-4 md:px-6"
      >
        <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
          <div className="space-y-3">
            <div className="clients-heading-item inline-block rounded-3xl bg-muted px-3 py-1 text-sm">
              Trusted by
            </div>
            <h2 className="clients-heading-item font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
              {title}
            </h2>
            <p className="clients-heading-item mx-auto max-w-reading text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 pb-10 md:grid-cols-3 lg:grid-cols-4">
          {clientLogos.map((client, index) => (
            <div
              key={index}
              className="clients-logo-item center-flex rounded-xl bg-background/50 p-4 transition-colors hover:bg-background/80"
            >
              <img
                src={client.logo}
                alt={client.name}
                className="h-12 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface ServicesSectionProps {
  title?: string | undefined;
  description?: string | undefined;
  services?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export function ServicesSection({
  title = "Our Manufacturing Capabilities",
  description = "Comprehensive B2B sportswear solutions from design to delivery",
  services = [],
}: ServicesSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 85%",
        onEnter: () => {
          gsap.from(".services-heading", { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 });
          gsap.from(".services-card-item", {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.08,
            delay: 0.2,
          });
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <section className="w-full bg-muted/20 py-12 md:py-16 lg:py-20">
      <div ref={containerRef} className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="services-heading mb-4 font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="services-heading mx-auto max-w-reading text-muted-foreground md:text-xl">
            {description}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const IconComponent =
              service.icon === "Factory"
                ? Factory
                : service.icon === "Award"
                  ? Award
                  : service.icon === "Globe2"
                    ? Globe2
                    : service.icon === "Package"
                      ? Package
                      : Sparkles;

            return (
              <div
                key={index}
                className="services-card-item rounded-3xl bg-background p-6 shadow-xs transition-shadow-sm hover:shadow-lg"
              >
                <div className="mb-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-xl">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
