import { motion, AnimatePresence } from "framer-motion";
import { LiquidGlassCard } from "@/components/ui/glass-card";
import { MagneticButton } from "@/components/homepage/magnetic-button";

interface NewsletterData {
  title?: string;
  description?: string;
  buttonText?: string;
}

interface NewsletterSignupProps {
  newsletterData?: NewsletterData;
  email: string;
  setEmail: (email: string) => void;
  emailSubmitted: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function NewsletterSignup({
  newsletterData,
  email,
  setEmail,
  emailSubmitted,
  handleSubmit,
}: NewsletterSignupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      <LiquidGlassCard
        blurIntensity="md"
        glowIntensity="sm"
        shadowIntensity="md"
        className="p-6"
      >
        <AnimatePresence mode="wait">
          {!emailSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {newsletterData?.title || "Stay Updated"}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {newsletterData?.description ||
                  "Get the latest updates on our sustainability initiatives and eco-friendly innovations."}
              </p>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full py-3 px-4 bg-background border border-white/20 dark:border-white/30 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-green-400 transition-colors"
                  required
                  data-testid="input-newsletter-email"
                />
                <MagneticButton
                  variant="primary"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  data-testid="button-newsletter-submit"
                >
                  {newsletterData?.buttonText || "Subscribe to Eco-Updates"}
                </MagneticButton>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 mb-4"
              >
                <motion.svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.path
                    d="M10 20 L17 27 L30 13"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.div>

              <h3 className="text-xl font-semibold text-white mb-2">
                Thank You!
              </h3>
              <p className="text-white/80">
                You're now subscribed to our eco-updates.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </LiquidGlassCard>
    </motion.div>
  );
}
