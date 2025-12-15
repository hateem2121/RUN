import React, { useOptimistic, useTransition, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simulated Server Action
const subscribeToNewsletter = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (email.includes("error")) {
    return { success: false, message: "Invalid email address." };
  }

  return { success: true, message: "Successfully subscribed!" };
};

const NewsletterSignup: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "",
  });

  // REACT 19: Optimistic UI
  // Immediately show success state while the server processes
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    formState.status,
    (_state: string, newStatus: string) => newStatus,
  );

  const handleSubmit = (formData: FormData) => {
    const email = formData.get("email") as string;

    // 1. Optimistically update UI to success immediately
    startTransition(async () => {
      addOptimisticStatus("success");

      // 2. Perform actual server action
      const result = await subscribeToNewsletter(email);

      // 3. Reconcile real state
      if (result.success) {
        setFormState({ status: "success", message: result.message });
      } else {
        setFormState({ status: "error", message: result.message });
      }
    });
  };

  return (
    <section className="w-full py-24 bg-luxury-surface border-t border-black/5">
      <div className="max-w-md mx-auto px-6 text-center">
        <h3 className="text-2xl font-bold uppercase mb-2 tracking-tight">Stay in the Loop</h3>
        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto text-balance">
          Receive early access to new drops and exclusive archival content.
        </p>

        <form action={handleSubmit} className="relative">
          <div className="relative overflow-hidden rounded-full border border-black/10 bg-white shadow-sm-xs transition-shadow-sm focus-within:shadow-md focus-within:border-black/30">
            <AnimatePresence mode="wait">
              {optimisticStatus === "success" ? (
                <motion.div
                  key="success"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-100 text-green-600 font-medium text-sm"
                >
                  ✓ Subscribed
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex w-full"
                >
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="ENTER EMAIL"
                    className="flex-1 px-6 py-4 text-sm outline-hidden bg-transparent placeholder:text-xs placeholder:tracking-widest placeholder:uppercase"
                    disabled={isPending}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-4 text-xs font-bold uppercase tracking-widest hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "..." : "Join"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          {formState.status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 w-full text-center text-xs text-red-500 mt-2"
            >
              {formState.message}
            </motion.p>
          )}
        </form>
      </div>
    </section>
  );
};

export default NewsletterSignup;
