import { zodResolver } from "@hookform/resolvers/zod";
import { 
  type QuoteSubmissionData as InquiryFormData, 
  QuoteSubmissionSchema as inquiryFormSchema 
} from "@shared/validation/contact";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "../lib/queryClient";
import { useHydratedStore } from "../lib/useHydratedStore";
import { type QuoteItem, type QuoteStore, useQuoteStore } from "../stores/useQuoteStore";

export type { InquiryFormData };
export { inquiryFormSchema };

interface UseInquiryFormProps {
  onClose: () => void;
}

export function useInquiryForm({ onClose }: UseInquiryFormProps) {
  // Use hydrated store to prevent mismatch
  const store = useHydratedStore(useQuoteStore, (state) => state) as QuoteStore | undefined;

  // Safe defaults if not hydrated
  const items = store?.items ?? [];
  const removeFromQuote = store?.removeFromQuote ?? (() => {});
  const updateQuantity = store?.updateQuantity ?? (() => {});
  const clearQuote = store?.clearQuote ?? (() => {});

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const payload = {
        contact: data.contact,
        items: items.map((i: QuoteItem) => ({
          productId: i.id,
          quantity: i.quantity,
          notes: i.notes || "", // Default notes
        })),
      };

      try {
        // Submit via API endpoint
        return await apiRequest("/api/inquiries", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            source: "quote_drawer",
          }),
        });
      } catch (err) {
        console.error("[useInquiryForm] Submission failed:", err);
        throw err;
      }
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      clearQuote();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 5000); // Give user more time to see success
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to submit inquiry. Please try again.");
      setSuccess(false);
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    mutation.mutate(data);
  };

  return {
    form,
    items,
    removeFromQuote,
    updateQuantity,
    success,
    error,
    mutation,
    onSubmit,
  };
}
