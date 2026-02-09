import type { ContactPageConfiguration } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import Magnetic from "@/components/ui/Magnetic";
import { cn } from "@/lib/utils";
import { useCursorStore } from "@/stores/useCursorStore";

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer - Command Center style footer with:
 * - "Start Your Order" form (Company, Email, Project Specs)
 * - Blueprint grid background
 * - Parallax "RUN APPAREL" logotype
 * - GSAP submit animation
 */
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

const footerInputVariants = cva(
  "focus-visible:border-primary focus-visible:shadow-glow-primary focus-visible:bg-primary/5 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background w-full rounded-none border-b bg-transparent py-4 pl-4 font-mono text-xl transition-all duration-300 ease-out outline-none disabled:opacity-50",
  {
    variants: {
      hasError: {
        true: "border-destructive text-destructive placeholder:text-destructive/50",
        false: "border-foreground/30 text-foreground placeholder:text-muted-foreground",
      },
    },
    defaultVariants: { hasError: false },
  },
);

const Footer: React.FC = () => {
  const { setCursor, resetCursor } = useCursorStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string | undefined;
    specs?: string;
  }>({});

  // Refs
  const footerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Data Fetching
  const { data: contactConfig } = useQuery<ContactPageConfiguration>({
    queryKey: ["/api/contact-info"],
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;

    // Get form elements via namedItem for robustness
    const companyInput = form.elements.namedItem("company") as HTMLInputElement;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const specsInput = form.elements.namedItem("specs") as HTMLTextAreaElement;

    // Validation Logic
    const newErrors: { email?: string | undefined; specs?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput || !emailRegex.test(emailInput.value)) {
      newErrors.email = "INVALID EMAIL FORMAT";
    }

    if (!specsInput || specsInput.value.trim().length < 10) {
      newErrors.specs = "DESCRIPTION TOO SHORT (MIN 10 CHARS)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors if valid
    setErrors({});

    const btn = btnRef.current;

    // Initial Click Animation
    if (btn) {
      const tl = gsap.timeline();
      tl.to(btn, { scale: 0.9, duration: 0.1, ease: "power2.inOut" })
        .to(btn, { scale: 1.1, opacity: 0, duration: 0.15, ease: "power2.out" })
        .call(() => setIsSubmitting(true))
        .to(btn, { scale: 1, opacity: 1, duration: 0.2, ease: "power2.in" });
    } else {
      setIsSubmitting(true);
    }

    // Submit to API
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            company: companyInput?.value || "",
            email: emailInput?.value || "",
            projectDescription: specsInput?.value || "",
          },
          items: [],
          source: "footer_form",
        }),
      });

      if (response.ok) {
        setIsSubmitting(false);
        setIsSent(true);
        setShowSuccess(true);
        if (formRef.current) {
          formRef.current.reset();
        }

        // Hide message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setIsSent(false);
        }, 5000);
      } else {
        throw new Error("Submission failed");
      }
    } catch (_error) {
      setIsSubmitting(false);
      setErrors({ email: "SUBMISSION FAILED - TRY AGAIN" });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="bg-background text-foreground relative w-full isolate overflow-hidden px-4 pt-32 pb-0 md:px-8"
    >
      {/* Blueprint Grid Background */}
      <div
        className="bg-footer-grid pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
      />

      <div className="container-centered z-elevated relative mb-20 grid grid-cols-1 gap-8 md:mb-32 md:grid-cols-3 lg:grid-cols-4 md:gap-12">
        <div className="md:col-span-1 lg:col-span-2">
          <h2 className="mb-8 text-6xl leading-none font-bold tracking-tighter uppercase sm:text-7xl md:text-8xl lg:text-9xl">
            Start Your <br />
            Order
          </h2>

          {/* Success Message - ARIA Live Region */}
          <div
            aria-live="polite"
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showSuccess ? "mb-8 max-h-24 opacity-100" : "mb-0 max-h-0 opacity-0"
            }`}
          >
            <div className="border-brand-lime/30 bg-brand-lime/5 flex items-center gap-3 border p-4">
              <div className="bg-brand-lime shadow-glow-primary h-2 w-2 animate-pulse rounded-full" />
              <p className="text-brand-lime font-mono text-sm tracking-widest">
                SUBMISSION CONFIRMED!
              </p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-12 max-w-lg space-y-8">
            <div className="group">
              <label
                htmlFor="company"
                className="text-muted-foreground group-focus-within:text-primary mb-2 block pl-4 font-mono text-xs tracking-widest uppercase transition-colors"
              >
                <span className="hidden sm:inline">01 </span>
                COMPANY NAME
              </label>
              <input
                id="company"
                type="text"
                name="company"
                autoComplete="organization"
                aria-label="Company Name"
                disabled={isSubmitting || isSent}
                className={footerInputVariants({ hasError: false })}
                placeholder="ENTER CORPORATION"
              />
            </div>
            <div className="group">
              <div className="mb-2 flex items-end justify-between">
                <label
                  htmlFor="email"
                  className={`group-focus-within:text-primary block pl-4 font-mono text-xs tracking-widest uppercase transition-colors ${
                    errors.email ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">02 </span>
                  EMAIL ADDRESS
                </label>
                {errors.email && (
                  <span role="alert" className="text-destructive text-micro animate-pulse">
                    [{errors.email}]
                  </span>
                )}
              </div>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                aria-label="Email Address"
                required
                disabled={isSubmitting || isSent}
                className={footerInputVariants({ hasError: !!errors.email })}
                placeholder="NAME@DOMAIN.COM"
                onChange={() => setErrors(({ email, ...prev }) => prev)}
              />
            </div>
            <div className="group">
              <div className="mb-2 flex items-end justify-between">
                <label
                  htmlFor="specs"
                  className={`group-focus-within:text-primary block pl-4 font-mono text-xs tracking-widest uppercase transition-colors ${
                    errors.specs ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">03 </span>
                  PROJECT SPECIFICATIONS
                </label>
                {errors.specs && (
                  <span role="alert" className="text-destructive text-micro animate-pulse">
                    [{errors.specs}]
                  </span>
                )}
              </div>
              <textarea
                id="specs"
                name="specs"
                rows={3}
                aria-label="Project Specifications"
                disabled={isSubmitting || isSent}
                className={cn(footerInputVariants({ hasError: !!errors.specs }), "resize-none")}
                placeholder="FABRIC / QUANTITY / TIMELINE"
                onChange={() => setErrors(({ specs, ...prev }) => prev)}
              />
            </div>

            <Magnetic strength={0.4}>
              <button
                ref={btnRef}
                type="submit"
                disabled={isSubmitting || isSent}
                aria-busy={isSubmitting ? "true" : "false"}
                className={cn(
                  "relative mt-8 overflow-hidden border px-12 py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300",
                  isSent
                    ? "border-brand-lime text-brand-lime cursor-default"
                    : "hover:border-foreground hover:bg-foreground hover:text-background border-foreground/30",
                )}
                onMouseEnter={() => !isSent && setCursor("button")}
                onMouseLeave={() => resetCursor()}
              >
                {isSubmitting ? "PROCESSING..." : isSent ? "CONFIRMED" : "INITIALIZE ORDER"}
              </button>
            </Magnetic>
          </form>
        </div>

        <div className="border-glass flex flex-col justify-between border-l pl-8 md:col-span-1">
          <div>
            <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ HQ COORDINATES ]
            </h4>
            <div className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
              {contactConfig?.locationLine1 ? (
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
              href={`mailto:${contactConfig?.email || "hello@runapparel.com"}`}
              className={footerLinkVariants()}
            >
              {contactConfig?.email || "hello@runapparel.com"}
            </a>
            <a
              href={`tel:${contactConfig?.phone || "+41441234567"}`}
              className={footerLinkVariants()}
            >
              {contactConfig?.phone || "+41 44 123 45 67"}
            </a>
          </div>
        </div>

        <div className="border-glass flex flex-col justify-between border-l pl-8 md:col-span-1">
          <div>
            <h4 className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">
              [ NETWORK ]
            </h4>
            <ul className="space-y-2">
              {contactConfig?.socialLinks && Object.keys(contactConfig.socialLinks).length > 0
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
              <li>
                <a href="/privacy" className={footerLinkVariants({ display: "inline" })}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className={footerLinkVariants({ display: "inline" })}>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="container-centered mt-16 border-t border-foreground/10 py-6 text-center">
        <p className="text-muted-foreground font-mono text-xs tracking-widest">
          © {new Date().getFullYear()} RUN APPAREL (PVT) LTD. ALL RIGHTS RESERVED.
        </p>
      </div>

      {/* Massive Parallax Logotype */}
      <div className="z-elevated relative w-full text-center overflow-hidden" aria-hidden="true">
        <h1
          ref={textRef}
          className="text-foreground leading-none font-bold tracking-tighter opacity-[0.07] mix-blend-normal select-none will-change-transform dark:opacity-20 whitespace-nowrap text-(--font-size-footer-display)"
        >
          RUN APPAREL
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
