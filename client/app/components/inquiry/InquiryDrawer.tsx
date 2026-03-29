import { FocusScope } from "@radix-ui/react-focus-scope";
import { useInquiryForm } from "@/hooks/use-inquiry-form";
import { InquiryForm } from "./InquiryForm";
import { QuoteList } from "./QuoteList";

export const InquiryDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { form, items, removeFromQuote, updateQuantity, success, mutation, onSubmit } =
    useInquiryForm({ onClose });

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-modal-backdrop bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer - Wrapped in FocusScope for keyboard accessibility */}
      <FocusScope trapped>
        <div className="fixed inset-y-0 right-0 z-modal flex h-full w-full transform flex-col border-slate-200 border-l bg-white shadow-2xl transition-transform duration-300 ease-in-out md:w-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-slate-100 border-b bg-slate-50 p-6">
            <div>
              <h2 className="font-bold text-slate-900 text-xl">Project Inquiry</h2>
              <p className="mt-1 text-slate-500 text-sm">Review items and request a quote</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inquiry drawer"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {success ? (
            <div className="fade-in zoom-in flex flex-1 animate-in flex-col items-center justify-center p-8 text-center duration-300">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-2xl text-slate-900">Request Received!</h3>
              <p className="text-slate-600">
                We have received your project inquiry. Our engineering team will review your
                specifications and contact you shortly.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Items List */}
              <div className="space-y-6 p-6">
                <QuoteList
                  items={items}
                  updateQuantity={updateQuantity}
                  removeFromQuote={removeFromQuote}
                  onClose={onClose}
                />
              </div>

              {/* Inquiry Form */}
              {items.length > 0 && (
                <div className="border-slate-100 border-t bg-slate-50/50 p-6">
                  <h3 className="mb-4 font-bold text-lg text-slate-900">Contact Details</h3>
                  <InquiryForm form={form} onSubmit={onSubmit} />
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {!success && items.length > 0 && (
            <div className="border-slate-200 border-t bg-white p-6">
              <button
                type="submit"
                form="inquiry-form"
                disabled={mutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-blue-600/20 shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? "Processing..." : "Submit Quote Request"}
                {!mutation.isPending && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </FocusScope>
    </>
  );
};
