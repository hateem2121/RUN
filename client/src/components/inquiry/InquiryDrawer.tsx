import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useHydratedStore } from "../../lib/useHydratedStore";
import { useQuoteStore } from "../../stores/useQuoteStore";

// Form Validation Schema
const inquiryFormSchema = z.object({
  contact: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    company: z.string().min(2, "Company is required"),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
});

type InquiryFormData = z.infer<typeof inquiryFormSchema>;

export const InquiryDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  // Use hydrated store to prevent mismatch
  const store = useHydratedStore(useQuoteStore, (state) => state);

  // Safe defaults if not hydrated
  const items = store?.items ?? [];
  const removeFromQuote = store?.removeFromQuote ?? (() => {});
  const updateQuantity = store?.updateQuantity ?? (() => {});
  const clearQuote = store?.clearQuote ?? (() => {});

  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const payload = {
        ...data,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submission failed");
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      clearQuote();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    },
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-modal-backdrop transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-modal transform transition-transform duration-300 ease-in-out flex flex-col h-full border-l border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Project Inquiry</h2>
            <p className="text-sm text-slate-500 mt-1">Review items and request a quote</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
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
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h3>
            <p className="text-slate-600">
              We have received your project inquiry. Our engineering team will review your
              specifications and contact you shortly.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Items List */}
            <div className="p-6 space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-500">Your quote list is empty.</p>
                  <button
                    onClick={onClose}
                    className="mt-4 text-blue-600 font-medium hover:underline"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Selected Items ({items.length})
                  </h3>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md bg-white"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center border border-slate-200 rounded-md bg-white">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  Math.max(item.minOrderQuantity, item.quantity - 1),
                                )
                              }
                              className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                            >
                              -
                            </button>
                            <span className="px-2 text-sm font-medium w-12 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromQuote(item.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inquiry Form */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Details</h3>
                <form
                  id="inquiry-form"
                  onSubmit={handleSubmit((data) => mutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      {...register("contact.name")}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.contact?.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.contact.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name
                    </label>
                    <input
                      {...register("contact.company")}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.contact?.company && (
                      <p className="text-red-500 text-xs mt-1">{errors.contact.company.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Work Email
                    </label>
                    <input
                      {...register("contact.email")}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.contact?.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.contact.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Project Description (Optional)
                    </label>
                    <textarea
                      {...register("contact.projectDescription")}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Tell us about your project requirements..."
                    />
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {!success && items.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-white">
            <button
              type="submit"
              form="inquiry-form"
              disabled={mutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
    </>
  );
};
