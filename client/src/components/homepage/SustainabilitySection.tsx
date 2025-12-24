import type { HomepageSection } from "@shared/schema";
import type { SustainabilitySectionData } from "@shared/types/homepage";
import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { MagneticButton } from "@/components/homepage/magnetic-button";
import { NewsletterSignup } from "@/components/homepage/newsletter-signup";
import { LiquidGlassCard } from "@/components/ui/glass-card";

const HyperspaceBackground = lazy(() =>
  import("@/components/ui/hyperspace-background").then((m) => ({
    default: m.HyperspaceBackground,
  })),
);

interface SustainabilitySectionProps {
  sustainabilitySection: HomepageSection;

  email: string;
  setEmail: (email: string) => void;
  emailSubmitted: boolean;
  handleNewsletterSubmit: (e: React.FormEvent) => void;
}

const LoadingSection = ({ height = "h-32" }: { height?: string }) => (
  <div
    className={`animate-pulse ${height} mx-4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200`}
  />
);

export function SustainabilitySection({
  sustainabilitySection,

  email,
  setEmail,
  emailSubmitted,
  handleNewsletterSubmit,
}: SustainabilitySectionProps) {
  if (!sustainabilitySection.isActive) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingSection height="h-screen" />}>
      <section className="relative overflow-hidden bg-black px-4 py-20 sm:px-6 lg:px-8">
        {/* Hyperspace Background - Foundation Layer */}
        <div className="absolute inset-0 h-full w-full">
          <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
            <HyperspaceBackground />
          </Suspense>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <h2 className="mb-4 text-center font-bold font-neue-stance text-4xl text-white sm:text-5xl">
            {sustainabilitySection.title}
          </h2>

          <p className="mx-auto mb-12 max-w-3xl text-center font-light text-lg text-white/80">
            {sustainabilitySection.content || ""}
          </p>

          {/* Certificate Cards */}

          {/* Sustainability Content */}

          {/* Call-to-Action Section */}
          <div className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <LiquidGlassCard
                blurIntensity="md"
                glowIntensity="sm"
                shadowIntensity="md"
                className="p-6 transition-transform hover:scale-[1.02]"
              >
                <h3 className="mb-4 font-semibold text-white text-xl">Get Involved</h3>
                <div className="space-y-4">
                  <MagneticButton
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      // Safe access using unknown cast first if needed, or better type assertion
                      const settings = sustainabilitySection.data as Record<string, any> | null;
                      if (settings?.primaryCta?.link) {
                        globalThis.location.href = settings.primaryCta.link;
                      }
                    }}
                  >
                    {(sustainabilitySection.data as Record<string, any> | null)?.primaryCta?.text ||
                      "View Our Sustainability Report"}
                  </MagneticButton>
                  <MagneticButton
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      const settings = sustainabilitySection.data as Record<string, any> | null;
                      if (settings?.secondaryCta?.link) {
                        globalThis.location.href = settings.secondaryCta.link;
                      }
                    }}
                  >
                    {(sustainabilitySection.data as Record<string, any> | null)?.secondaryCta
                      ?.text || "Partner With Us"}
                  </MagneticButton>
                </div>
              </LiquidGlassCard>
            </motion.div>

            {/* Newsletter Signup */}
            <NewsletterSignup
              newsletterData={(sustainabilitySection.data as SustainabilitySectionData)?.newsletter}
              email={email}
              setEmail={setEmail}
              emailSubmitted={emailSubmitted}
              handleSubmit={handleNewsletterSubmit}
            />
          </div>
        </div>
      </section>
    </Suspense>
  );
}
