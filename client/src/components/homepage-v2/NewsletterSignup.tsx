import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Button } from "@/components/ui/button";

// Simulated Server Action
const _subscribeToNewsletter = async (
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
  // REACT 19: useActionState (Replaces useState + useTransition for forms)
  const [state, formAction, isPending] = React.useActionState(
    async (_state: any, formData: FormData) => {
      const email = formData.get("email") as string;
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay

      if (email.includes("error")) {
        return { status: "error", message: "Invalid email address." };
      }
      return { status: "success", message: "Successfully subscribed!" };
    },
    { status: "idle", message: "" }, // Initial State
  );

  return (
    <section className="w-full border-black/5 border-t bg-luxury-surface py-24">
      <div className="mx-auto max-w-md px-6 text-center">
        <h3 className="mb-2 font-bold text-2xl uppercase tracking-tight">Stay in the Loop</h3>
        <p className="mx-auto mb-8 max-w-xs text-balance text-gray-500 text-sm">
          Receive early access to new drops and exclusive archival content.
        </p>

        <form action={formAction} className="relative">
          <div className="relative overflow-hidden rounded-full border border-black/10 bg-white shadow-sm-xs transition-shadow-sm focus-within:border-black/30 focus-within:shadow-md">
            <AnimatePresence mode="wait">
              {state.status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-100 font-medium text-green-600 text-sm"
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
                    className="flex-1 bg-transparent px-6 py-4 text-sm outline-hidden placeholder:text-xs placeholder:uppercase placeholder:tracking-widest"
                    disabled={isPending}
                  />
                  <Button
                    type="submit"
                    disabled={isPending}
                    variant="ghost"
                    className="h-auto rounded-none px-6 py-4 font-bold text-xs text-foreground uppercase tracking-widest hover:bg-transparent hover:text-blue-600"
                  >
                    {isPending ? "..." : "Join"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          {state.status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-2 w-full text-center text-red-500 text-xs"
            >
              {state.message}
            </motion.p>
          )}
        </form>
      </div>
    </section>
  );
};

export default NewsletterSignup;
