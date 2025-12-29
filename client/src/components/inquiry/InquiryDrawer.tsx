import { zodResolver } from "@hookform/resolvers/zod";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useHydratedStore } from "../../lib/useHydratedStore";
import { useQuoteStore } from "../../stores/useQuoteStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

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

  const methods = useForm<InquiryFormData>({
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
        className="fixed inset-0 z-modal-backdrop bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer - Wrapped in FocusScope for keyboard accessibility */}
      <FocusScope trapped restoreFocus>
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
                {items.length === 0 ? (
                  <div className="rounded-xl border-2 border-slate-200 border-dashed py-12 text-center">
                    <p className="text-slate-500">Your quote list is empty.</p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-4 font-medium text-blue-600 hover:underline"
                    >
                      Browse Catalog
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Selected Items ({items.length})
                    </h3>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-16 w-16 rounded-md bg-white object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-medium text-slate-900">{item.name}</h4>
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center rounded-md border border-slate-200 bg-white">
                              <button
                                type="button"
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
                              <span className="w-12 px-2 text-center font-medium text-sm">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromQuote(item.id)}
                              className="text-red-500 text-xs hover:underline"
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
                <div className="border-slate-100 border-t bg-slate-50/50 p-6">
                  <h3 className="mb-4 font-bold text-lg text-slate-900">Contact Details</h3>
                  <Form {...methods}>
                    <form
                      id="inquiry-form"
                      onSubmit={methods.handleSubmit((data) => mutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={methods.control}
                        name="contact.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white"
                                error={!!methods.formState.errors.contact?.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={methods.control}
                        name="contact.company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                              Company Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white"
                                error={!!methods.formState.errors.contact?.company}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={methods.control}
                        name="contact.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                              Work Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white"
                                error={!!methods.formState.errors.contact?.email}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={methods.control}
                        name="contact.projectDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                              Project Description (Optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                className="resize-none bg-white"
                                placeholder="Tell us about your project requirements..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
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
