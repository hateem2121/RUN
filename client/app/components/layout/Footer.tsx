import { useGSAP } from "@gsap/react";
import type { ContactPageConfiguration, FooterConfiguration } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import { Clock, MapPin, Pause, Play, ShieldCheck, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { gsap } from "@/lib/gsap";
import { queryKeys } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { FooterInquiryForm } from "./FooterInquiryForm";

/**
 * Footer - Command Center style footer with:
 * - "Start Your Order" form (Company, Email, Project Specs, Tech-Pack Upload)
 * - Live Sialkot & Zurich Factory Floor Timezone Clocks
 * - Interactive Certification Verification Modal
 * - Blueprint grid background & Parallax Logotype
 */
const footerLinkVariants = cva(
  "text-muted-foreground hover:text-primary origin-left transition-all duration-300 hover:scale-105 focus-visible:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 inline-flex items-center min-h-[36px] py-1.5 rounded-sm",
  {
    variants: {
      size: { default: "text-lg", sm: "text-sm", base: "text-base" },
      display: { block: "flex", inline: "inline-flex" },
    },
    defaultVariants: { size: "default", display: "block" },
  },
);

// Enforce strict URL protocol whitelist to prevent stored XSS injection & open redirects
export const sanitizeHref = (href?: string | null): string => {
  if (!href || typeof href !== "string") return "#";
  const trimmed = href.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return "#";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return "#";
};

const sialkotDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  weekday: "short",
});

const zurichDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Zurich",
  weekday: "short",
});

const sialkotHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  hour12: false,
  hour: "2-digit",
});

const zurichHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Zurich",
  hour12: false,
  hour: "2-digit",
});

const sialkotTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const zurichTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Zurich",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const isSialkotShiftActive = (date: Date) => {
  const hours = Number.parseInt(sialkotHourFormatter.format(date), 10);
  const dayStr = sialkotDayFormatter.format(date);
  // Monday to Saturday, 08:00 to 20:00 PKT (Sunday factory shift offline)
  return dayStr !== "Sun" && hours >= 8 && hours < 20;
};

const isZurichOfficeOpen = (date: Date) => {
  const hours = Number.parseInt(zurichHourFormatter.format(date), 10);
  const dayStr = zurichDayFormatter.format(date);
  // Monday to Friday, 09:00 to 18:00 CET/CEST
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(dayStr) && hours >= 9 && hours < 18;
};

const TimezoneClocks: React.FC = () => {
  const [sialkotTime, setSialkotTime] = useState("");
  const [zurichTime, setZurichTime] = useState("");
  const [sialkotActive, setSialkotActive] = useState(true);
  const [zurichActive, setZurichActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const updateTimes = () => {
      const now = new Date();
      setSialkotTime(sialkotTimeFormatter.format(now));
      setZurichTime(zurichTimeFormatter.format(now));
      setSialkotActive(isSialkotShiftActive(now));
      setZurichActive(isZurichOfficeOpen(now));
    };

    const startClock = () => {
      if (intervalId !== null) return;
      updateTimes();
      intervalId = setInterval(updateTimes, 1000);
    };

    const stopClock = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isVisibleRef.current) {
        startClock();
      } else {
        stopClock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && document.visibilityState === "visible") {
            startClock();
          } else {
            stopClock();
          }
        }
      });
      observer.observe(containerRef.current);
    } else {
      isVisibleRef.current = true;
      startClock();
    }

    return () => {
      stopClock();
      document.removeEventListener("visibilitychange", handleVisibility);
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {/* Sialkot Manufacturing HQ Timezone Card */}
      <div className="mb-4 rounded-xl border border-border bg-surface/80 dark:bg-neutral-900/50 p-3.5 backdrop-blur-sm shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="font-semibold text-foreground">SIALKOT, PK (PKT)</span>
          <span
            className={cn(
              "flex items-center gap-1 font-bold",
              sialkotActive ? "text-primary dark:text-brand-lime" : "text-neutral-400",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                sialkotActive ? "bg-primary dark:bg-brand-lime animate-pulse" : "bg-neutral-400",
              )}
            />
            {sialkotActive ? "SHIFT ACTIVE" : "SHIFT OFFLINE"}
          </span>
        </div>
        <div
          suppressHydrationWarning
          className="mt-1 font-mono text-xl font-bold tracking-tight text-foreground"
        >
          {sialkotTime || "12:00:00"}{" "}
          <span className="text-xs text-muted-foreground font-normal">UTC+5</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground font-mono">
          Sambrial Rd Manufacturing Zone, Sialkot
        </p>
      </div>

      {/* Zurich Strategic Office Timezone Card */}
      <div className="rounded-xl border border-border bg-surface/80 dark:bg-neutral-900/50 p-3.5 backdrop-blur-sm shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="font-semibold text-foreground">ZURICH, CH (CET)</span>
          <span
            className={cn(
              "text-xs font-mono font-medium",
              zurichActive ? "text-primary dark:text-blue-300" : "text-neutral-400",
            )}
          >
            {zurichActive ? "OFFICE OPEN" : "OFFICE CLOSED"}
          </span>
        </div>
        <div
          suppressHydrationWarning
          className="mt-1 font-mono text-xl font-bold tracking-tight text-foreground"
        >
          {zurichTime || "08:00:00"}{" "}
          <span className="text-xs text-muted-foreground font-normal">UTC+1</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground font-mono">
          Bahnhofstrasse Strategic Office, Zurich
        </p>
      </div>
    </div>
  );
};

