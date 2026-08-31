import { useGSAP } from "@gsap/react";
import type { ContactPageConfiguration, FooterConfiguration } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import { Clock, ShieldCheck, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { gsap } from "@/lib/gsap";
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

import { useRouteLoaderData } from "react-router";

const TimezoneClocks: React.FC = () => {
  const [sialkotTime, setSialkotTime] = useState("");
  const [zurichTime, setZurichTime] = useState("");

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setSialkotTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
      setZurichTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Europe/Zurich",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Sialkot Manufacturing HQ Timezone Card */}
      <div className="mb-4 rounded-xl border border-border bg-surface/80 dark:bg-neutral-900/50 p-3.5 backdrop-blur-sm shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="font-semibold text-foreground">SIALKOT, PK (PKT)</span>
          <span className="flex items-center gap-1 text-primary dark:text-brand-lime font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-primary dark:bg-brand-lime animate-pulse" />
            SHIFT ACTIVE
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
          <span className="text-xs text-primary dark:text-blue-300 font-mono font-medium">
            OFFICE OPEN
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
    </>
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
    queryKey: ["/api/footer"],
    select: (data: unknown) => (Array.isArray(data) ? data[0] : data),
  });

  // Keep contactConfig for legacy fallbacks
  const { data: contactConfig } = useQuery<ContactPageConfiguration>({
    queryKey: ["/api/contact-info"],
  });

  // Refs
  const footerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      // Parallax effect for the massive logotype
      if (textRef.current && footerRef.current) {
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
    { scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="bg-background text-foreground relative w-full overflow-hidden px-4 pt-32 pb-0 md:px-8 min-h-[600px] flex flex-col justify-between"
    >
      {/* SEO ENHANCEMENT: Render JSON-LD Structured Data */}
      {footerConfig?.structuredData && (
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is server-controlled, not user input
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(footerConfig.structuredData).replace(/<\//g, "<\\/"),
          }}
        />
      )}
      {/* Blueprint Grid Background */}
      <div
        className="bg-footer-grid pointer-events-none absolute inset-0 opacity-subtle"
        aria-hidden="true"
      />

      <div className="container-centered z-elevated relative mb-20 grid grid-cols-1 gap-8 md:mb-32 md:grid-cols-3 lg:grid-cols-4 md:gap-12">
        <FooterInquiryForm />

        <div className="border-glass flex flex-col justify-between border-l pl-8 md:col-span-1">
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
              href={`tel:${footerConfig?.companyPhone || contactConfig?.phone || "+41441234567"}`}
              className={footerLinkVariants({ size: "sm" })}
            >
              {footerConfig?.companyPhone || contactConfig?.phone || "+41 44 123 45 67"}
            </a>
          </div>
        </div>

        <div className="border-glass flex flex-col justify-between border-l pl-8 md:col-span-1">
          <div>
            <h2 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ NETWORK ]
            </h2>
            <ul className="space-y-2">
              {footerConfig?.socialLinks && footerConfig.socialLinks.length > 0
                ? footerConfig.socialLinks.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
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
                          href={String(url)}
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
                      <a href={link.href} className={footerLinkVariants({ display: "inline" })}>
                        {link.label}
                      </a>
                    </li>
                  ))
                : [
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className={footerLinkVariants({ display: "inline" })}>
                        {link.label}
                      </a>
                    </li>
                  ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Dynamic Navigation Columns from CMS */}
      <div className="container-centered z-elevated relative grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4 md:gap-12">
        {isLoading
          ? // SKELETON STATE: Prevent layout shift during fetch
            [1, 2, 3].map((i) => (
              <div key={i} className="border-glass flex flex-col border-l pl-8 md:col-span-1">
                <Skeleton className="h-4 w-24 mb-6 opacity-20" />
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32 opacity-10" />
                  <Skeleton className="h-6 w-28 opacity-10" />
                  <Skeleton className="h-6 w-36 opacity-10" />
                </div>
              </div>
            ))
          : footerConfig?.navigationColumns?.map((column, idx) => (
              <div
                key={column.title}
                className={cn(
                  "border-glass flex flex-col border-l pl-8 md:col-span-1",
                  idx > 0 && "hidden lg:flex",
                )}
              >
                <h2 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
                  [ {column.title} ]
                </h2>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className={footerLinkVariants({ display: "inline" })}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
      </div>

      {/* Certification Marquee (Phase 3 Achievement) */}
      {footerConfig?.certifications && footerConfig.certifications.length > 0 && (
        <div className="container-centered mt-20 mb-10 overflow-hidden">
          <h2 className="text-muted-foreground mb-8 text-center font-mono text-xs tracking-widest uppercase">
            [ CERTIFIED STANDARDS (CLICK TO VERIFY) ]
          </h2>
          <div className="relative flex overflow-x-hidden">
            <div className="flex animate-marquee items-center gap-12 whitespace-nowrap py-4 pr-12">
              {[...footerConfig.certifications, ...footerConfig.certifications].map((cert, idx) => (
                <button
                  type="button"
                  key={`${cert.id}-${idx}`}
                  onClick={(e) => {
                    lastTriggerRef.current = e.currentTarget;
                    setSelectedCert(cert);
                  }}
                  className="group relative flex items-center gap-4 transition-all hover:scale-105 hover:opacity-100 opacity-70 text-left focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary rounded-lg p-1"
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
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
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
          data-content="RUN APPAREL"
        />
      </div>
    </footer>
  );
};
