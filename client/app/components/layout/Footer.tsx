import type { ContactPageConfiguration, FooterConfiguration } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FooterInquiryForm } from "./FooterInquiryForm";

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer - Command Center style footer with:
 * - "Start Your Order" form (Company, Email, Project Specs)
 * - Blueprint grid background
 * - Parallax "RUN APPAREL" logotype
 * - GSAP submit animation
 */
// Footer link variants for consistent styling
const footerLinkVariants = cva(
  "text-muted-foreground hover:text-primary origin-left transition-all duration-300 hover:scale-105 focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  {
    variants: {
      size: { default: "text-lg", sm: "text-sm", base: "text-base" },
      display: { block: "block", inline: "inline-block" },
    },
    defaultVariants: { size: "default", display: "block" },
  },
);

const Footer: React.FC = () => {
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

  useEffect(() => {
    if (!footerRef.current || !textRef.current) {
      return;
    }

    const scope = footerRef.current;

    const ctx = gsap.context(() => {
      // Parallax effect for the massive logotype
      if (textRef.current) {
        gsap.fromTo(
          textRef.current,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom bottom",
              scrub: 1,
            },
          },
        );
      }
    }, scope);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-background text-foreground relative w-full isolate overflow-hidden px-4 pt-32 pb-0 md:px-8 min-h-[600px] flex flex-col justify-between"
    >
      {/* SEO ENHANCEMENT: Render JSON-LD Structured Data */}
      {footerConfig?.structuredData && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is server-controlled, not user input
          dangerouslySetInnerHTML={{
            // Escape </script> sequences to prevent script tag break-out (Node's JSON.stringify
            // does not escape < or > by default, so </script> in a string value would be injected)
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
            <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ HQ COORDINATES ]
            </h4>
            <div className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
              {footerConfig?.companyAddress ? (
                footerConfig.companyAddress
              ) : contactConfig?.locationLine1 ? (
                <>
                  {contactConfig.locationLine1}
                  <br />
                  {contactConfig.locationLine2}
                </>
              ) : contactConfig?.address ? (
                contactConfig.address
              ) : (
                <>
                  142 Industrial Ave,
                  <br />
                  Zurich, Switzerland
                  <br />
                  8005
                </>
              )}
            </div>
          </div>
          <div className="mt-12">
            <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ DIRECT LINE ]
            </h4>
            <a
              href={`mailto:${footerConfig?.companyEmail || contactConfig?.email || "hello@runapparel.com"}`}
              className={footerLinkVariants()}
            >
              {footerConfig?.companyEmail || contactConfig?.email || "hello@runapparel.com"}
            </a>
            <a
              href={`tel:${footerConfig?.companyPhone || contactConfig?.phone || "+41441234567"}`}
              className={footerLinkVariants()}
            >
              {footerConfig?.companyPhone || contactConfig?.phone || "+41 44 123 45 67"}
            </a>
          </div>
        </div>

        <div className="border-glass flex flex-col justify-between border-l pl-8 md:col-span-1">
          <div>
            <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ NETWORK ]
            </h4>
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
                  : ["Instagram", "LinkedIn", "Behance"].map((item) => (
                      <li key={item}>
                        <a href="#" className={footerLinkVariants({ display: "inline" })}>
                          {item}
                        </a>
                      </li>
                    ))}
            </ul>
          </div>
          <div className="mt-12">
            <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ PROTOCOLS ]
            </h4>
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
                <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
                  [ {column.title} ]
                </h4>
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
          <h4 className="text-muted-foreground mb-8 text-center font-mono text-xs tracking-widest uppercase">
            [ CERTIFIED STANDARDS ]
          </h4>
          <div className="relative flex overflow-x-hidden">
            <div className="flex animate-marquee items-center gap-12 whitespace-nowrap py-4 pr-12">
              {[...footerConfig.certifications, ...footerConfig.certifications].map((cert, idx) => (
                <div
                  key={`${cert.id}-${idx}`}
                  className="group relative flex items-center gap-4 transition-opacity hover:opacity-100 opacity-60"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copyright Bar */}
      <div className="container-centered mt-16 border-t border-foreground/10 py-6 text-center">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground font-mono text-xs tracking-widest">
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
        <h1
          ref={textRef}
          className="leading-none font-bold tracking-tighter opacity-muted-decoration mix-blend-normal select-none will-change-transform dark:opacity-20 whitespace-nowrap text-logotype"
        >
          RUN APPAREL
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
