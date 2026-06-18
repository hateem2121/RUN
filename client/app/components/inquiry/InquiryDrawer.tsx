import { FocusScope } from "@radix-ui/react-focus-scope";
import { AlertCircle, CheckCircle2, Send, X } from "lucide-react";
import { useInquiryForm } from "@/hooks/use-inquiry-form";
import { cn } from "@/lib/utils";
import { InquiryForm } from "./InquiryForm";
import { QuoteList } from "./QuoteList";

export const InquiryDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { form, items, removeFromQuote, updateQuantity, success, error, mutation, onSubmit } =
    useInquiryForm({ onClose });

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close inquiry drawer"
        className="fixed inset-0 z-modal-backdrop bg-black/60 backdrop-blur-md transition-opacity duration-500 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer - Wrapped in FocusScope for keyboard accessibility */}
      <FocusScope trapped>
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-modal flex h-full w-full transform flex-col border-white/10 border-l bg-background shadow-2xl transition-transform duration-500 ease-out md:w-lg animate-in slide-in-from-right",
            "dark:bg-custom-color-233",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-border border-b bg-muted/30 p-6 backdrop-blur-xl">
            <div>
              <h2 className="font-neue-stance font-bold text-foreground text-xl tracking-wide uppercase">
                Project Inquiry
              </h2>
              <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest">
                Review items and request a quote
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inquiry drawer"
              className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="fade-in zoom-in flex flex-1 animate-in flex-col items-center justify-center p-8 text-center duration-500">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-inner ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="font-neue-stance mb-3 font-bold text-3xl text-foreground tracking-tight uppercase">
                Request Received
              </h3>
              <p className="max-w-xs text-balance text-muted-foreground text-sm leading-relaxed tracking-wide">
                Thank you for your interest. Our engineering team will review your requirements and
                reach out with a detailed quote shortly.
              </p>
              <button
                aria-label="Action button"
                type="button"
                onClick={onClose}
                className="mt-10 rounded-full border border-border bg-muted/50 px-8 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-all hover:bg-muted hover:border-foreground active:scale-95"
              >
                Return to Site
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
                <div className="border-border border-t bg-muted/20 p-6">
                  <h3 className="font-neue-stance mb-6 font-bold text-sm text-foreground uppercase tracking-widest">
                    Contact Details
                  </h3>

                  {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="text-xs tracking-wide">
                        <p className="font-bold uppercase mb-1">Submission Error</p>
                        <p className="opacity-90">{error}</p>
                      </div>
                    </div>
                  )}

                  <InquiryForm form={form} onSubmit={onSubmit} />
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {!success && items.length > 0 && (
            <div className="border-border border-t bg-background/80 p-6 backdrop-blur-xl">
              <button
                aria-label="Action button"
                type="submit"
                form="inquiry-form"
                disabled={mutation.isPending}
                className={cn(
                  "flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 py-5 font-bold text-background transition-all active:scale-custom-misc-157 disabled:cursor-not-allowed disabled:opacity-50",
                  "hover:bg-foreground/90 hover:shadow-xl hover:shadow-foreground/10",
                )}
              >
                <span className="text-xs uppercase tracking-widest">
                  {mutation.isPending ? "Processing..." : "Submit Quote Request"}
                </span>
                {!mutation.isPending && <Send className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </FocusScope>
    </>
  );
};
