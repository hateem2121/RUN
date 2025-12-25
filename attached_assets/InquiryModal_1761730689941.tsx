import type React from "react";
import { useState } from "react";
import ClippedElement from "./ClippedElement";
import { XIcon } from "./Icons";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

type FormState = "idle" | "submitting" | "success";

const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, productName }) => {
  const [formState, setFormState] = useState<FormState>("idle");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("submitting");
    // Simulate API call
    setTimeout(() => {
      setFormState("success");
    }, 1000);
  };

  const handleClose = () => {
    setFormState("idle");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm sm:p-6"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <ClippedElement
        className="relative w-full max-w-lg bg-white p-6 sm:p-8 md:p-12"
        clipAmount={30}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-gray-400 transition-colors hover:text-black"
          aria-label="Close"
        >
          <XIcon className="h-6 w-6" />
        </button>

        {formState !== "success" ? (
          <>
            <h2 className="mb-2 font-black-display text-3xl">Inquiry For:</h2>
            <p className="mb-8 text-gray-600">{productName}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="companyName"
                  className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="contactEmail"
                  className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                >
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="moq"
                  className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                >
                  Estimated Order Quantity (MOQ)
                </label>
                <input
                  type="number"
                  id="moq"
                  name="moq"
                  min="100"
                  placeholder="100"
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block font-semibold text-xs uppercase tracking-widest"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Describe your customization needs (e.g., branding, material changes, etc.)"
                  className="form-input"
                ></textarea>
              </div>
              <ClippedElement
                as="button"
                type="submit"
                disabled={formState === "submitting"}
                className="mt-4 w-full bg-black py-4 font-bold text-sm text-white tracking-[0.2em] transition-colors hover:bg-gray-800 disabled:bg-gray-400"
              >
                {formState === "submitting" ? "SENDING..." : "SUBMIT INQUIRY"}
              </ClippedElement>
            </form>
          </>
        ) : (
          <div className="animate-fade-in py-12 text-center">
            <h2 className="mb-4 font-black-display text-3xl">INQUIRY SENT</h2>
            <p className="mx-auto mb-8 max-w-sm text-gray-700">
              Thank you for your interest in RUN APPAREL. Our partnership team will review your
              request and be in touch within 24-48 hours.
            </p>
            <ClippedElement
              as="button"
              onClick={handleClose}
              className="bg-black px-10 py-3 font-bold text-sm text-white tracking-[0.2em] transition-colors hover:bg-gray-800"
            >
              CLOSE
            </ClippedElement>
          </div>
        )}
      </ClippedElement>
    </div>
  );
};

export default InquiryModal;
