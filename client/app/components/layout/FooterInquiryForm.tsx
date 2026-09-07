import { cva } from "class-variance-authority";
import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/ui/Magnetic";
import { apiRequest } from "@/lib/api";
import { gsap } from "@/lib/gsap";
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

export interface FooterInquiryFormProps {
  heading?: string | undefined;
}

export function FooterInquiryForm({ heading }: FooterInquiryFormProps = {}) {
  const setCursor = useCursorStore((s) => s.setCursor);
  const resetCursor = useCursorStore((s) => s.resetCursor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    token?: string;
  } | null>(null);
  const [errors, setErrors] = useState<{
    email?: string | undefined;
    specs?: string;
    file?: string;
    submit?: string;
  }>({});

  const formRef = useRef<HTMLFormElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submitTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      submitTimelineRef.current?.kill();
    };
  }, []);

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const ALLOWED_TECHPACK_EXTENSIONS = [
    ".pdf",
    ".ai",
    ".dxf",
    ".zip",
    ".png",
    ".jpg",
    ".jpeg",
  ] as const;

  const processFile = async (file: File) => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (
      !ALLOWED_TECHPACK_EXTENSIONS.includes(ext as (typeof ALLOWED_TECHPACK_EXTENSIONS)[number])
    ) {
      setErrors((prev) => ({
        ...prev,
        file: "INVALID FILE TYPE. ALLOWED: .PDF, .AI, .DXF, .ZIP, .PNG, .JPG",
      }));
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: "TECH-PACK EXCEEDS 25MB LIMIT" }));
      return;
    }
    const sizeKb = (file.size / 1024).toFixed(0);
    const sizeStr =
      file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKb} KB`;

    setIsUploading(true);
    setErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/inquiries/upload-techpack", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAttachedFile({
          name: data.name || file.name,
          size: data.size || sizeStr,
          token: data.token,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrors((prev) => ({
          ...prev,
          file: errData.error || errData.message || "TECH-PACK UPLOAD FAILED. PLEASE RETRY.",
        }));
        handleRemoveFile();
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        file: "NETWORK ERROR DURING TECH-PACK UPLOAD",
      }));
      handleRemoveFile();
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (formDataAction: FormData) => {
    // Prevent premature submit while tech-pack file is still uploading
    if (isUploading) {
      setErrors((prev) => ({
        ...prev,
        file: "PLEASE WAIT FOR TECH-PACK UPLOAD TO COMPLETE",
      }));
      return;
    }

    // In-flight mutex prevents duplicate inquiry submissions on rapid double-clicks
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    // Zero-friction Honeypot Bot Shield
    const honeypot = formDataAction.get("b_fax_field") as string;
    if (honeypot) {
      setIsSubmitting(false);
      setIsSent(true);
      setShowSuccess(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowSuccess(false);
        setIsSent(false);
      }, 5000);
      return;
    }

    const company = formDataAction.get("company") as string;
    const email = formDataAction.get("email") as string;
    const specs = formDataAction.get("specs") as string;

    // Validation Logic
    const newErrors: {
      email?: string | undefined;
      specs?: string;
      file?: string;
      submit?: string;
    } = {};
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

    setErrors({});

    // Synchronously set submitting state to prevent race conditions from locking the button
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const btn = btnRef.current;
    if (btn) {
      submitTimelineRef.current?.kill();
      const tl = gsap.timeline();
      submitTimelineRef.current = tl;
      tl.to(btn, { scale: 0.95, duration: 0.1, ease: "power2.inOut" })
        .to(btn, { scale: 1.02, opacity: 0.9, duration: 0.15, ease: "power2.out" })
        .to(btn, { scale: 1, opacity: 1, duration: 0.2, ease: "power2.in" });
    }

    // Submit to API conforming strictly to createInquirySchema
    try {
      await apiRequest("/api/inquiries", {
        method: "POST",
        body: JSON.stringify({
          contact: {
            name: company || email.split("@")[0] || "B2B Partner",
            company: company || "",
            email: email || "",
            message: attachedFile
              ? `${specs}\n[Attached Tech-Pack: ${attachedFile.name} (${attachedFile.size})]`
              : specs || "",
            techPackFileName: attachedFile?.name,
            techPackFileSize: attachedFile?.size,
            techPackUrl: attachedFile?.token
              ? `/api/inquiries/techpack/${attachedFile.token}`
              : undefined,
          },
          items: [],
          source: "footer_form",
          b_fax_field: honeypot || undefined,
        }),
      });

      setIsSubmitting(false);
      setIsSent(true);
      setShowSuccess(true);
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (formRef.current) {
        formRef.current.reset();
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowSuccess(false);
        setIsSent(false);
      }, 5000);
    } catch (error) {
      setIsSubmitting(false);
      const errorMsg =
        error instanceof Error && error.message
          ? error.message.toUpperCase()
          : "SUBMISSION FAILED - TRY AGAIN";
      setErrors({ submit: errorMsg });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="md:col-span-2 lg:col-span-2">
      <h2 className="mb-8 text-4xl sm:text-5xl md:text-5xl lg:text-7xl leading-none font-bold tracking-tighter uppercase break-words">
        {heading ? (
          heading
        ) : (
          <>
            Start Your <br />
            Order
          </>
        )}
      </h2>

      {/* Success Message - ARIA Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showSuccess ? "mb-8 max-h-24 opacity-100" : "mb-0 max-h-0 opacity-0"
        }`}
      >
        {showSuccess && (
          <div className="border-emerald-600/30 dark:border-brand-lime/30 bg-emerald-500/10 dark:bg-brand-lime/5 flex items-center gap-3 border p-4">
            <div className="bg-emerald-600 dark:bg-brand-lime shadow-glow-primary h-2 w-2 animate-pulse motion-reduce:animate-none rounded-full" />
            <p className="text-emerald-700 dark:text-brand-lime font-mono text-sm tracking-widest font-semibold">
              SUBMISSION CONFIRMED!
            </p>
          </div>
        )}
      </div>

      {/* General Submit Error Alert */}
      {errors.submit && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-8 border border-destructive/40 bg-destructive/10 p-4 font-mono text-sm tracking-widest text-destructive"
        >
          [{errors.submit}]
        </div>
      )}

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-8 sm:mt-12 max-w-lg space-y-6 sm:space-y-8"
      >
        {/* Anti-bot honeypot field */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="b_fax_field">Do not fill this field</label>
          <input
            type="text"
            id="b_fax_field"
            name="b_fax_field"
            tabIndex={-1}
            autoComplete="new-password"
          />
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
            disabled={isSubmitting || isSent || isUploading}
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
              <span
                id="footer-email-error"
                role="alert"
                className="text-destructive text-micro animate-pulse motion-reduce:animate-none font-mono"
              >
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
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "footer-email-error" : undefined}
            disabled={isSubmitting || isSent || isUploading}
            className={footerInputVariants({ hasError: !!errors.email })}
            onChange={() => {
              if (errors.email) {
                setErrors(({ email: _, ...prev }) => prev);
              }
            }}
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
              <span
                id="footer-specs-error"
                role="alert"
                className="text-destructive text-micro animate-pulse motion-reduce:animate-none font-mono"
              >
                [{errors.specs}]
              </span>
            )}
          </div>
          <textarea
            id="specs"
            name="specs"
            rows={3}
            aria-invalid={!!errors.specs}
            aria-describedby={errors.specs ? "footer-specs-error" : undefined}
            disabled={isSubmitting || isSent || isUploading}
            className={cn(footerInputVariants({ hasError: !!errors.specs }), "resize-none")}
            placeholder="FABRIC / QUANTITY / TIMELINE"
            onChange={() => {
              if (errors.specs) {
                setErrors(({ specs: _, ...prev }) => prev);
              }
            }}
          />
        </div>

        {/* Tech-Pack Drag-and-Drop Dropzone */}
        <div className="group">
          <div className="mb-2 flex items-end justify-between">
            <label
              htmlFor="tech-pack-file"
              className="text-muted-foreground group-focus-within:text-primary block pl-4 font-mono text-xs tracking-widest uppercase transition-colors"
            >
              <span className="hidden sm:inline">04 </span>
              TECH-PACK ATTACHMENT (OPTIONAL)
            </label>
            {errors.file && (
              <span
                id="footer-file-error"
                role="alert"
                className="text-destructive text-micro animate-pulse motion-reduce:animate-none font-mono"
              >
                [{errors.file}]
              </span>
            )}
          </div>
          <section
            aria-label="Tech pack file upload drop area"
            aria-describedby={errors.file ? "footer-file-error" : undefined}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void processFile(file);
            }}
            className={cn(
              "relative flex items-center justify-between border border-dashed p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:border-primary",
              errors.file
                ? "border-destructive/60 bg-destructive/5"
                : isDragging
                  ? "border-primary bg-primary/10"
                  : "border-foreground/30 hover:border-primary",
            )}
          >
            {attachedFile ? (
              <div className="flex w-full items-center justify-between font-mono text-xs text-emerald-700 dark:text-brand-lime">
                <span className="truncate max-w-[280px]">
                  📄 {attachedFile.name} ({attachedFile.size})
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs text-destructive hover:underline p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-destructive font-mono"
                >
                  REMOVE
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || isSent || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full cursor-pointer items-center justify-between text-muted-foreground hover:text-foreground font-mono text-xs transition-colors focus-visible:outline-hidden disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>
                    {isUploading
                      ? "UPLOADING TECH-PACK..."
                      : "DROP .PDF, .AI, .DXF TECH-PACK (MAX 25MB)"}
                  </span>
                </span>
                <span className="rounded border border-border px-2 py-1 text-xxs tracking-widest uppercase">
                  {isDragging ? "DROP TO UPLOAD" : "BROWSE"}
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              id="tech-pack-file"
              type="file"
              accept=".pdf,.ai,.dxf,.zip,.png,.jpg"
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              disabled={isSubmitting || isSent || isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processFile(file);
              }}
            />
          </section>
        </div>

        <Magnetic strength={0.4}>
          <button
            ref={btnRef}
            type="submit"
            disabled={isSubmitting || isSent || isUploading}
            className={cn(
              "relative mt-8 overflow-hidden border px-8 sm:px-12 py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 w-full sm:w-auto min-h-11 inline-flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSent
                ? "border-emerald-600 dark:border-brand-lime text-emerald-700 dark:text-brand-lime cursor-default"
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
