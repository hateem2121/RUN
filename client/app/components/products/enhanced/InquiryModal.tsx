/**
 * Premium Inquiry Modal Component
 * Styled with ClippedElement for geometric angular cuts and smooth animations
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { ClippedElement } from "@/components/ui/ClippedElement";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId?: string | undefined;
}

type FormState = "idle" | "submitting" | "success" | "error";

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  productName,
  productId,
}) => {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      // apiRequest already throws on non-OK responses and returns parsed JSON
      await apiRequest("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("companyName"),
          email: formData.get("contactEmail"),
          company: formData.get("companyName"),
          message: `Product Inquiry: ${productName} (ID: ${
            productId || "N/A"
          })\n\nEstimated Order Quantity: ${formData.get("moq")}\n\n${
            formData.get("message") || "No additional message provided"
          }`,
          source: "product-page",
        }),
      });

      // If we reach here, the request succeeded
      setFormState("success");
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to submit inquiry. Please try again.");
      setFormState("error");
    }
  };

  const handleClose = () => {
    setFormState("idle");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="center-flex fixed inset-0 z-modal bg-black/70 p-4 sm:p-6"
          onClick={handleClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            <ClippedElement className="bg-white p-6 sm:p-8 md:p-12" clipAmount={30}>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-default text-muted-foreground/70 transition-colors hover:text-black"
                aria-label="Close"
                data-testid="button-close-modal"
              >
                <X className="h-6 w-6" />
              </button>

              <AnimatePresence mode="wait">
                {formState !== "success" ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2
                      className="mb-2 font-black-display text-3xl"
                      data-testid="text-inquiry-title"
                    >
                      Inquiry For:
                    </h2>
                    <p className="mb-8 text-muted-foreground" data-testid="text-product-name">
                      {productName}
                    </p>

                    {formState === "error" && errorMessage && (
                      <div
                        className="mb-6 border border-red-200 bg-red-50 p-4 text-red-700 text-sm"
                        data-testid="text-error-message"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label
                          htmlFor="companyName"
                          className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                        >
                          Company Name
                        </label>
                        <Input
                          type="text"
                          id="companyName"
                          name="companyName"
                          required
                          variant="filled"
                          data-testid="input-company-name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contactEmail"
                          className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                        >
                          Contact Email
                        </label>
                        <Input
                          type="email"
                          id="contactEmail"
                          name="contactEmail"
                          required
                          variant="filled"
                          data-testid="input-contact-email"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="moq"
                          className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                        >
                          Estimated Order Quantity (MOQ)
                        </label>
                        <Input
                          type="number"
                          id="moq"
                          name="moq"
                          min="100"
                          placeholder="100"
                          required
                          variant="filled"
                          data-testid="input-moq"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                        >
                          Message
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          rows={4}
                          placeholder="Describe your customization needs (e.g., branding, material changes, etc.)"
                          variant="filled"
                          data-testid="input-message"
                        />
                      </div>

                      <ClippedElement
                        as="button"
                        type="submit"
                        disabled={formState === "submitting"}
                        className="mt-4 w-full bg-black py-4 font-bold text-sm text-white tracking-[0.2em] transition-colors hover:bg-muted/80 disabled:bg-muted/40"
                        data-testid="button-submit-inquiry"
                      >
                        {formState === "submitting" ? "SENDING..." : "SUBMIT INQUIRY"}
                      </ClippedElement>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 text-center"
                  >
                    <h2
                      className="mb-4 font-black-display text-3xl"
                      data-testid="text-success-title"
                    >
                      INQUIRY SENT
                    </h2>
                    <p
                      className="mx-auto mb-8 max-w-sm text-foreground/80"
                      data-testid="text-success-message"
                    >
                      Thank you for your interest. Our partnership team will review your request and
                      be in touch within 24-48 hours.
                    </p>
                    <ClippedElement
                      as="button"
                      onClick={handleClose}
                      className="bg-black px-10 py-3 font-bold text-sm text-white tracking-[0.2em] transition-colors hover:bg-muted/80"
                      data-testid="button-close-success"
                    >
                      CLOSE
                    </ClippedElement>
                  </motion.div>
                )}
              </AnimatePresence>
            </ClippedElement>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
