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
  "origin-left text-muted-foreground transition-all duration-300 hover:scale-105 hover:text-primary",
  {
    variants: {
      size: { default: "text-lg", sm: "text-sm", base: "text-base" },
      display: { block: "block", inline: "inline-block" },
    },
    defaultVariants: { size: "default", display: "block" },
  },
);

const footerInputVariants = cva(
  "w-full bg-transparent border-b py-4 pl-4 text-xl outline-none transition-all duration-300 ease-out rounded-none font-mono disabled:opacity-50 focus-visible:border-primary focus-visible:shadow-glow-primary focus-visible:bg-primary/5 focus-visible:text-foreground",
  {
    variants: {
      hasError: {
        true: "border-destructive text-destructive placeholder:text-destructive/50",
        false: "border-border text-foreground placeholder:text-muted-foreground",
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
  const [errors, setErrors] = useState<{ email?: string; specs?: string }>({});

  // Refs
  const footerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!footerRef.current || !textRef.current) return;

    const scope = footerRef.current;

    const ctx = gsap.context(() => {
      // Parallax effect for the massive logotype
      if (textRef.current) {
        gsap.fromTo(
          textRef.current,
          { y: -100 },
          {
            y: 0,
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
    const newErrors: { email?: string; specs?: string } = {};
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
        if (formRef.current) formRef.current.reset();

        // Hide message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setIsSent(false);
        }, 5000);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      setIsSubmitting(false);
      setErrors({ email: "SUBMISSION FAILED - TRY AGAIN" });
    }
  };

  // Dynamic input styles based on error state

  return (
    <footer
      ref={footerRef}
      className="relative w-full overflow-hidden bg-background px-4 pt-32 pb-0 text-foreground md:px-8"
    >
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container-centered z-elevated relative mb-20 grid grid-cols-1 gap-12 md:mb-32 md:grid-cols-4 md:gap-24">
        <div className="md:col-span-2">
          <h2 className="mb-8 font-bold text-6xl uppercase leading-none tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl">
            Start Your <br />
            Order
          </h2>

          {/* Success Message - ARIA Live Region */}
          <div
            aria-live="polite"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showSuccess ? "max-h-24 opacity-100 mb-8" : "max-h-0 opacity-0 mb-0"
            }`}
          >
            <div className="border border-brand-lime/30 bg-brand-lime/5 p-4 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-lime animate-pulse shadow-glow-primary" />
              <p className="font-mono text-sm tracking-widest text-brand-lime">
                SUBMISSION CONFIRMED! // PROTOCOL INITIATED.
              </p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 mt-12 max-w-lg">
            <div className="group">
              <label
                htmlFor="company"
                className="mb-2 block pl-4 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-primary"
              >
                01 // Company Name
              </label>
              <input
                id="company"
                type="text"
                name="company"
                autoComplete="organization"
                required
                disabled={isSubmitting || isSent}
                className={footerInputVariants({ hasError: false })}
                placeholder="ENTER CORPORATION"
              />
            </div>
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <label
                  htmlFor="email"
                  className={`block pl-4 font-mono text-xs uppercase tracking-widest transition-colors group-focus-within:text-primary ${
                    errors.email ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  02 // Email Protocol
                </label>
                {errors.email && (
                  <span
                    role="alert"
                    className="text-destructive text-[10px] tracking-widest font-mono font-bold animate-pulse"
                  >
                    [{errors.email}]
                  </span>
                )}
              </div>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                disabled={isSubmitting || isSent}
                className={footerInputVariants({ hasError: !!errors.email })}
                placeholder="NAME@DOMAIN.COM"
                onChange={() => setErrors((prev) => ({ ...prev, email: undefined }))}
              />
            </div>
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <label
                  htmlFor="specs"
                  className={`block pl-4 font-mono text-xs uppercase tracking-widest transition-colors group-focus-within:text-primary ${
                    errors.specs ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  03 // Project Specifications
                </label>
                {errors.specs && (
                  <span
                    role="alert"
                    className="text-destructive text-[10px] tracking-widest font-mono font-bold animate-pulse"
                  >
                    [{errors.specs}]
                  </span>
                )}
              </div>
              <textarea
                id="specs"
                name="specs"
                rows={3}
                disabled={isSubmitting || isSent}
                className={cn(footerInputVariants({ hasError: !!errors.specs }), "resize-none")}
                placeholder="FABRIC / QUANTITY / TIMELINE"
                onChange={() => setErrors((prev) => ({ ...prev, specs: undefined }))}
              />
            </div>

            <Magnetic strength={0.4}>
              <button
                ref={btnRef}
                type="submit"
                disabled={isSubmitting || isSent}
                aria-busy={isSubmitting}
                className={cn(
                  "mt-8 px-12 py-4 border transition-all duration-300 uppercase tracking-widest text-sm relative overflow-hidden font-bold",
                  isSent
                    ? "border-brand-lime cursor-default text-brand-lime"
                    : "border-white/30 hover:border-foreground hover:bg-foreground hover:text-background",
                )}
                onMouseEnter={() => !isSent && setCursor("button")}
                onMouseLeave={() => resetCursor()}
              >
                {isSubmitting ? "PROCESSING..." : isSent ? "CONFIRMED" : "INITIALIZE ORDER"}
              </button>
            </Magnetic>
          </form>
        </div>

        <div className="md:col-span-1 flex flex-col justify-between border-l border-glass pl-8">
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              [ HQ COORDINATES ]
            </h4>
            <p className="text-lg leading-relaxed text-muted-foreground">
              142 Industrial Ave,
              <br />
              Zurich, Switzerland
              <br />
              8005
            </p>
          </div>
          <div className="mt-12">
            <h4 className="uppercase tracking-widest text-gray-500 mb-4 text-xs font-mono">
              [ DIRECT LINE ]
            </h4>
            <a href="mailto:hello@runapparel.com" className={footerLinkVariants()}>
              hello@runapparel.com
            </a>
            <a href="tel:+41441234567" className={footerLinkVariants()}>
              +41 44 123 45 67
            </a>
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col justify-between border-l border-glass pl-8">
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              [ NETWORK ]
            </h4>
            <ul className="space-y-2">
              {["Instagram", "LinkedIn", "Behance"].map((item) => (
                <li key={item}>
                  <a href="#" className={footerLinkVariants({ display: "inline" })}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-12">
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              [ PROTOCOLS ]
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <a href="#" className={footerLinkVariants({ display: "inline" })}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Massive Parallax Logotype */}
      <div className="w-full text-center relative z-elevated translate-y-[20%]">
        <h1
          ref={textRef}
          className="select-none text-[18vw] font-bold leading-none tracking-tighter text-foreground mix-blend-overlay opacity-30"
        >
          RUN APPAREL
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
