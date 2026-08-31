import { cva } from "class-variance-authority";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/ui/Magnetic";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCursorStore } from "@/stores/useCursorStore";

const footerInputVariants = cva(
  "focus-visible:border-primary focus-visible:shadow-glow-primary focus-visible:bg-primary/5 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background w-full rounded-none border-b bg-transparent py-4 pl-4 font-mono text-xl transition-all duration-300 ease-out outline-hidden disabled:opacity-50",
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

export function FooterInquiryForm() {
  const { setCursor, resetCursor } = useCursorStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [errors, setErrors] = useState<{
    email?: string | undefined;
    specs?: string;
  }>({});

  const formRef = useRef<HTMLFormElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submitTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      submitTimelineRef.current?.kill();
    };
  }, []);

  const handleSubmit = async (formDataAction: FormData) => {
    // Zero-friction Honeypot Bot Shield
    const honeypot = formDataAction.get("b_fax_field") as string;
    if (honeypot) {
      // Fake instant success for automated spambots to prevent DB egress
      setIsSubmitting(false);
      setIsSent(true);
      setShowSuccess(true);
      return;
    }

    // Get form elements via formData for robustness
    const company = formDataAction.get("company") as string;
    const email = formDataAction.get("email") as string;
    const specs = formDataAction.get("specs") as string;

    // Validation Logic
    const newErrors: { email?: string | undefined; specs?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      newErrors.email = "INVALID EMAIL FORMAT";
    }

    if (!specs || specs.trim().length < 10) {
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
      submitTimelineRef.current?.kill();
      const tl = gsap.timeline();
      submitTimelineRef.current = tl;
      tl.to(btn, { scale: 0.9, duration: 0.1, ease: "power2.inOut" })
        .to(btn, { scale: 1.1, opacity: 0, duration: 0.15, ease: "power2.out" })
        .call(() => setIsSubmitting(true))
        .to(btn, { scale: 1, opacity: 1, duration: 0.2, ease: "power2.in" });
    } else {
      setIsSubmitting(true);
    }

    // Submit to API
    try {
      await apiRequest("/api/inquiries", {
        method: "POST",
        body: JSON.stringify({
          contact: {
            company: company || "",
            email: email || "",
            projectDescription: attachedFile
              ? `${specs}\n[Attached Tech-Pack: ${attachedFile.name} (${attachedFile.size})]`
              : specs || "",
          },
          items: [],
          source: "footer_form",
        }),
      });

      setIsSubmitting(false);
      setIsSent(true);
      setShowSuccess(true);
      setAttachedFile(null);
      if (formRef.current) {
        formRef.current.reset();
      }

      // Hide message after 5 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowSuccess(false);
        setIsSent(false);
      }, 5000);
    } catch (_error) {
      setIsSubmitting(false);
      setErrors({ email: "SUBMISSION FAILED - TRY AGAIN" });
    }
  };

  return (
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
          <p className="text-brand-lime font-mono text-sm tracking-widest">SUBMISSION CONFIRMED!</p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="mt-12 max-w-lg space-y-8">
        {/* Anti-bot honeypot field (hidden from screen readers and visual viewport) */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="b_fax_field">Do not fill this field</label>
          <input type="text" id="b_fax_field" name="b_fax_field" tabIndex={-1} autoComplete="off" />
        </div>

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
            disabled={isSubmitting || isSent}
            className={footerInputVariants({ hasError: false })}
            placeholder="ENTER CORPORATION"
          />
        </div>
        <div className="group">
          <div className="mb-2 flex items-end justify-between">
            <label
              htmlFor="footer-email"
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
            id="footer-email"
            type="email"
            name="email"
            autoComplete="email"
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
            disabled={isSubmitting || isSent}
            className={cn(footerInputVariants({ hasError: !!errors.specs }), "resize-none")}
            placeholder="FABRIC / QUANTITY / TIMELINE"
            onChange={() => setErrors(({ specs, ...prev }) => prev)}
          />
        </div>

        {/* Tech-Pack Drag-and-Drop Dropzone */}
        <div className="group">
          <label
            htmlFor="tech-pack-file"
            className="text-muted-foreground group-focus-within:text-primary mb-2 block pl-4 font-mono text-xs tracking-widest uppercase transition-colors"
          >
            <span className="hidden sm:inline">04 </span>
            TECH-PACK ATTACHMENT (OPTIONAL)
          </label>
          <div className="relative flex items-center justify-between border border-dashed border-foreground/30 p-4 transition-colors hover:border-primary">
            {attachedFile ? (
              <div className="flex w-full items-center justify-between font-mono text-xs text-brand-lime">
                <span>
                  📄 {attachedFile.name} ({attachedFile.size})
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-xs text-destructive hover:underline p-2 min-h-[36px] inline-flex items-center rounded focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-destructive"
                >
                  REMOVE
                </button>
              </div>
            ) : (
              <label
                htmlFor="tech-pack-file"
                className="flex w-full cursor-pointer items-center justify-between font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                <span>DROP .PDF, .AI, .DXF TECH-PACK (MAX 25MB)</span>
                <span className="rounded bg-neutral-800 px-3 py-1.5 text-xs text-white min-h-[28px] inline-flex items-center">
                  BROWSE
                </span>
              </label>
            )}
            <input
              id="tech-pack-file"
              type="file"
              accept=".pdf,.ai,.dxf,.zip,.png,.jpg"
              className="sr-only"
              disabled={isSubmitting || isSent}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const sizeKb = (file.size / 1024).toFixed(0);
                  const sizeStr =
                    file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${sizeKb} KB`;
                  setAttachedFile({ name: file.name, size: sizeStr });
                }
              }}
            />
          </div>
        </div>

        <Magnetic strength={0.4}>
          <button
            ref={btnRef}
            type="submit"
            disabled={isSubmitting || isSent}
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
  );
}