export const Footer: React.FC = () => {
  const rootData = useRouteLoaderData<{ cspNonce?: string }>("root");
  const nonce = rootData?.cspNonce || undefined;
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [selectedCert, setSelectedCert] = useState<{
    id: number;
    name: string;
    issuingOrganization: string | null;
    imageUrl?: string;
  } | null>(null);

  const [isPaused, setIsPaused] = useState(false);

  const closeModal = () => {
    setSelectedCert(null);
    if (lastTriggerRef.current) {
      lastTriggerRef.current.focus();
    }
  };

  // Navigation Columns Fetching
  const { data: footerConfig, isLoading } = useQuery<
    FooterConfiguration & {
      certifications?: Array<{
        id: number;
        name: string;
        imageUrl: string;
        type: string | null;
        issuingOrganization: string | null;
      }>;
    }
  >({
    queryKey: queryKeys.footer(),
    select: (data: unknown) => (Array.isArray(data) ? data[0] : data),
  });

  // Keep contactConfig for legacy fallbacks
  const { data: contactConfig } = useQuery<ContactPageConfiguration>({
    queryKey: ["/api/contact-info"],
  });

  // Refs
  const footerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Parallax effect for the massive logotype
      if (textRef.current && footerRef.current) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        gsap.fromTo(
          textRef.current,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: 1,
            },
          },
        );
      }
    },
    { scope: footerRef, dependencies: [footerConfig] },
  );

  return (
    <footer
      ref={footerRef}
      className="bg-background text-foreground relative w-full overflow-hidden px-4 pt-32 pb-0 md:px-8 min-h-[600px] flex flex-col justify-between print:hidden"
    >
      {/* SEO ENHANCEMENT: Render JSON-LD Structured Data */}
      {footerConfig?.structuredData &&
        typeof footerConfig.structuredData === "object" &&
        Object.keys(footerConfig.structuredData).length > 0 && (
          <script
            type="application/ld+json"
            nonce={nonce}
            suppressHydrationWarning
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is server-controlled, not user input
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(footerConfig.structuredData)
                .replace(/</g, "\\u003c")
                .replace(/>/g, "\\u003e")
                .replace(/&/g, "\\u0026"),
            }}
          />
        )}
      {/* Blueprint Grid Background */}
      <div
        className="bg-footer-grid pointer-events-none absolute inset-0 opacity-subtle"
        aria-hidden="true"
      />

      <div className="container-centered z-elevated relative mb-20 grid grid-cols-1 gap-8 md:mb-32 md:grid-cols-2 lg:grid-cols-4 md:gap-12">
        {(footerConfig?.contactFormEnabled ?? true) && (
          <FooterInquiryForm heading={footerConfig?.contactFormHeading} />
        )}

        <div className="border-glass flex flex-col justify-between border-t pt-8 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-8 md:col-span-1">
          <div>
            <h2 className="text-muted-foreground mb-4 flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span>[ FACTORY & HQ TIMEZONES ]</span>
            </h2>

            <TimezoneClocks />
          </div>
          <div className="mt-8 flex flex-col space-y-1">
            <h2 className="text-muted-foreground mb-3 font-mono text-xs tracking-widest uppercase">
              [ DIRECT DISPATCH LINE ]
            </h2>
            <a
              href={`mailto:${footerConfig?.companyEmail || contactConfig?.email || "hello@runapparel.com"}`}
              className={footerLinkVariants({ size: "sm" })}
            >
              {footerConfig?.companyEmail || contactConfig?.email || "hello@runapparel.com"}
            </a>
            <a
              href={`tel:${footerConfig?.companyPhone || contactConfig?.phone || "+923361777313"}`}
              className={footerLinkVariants({ size: "sm" })}
            >
              {footerConfig?.companyPhone || contactConfig?.phone || "+92 336 1777313"}
            </a>
            {footerConfig?.companyAddress && (
              <div className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground font-mono">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400 mt-0.5" />
                <span>{footerConfig.companyAddress}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-glass flex flex-col justify-between border-t pt-8 md:border-t-0 md:border-s md:pt-0 md:ps-8 md:col-span-1">
          <div>
            <h2 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ NETWORK ]
            </h2>
            <ul className="space-y-2">
              {footerConfig?.socialLinks && footerConfig.socialLinks.length > 0
                ? footerConfig.socialLinks.map((link) => (
                    <li key={link.name}>
                      <a
                        href={sanitizeHref(link.href)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={footerLinkVariants({ display: "inline" })}
                        style={{ "--hover-color": link.hoverColor } as React.CSSProperties}
                      >
                        {link.name}
                      </a>
                    </li>
                  ))
                : contactConfig?.socialLinks && Object.keys(contactConfig.socialLinks).length > 0
                  ? Object.entries(contactConfig.socialLinks).map(([platform, url]) => (
                      <li key={platform}>
                        <a
                          href={sanitizeHref(String(url))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={footerLinkVariants({ display: "inline" })}
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      </li>
                    ))
                  : null}
            </ul>
          </div>
          <div className="mt-12">
            <h2 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ PROTOCOLS ]
            </h2>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {footerConfig?.legalLinks && footerConfig.legalLinks.length > 0
                ? footerConfig.legalLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={sanitizeHref(link.href)}
                        data-internal-link="true"
                        className={footerLinkVariants({ display: "inline" })}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))
                : [
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        to={sanitizeHref(link.href)}
                        data-internal-link="true"
                        className={footerLinkVariants({ display: "inline" })}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Dynamic Navigation Columns from CMS */}
      {isLoading ? (
        <div className="container-centered z-elevated relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 md:gap-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-glass flex flex-col border-s ps-8 md:col-span-1">
              <Skeleton className="h-4 w-24 mb-6 opacity-20" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 opacity-10" />
                <Skeleton className="h-6 w-28 opacity-10" />
                <Skeleton className="h-6 w-36 opacity-10" />
              </div>
            </div>
          ))}
        </div>
      ) : footerConfig?.navigationColumns && footerConfig.navigationColumns.length > 0 ? (
        <>
          {/* Mobile Accordion View */}
          <div className="container-centered z-elevated relative md:hidden mb-8">
            <Accordion type="single" collapsible className="w-full">
              {footerConfig.navigationColumns.map((column, idx) => (
                <AccordionItem key={column.title || idx} value={`col-${idx}`}>
                  <AccordionTrigger className="font-mono text-xs tracking-widest uppercase text-muted-foreground py-3">
                    [ {column.title} ]
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-2">
                      {column.links.map((link) => {
                        const isInternal = !link.external && !link.href.startsWith("http");
                        return (
                          <li key={link.label}>
                            {isInternal ? (
                              <Link
                                to={sanitizeHref(link.href)}
                                data-internal-link="true"
                                className={footerLinkVariants({ size: "sm", display: "inline" })}
                              >
                                {link.label}
                              </Link>
                            ) : (
                              <a
                                href={sanitizeHref(link.href)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={footerLinkVariants({ size: "sm", display: "inline" })}
                              >
                                {link.label}
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Desktop Grid View */}
          <div className="hidden md:grid container-centered z-elevated relative grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 md:gap-12">
            {footerConfig.navigationColumns.map((column) => (
              <div
                key={column.title}
                className="border-glass flex flex-col border-s ps-8 md:col-span-1"
              >
                <h2 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
                  [ {column.title} ]
                </h2>
                <ul className="space-y-2">
                  {column.links.map((link) => {
                    const isInternal = !link.external && !link.href.startsWith("http");
                    return (
                      <li key={link.label}>
                        {isInternal ? (
                          <Link
                            to={sanitizeHref(link.href)}
                            data-internal-link="true"
                            className={footerLinkVariants({ display: "inline" })}
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            href={sanitizeHref(link.href)}
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            className={footerLinkVariants({ display: "inline" })}
                          >
                            {link.label}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Certification Marquee */}
      {footerConfig?.certifications && footerConfig.certifications.length > 0 && (
        <div className="container-centered mt-20 mb-10 overflow-hidden">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              [ CERTIFIED STANDARDS (CLICK TO VERIFY) ]
            </h2>
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? "Resume certification ticker" : "Pause certification ticker"}
              className="rounded border border-border/40 p-1 text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary min-h-[24px] min-w-[24px] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          </div>

          <div className="relative flex overflow-x-hidden">
            <div
              className={cn(
                "flex items-center whitespace-nowrap py-4 animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none shrink-0",
                isPaused && "[animation-play-state:paused]",
              )}
            >
              <div className="flex items-center gap-12 pr-12 shrink-0">
                {footerConfig.certifications.map((cert) => (
                  <button
                    type="button"
                    key={cert.id}
                    onClick={(e) => {
                      lastTriggerRef.current = e.currentTarget;
                      setSelectedCert(cert);
                    }}
                    className="group relative flex items-center gap-4 transition-all hover:scale-105 hover:opacity-100 opacity-70 text-left focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary rounded-lg p-1 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground text-xs font-bold tracking-tighter uppercase">
                        {cert.name}
                      </span>
                      <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
                        {cert.issuingOrganization}
                      </span>
                    </div>
                    {cert.imageUrl && (
                      <img
                        src={cert.imageUrl}
                        alt={cert.name}
                        className="h-8 w-auto object-contain grayscale transition-all group-hover:grayscale-0"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Cloned elements for continuous seamless marquee loop */}
              <div aria-hidden="true" className="flex items-center gap-12 pr-12 shrink-0">
                {footerConfig.certifications.map((cert, idx) => (
                  <div
                    key={`dup-${cert.id}-${idx}`}
                    tabIndex={-1}
                    className="group relative flex items-center gap-4 opacity-70 text-left pointer-events-none select-none"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground text-xs font-bold tracking-tighter uppercase">
                        {cert.name}
                      </span>
                      <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
                        {cert.issuingOrganization}
                      </span>
                    </div>
                    {cert.imageUrl && (
                      <img
                        src={cert.imageUrl}
                        alt=""
                        className="h-8 w-auto object-contain grayscale"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certification Verification Lightbox Modal */}
      {selectedCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Certification Verification"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeModal();
            }
            if (e.key === "Tab") {
              const focusableElements = e.currentTarget.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
              );
              if (focusableElements.length === 0) return;

              const firstElement = focusableElements[0];
              const lastElement = focusableElements[focusableElements.length - 1];

              if (e.shiftKey) {
                if (firstElement && lastElement && document.activeElement === firstElement) {
                  e.preventDefault();
                  lastElement.focus();
                }
              } else {
                if (firstElement && lastElement && document.activeElement === lastElement) {
                  e.preventDefault();
                  firstElement.focus();
                }
              }
            }
          }}
          ref={(el) => {
            if (el && !el.contains(document.activeElement)) {
              const focusable = el.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
              );
              focusable?.focus();
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-lime" />
                <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
                  VERIFIED B2B STANDARD
                </span>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white cursor-pointer after:absolute after:-inset-1.5"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-col items-center text-center">
              {selectedCert.imageUrl && (
                <img
                  src={selectedCert.imageUrl}
                  alt={selectedCert.name}
                  className="mb-4 h-16 w-auto object-contain"
                />
              )}
              <h3 className="text-xl font-bold uppercase tracking-tight">{selectedCert.name}</h3>
              <p className="mt-1 font-mono text-xs text-brand-lime">
                {selectedCert.issuingOrganization || "International Standards Organization"}
              </p>
              <div className="mt-6 w-full space-y-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left font-mono text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>AUDIT COMPLIANCE:</span>
                  <span className="text-brand-lime font-bold">100% VERIFIED</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>REGISTRATION ID:</span>
                  <span className="text-white">
                    RUN-ISO-{selectedCert.id.toString().padStart(4, "0")}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>AUDITED FACILITY:</span>
                  <span className="text-white">SIALKOT MFG COMPLEX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copyright Bar */}
      <div className="container-centered mt-16 border-t border-foreground/10 py-6 text-center">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p
            suppressHydrationWarning
            className="text-muted-foreground font-mono text-xs tracking-widest"
          >
            © {new Date().getFullYear()} {footerConfig?.companyName || "RUN APPAREL (PVT) LTD"}. ALL
            RIGHTS RESERVED.
          </p>
          {footerConfig?.brandTagline && (
            <p className="text-muted-foreground/70 font-mono text-xs tracking-wider">
              {footerConfig.brandTagline}
            </p>
          )}
          {footerConfig?.brandSubtext && (
            <p className="text-muted-foreground/50 font-mono text-[10px] tracking-widest uppercase">
              {footerConfig.brandSubtext}
            </p>
          )}
        </div>
      </div>

      {/* Massive Parallax Logotype */}
      <div
        className="z-elevated relative w-full text-center overflow-hidden translate-y-[13%]"
        aria-hidden="true"
      >
        <div
          ref={textRef}
          className="leading-none font-bold tracking-tighter opacity-muted-decoration mix-blend-normal select-none will-change-transform dark:opacity-20 whitespace-nowrap text-logotype"
          data-content={footerConfig?.brandText || "RUN APPAREL"}
        >
          {footerConfig?.brandText || "RUN APPAREL"}
        </div>
      </div>
    </footer>
  );
};
