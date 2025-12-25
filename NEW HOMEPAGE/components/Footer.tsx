import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { CursorVariant } from "../types";
import Magnetic from "./Magnetic";

const Footer: React.FC = () => {
  const setCursor = useStore((state) => state.setCursor);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;

    // Get form elements via namedItem for robustness
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const specsInput = form.elements.namedItem("specs") as HTMLTextAreaElement;

    // Validation Logic
    const newErrors: { email?: string; specs?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput || !emailRegex.test(emailInput.value)) {
      newErrors.email = "ERROR: INVALID EMAIL PROTOCOL";
    }

    if (!specsInput || specsInput.value.trim().length < 10) {
      newErrors.specs = "ERROR: INSUFFICIENT DATA (MIN 10 CHARS)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop submission
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

    // Simulate Network Request
    setTimeout(() => {
      const handleSuccessState = () => {
        setIsSubmitting(false);
        setIsSent(true);
        setShowSuccess(true);
        if (formRef.current) formRef.current.reset();

        // Hide message after 5 seconds from appearance
        setTimeout(() => {
          setShowSuccess(false);
          setIsSent(false);
        }, 5000);
      };

      if (btn) {
        // Pulse effect before showing success
        gsap.to(btn, {
          scale: 1.05,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          onComplete: handleSuccessState,
        });
      } else {
        handleSuccessState();
      }
    }, 2500);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Dynamic input styles based on error state
  const getInputClasses = (hasError: boolean) =>
    `w-full bg-transparent border-b ${
      hasError
        ? "border-[#FF0033] text-[#FF0033] placeholder:text-[#FF0033]/50"
        : "border-gray-800 text-gray-300 placeholder:text-gray-600"
    } py-4 text-xl focus:outline-none focus:border-[#3300FF] focus:shadow-[0_15px_30px_-10px_rgba(51,0,255,0.2)] focus:bg-[#3300FF]/5 focus:pl-4 focus:text-gray-100 transition-all duration-300 ease-out rounded-none font-mono disabled:opacity-50`;

  return (
    <footer
      ref={footerRef}
      className="w-full bg-[#050505] text-[#FAFAFA] pt-32 pb-0 px-4 md:px-8 relative overflow-hidden"
    >
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-24 mb-24 md:mb-48 relative z-10">
        <div className="md:col-span-2">
          <h2 className="text-[12vw] md:text-[5vw] leading-[0.9] uppercase font-bold mb-8">
            Start Your <br /> Order
          </h2>

          {/* Success Message - ARIA Live Region */}
          <div
            aria-live="polite"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showSuccess ? "max-h-24 opacity-100 mb-8" : "max-h-0 opacity-0 mb-0"
            }`}
          >
            <div className="border border-[#CCFF00]/30 bg-[#CCFF00]/5 p-4 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_10px_#CCFF00]" />
              <p className="font-mono text-sm tracking-widest text-[#CCFF00]">
                SUBMISSION CONFIRMED! // PROTOCOL INITIATED.
              </p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 mt-12 max-w-lg">
            <div className="group">
              <label
                htmlFor="company"
                className="text-xs uppercase tracking-widest text-gray-400 mb-2 block font-mono group-focus-within:text-[#3300FF] transition-colors"
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
                className={getInputClasses(false)}
                placeholder="ENTER CORPORATION"
              />
            </div>
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <label
                  htmlFor="email"
                  className={`text-xs uppercase tracking-widest block font-mono group-focus-within:text-[#3300FF] transition-colors ${
                    errors.email ? "text-[#FF0033]" : "text-gray-400"
                  }`}
                >
                  02 // Email Protocol
                </label>
                {errors.email && (
                  <span
                    role="alert"
                    className="text-[#FF0033] text-[10px] tracking-widest font-mono font-bold animate-pulse"
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
                className={getInputClasses(!!errors.email)}
                placeholder="NAME@DOMAIN.COM"
                onChange={() => setErrors((prev) => ({ ...prev, email: undefined }))}
              />
            </div>
            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <label
                  htmlFor="specs"
                  className={`text-xs uppercase tracking-widest block font-mono group-focus-within:text-[#3300FF] transition-colors ${
                    errors.specs ? "text-[#FF0033]" : "text-gray-400"
                  }`}
                >
                  03 // Project Specifications
                </label>
                {errors.specs && (
                  <span
                    role="alert"
                    className="text-[#FF0033] text-[10px] tracking-widest font-mono font-bold animate-pulse"
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
                className={`${getInputClasses(!!errors.specs)} resize-none`}
                placeholder="FABRIC / QUANTITY / TIMELINE"
                onChange={() => setErrors((prev) => ({ ...prev, specs: undefined }))}
              ></textarea>
            </div>

            <Magnetic strength={0.4}>
              <button
                ref={btnRef}
                type="submit"
                disabled={isSubmitting || isSent}
                aria-busy={isSubmitting}
                className={`mt-8 px-12 py-4 border transition-all duration-300 uppercase tracking-widest text-sm relative overflow-hidden font-bold ${
                  isSent
                    ? "border-[#CCFF00] text-[#CCFF00] cursor-default"
                    : "border-white/30 hover:bg-white hover:text-black hover:border-white"
                }`}
                onMouseEnter={() => !isSent && !isMobile && setCursor(CursorVariant.BUTTON)}
                onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
              >
                {isSubmitting ? "PROCESSING..." : isSent ? "CONFIRMED" : "INITIALIZE ORDER"}
              </button>
            </Magnetic>
          </form>
        </div>

        <div className="md:col-span-1 flex flex-col justify-between border-l border-white/10 pl-8">
          <div>
            <h4 className="uppercase tracking-widest text-gray-500 mb-4 text-xs font-mono">
              [ HQ COORDINATES ]
            </h4>
            <p className="text-lg leading-relaxed text-gray-300">
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
            <a
              href="mailto:hello@runapparel.com"
              className="text-lg hover:text-[#3300FF] transition-all duration-300 block text-gray-300 hover:scale-105 origin-left"
            >
              hello@runapparel.com
            </a>
            <a
              href="tel:+41441234567"
              className="text-lg hover:text-[#3300FF] transition-all duration-300 block text-gray-300 hover:scale-105 origin-left"
            >
              +41 44 123 45 67
            </a>
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col justify-between border-l border-white/10 pl-8">
          <div>
            <h4 className="uppercase tracking-widest text-gray-500 mb-4 text-xs font-mono">
              [ NETWORK ]
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="hover:text-[#3300FF] transition-all duration-300 text-gray-300 inline-block hover:scale-105 origin-left"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#3300FF] transition-all duration-300 text-gray-300 inline-block hover:scale-105 origin-left"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#3300FF] transition-all duration-300 text-gray-300 inline-block hover:scale-105 origin-left"
                >
                  Behance
                </a>
              </li>
            </ul>
          </div>
          <div className="mt-12">
            <h4 className="uppercase tracking-widest text-gray-500 mb-4 text-xs font-mono">
              [ PROTOCOLS ]
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-all duration-300 inline-block hover:scale-105 origin-left"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-all duration-300 inline-block hover:scale-105 origin-left"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full text-center relative z-10 translate-y-[20%]">
        <h1
          ref={textRef}
          className="text-[18vw] leading-none font-bold tracking-tighter text-[#FAFAFA] select-none mix-blend-overlay opacity-30"
        >
          RUN APPAREL
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
