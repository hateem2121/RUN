import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Button } from "@/components/ui/button";

// Simulated Server Action
// Simulated Server Action (unused)
// const _subscribeToNewsletter = ...

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
    <section className="bg-luxury-surface w-full border-t border-black/5 py-24">
      <div className="mx-auto max-w-md px-6 text-center">
        <h3 className="mb-2 text-2xl font-bold tracking-tight uppercase">
          Stay in the Loop
        </h3>
        <p className="text-muted-foreground mx-auto mb-8 max-w-xs text-sm text-balance">
          Receive early access to new drops and exclusive archival content.
        </p>

        <form action={formAction} className="relative">
          <div className="shadow-sm-xs transition-shadow-sm relative overflow-hidden rounded-full border border-black/10 bg-white focus-within:border-black/30 focus-within:shadow-md">
            <AnimatePresence mode="wait">
              {state.status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="center-flex bg-muted absolute inset-0 text-sm font-medium text-green-600"
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
                    className="flex-1 bg-transparent px-6 py-4 text-sm outline-hidden placeholder:text-xs placeholder:tracking-widest placeholder:uppercase"
                    disabled={isPending}
                  />
                  <Button
                    type="submit"
                    disabled={isPending}
                    variant="ghost"
                    className="text-foreground h-auto rounded-none px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-transparent hover:text-blue-600"
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
              className="absolute top-full left-0 mt-2 w-full text-center text-xs text-red-500"
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
