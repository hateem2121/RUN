import type { HomepageProcessCard, HomepageSection, MediaAsset } from "@shared/schema";
import { Suspense } from "react";
import {
  convertProcessCardsToDraggableCards,
  OptimizedDraggableCardsWrapper,
} from "@/components/homepage/optimized-draggable-cards-wrapper";

interface ProcessSectionProps {
  processSection: HomepageSection;
  processCards: HomepageProcessCard[];
  mediaAssets: MediaAsset[];
  isLoadingMedia: boolean;
}

const LoadingSection = ({ height = "h-32" }: { height?: string }) => (
  <div
    className={`animate-pulse ${height} mx-4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200`}
  />
);

export function ProcessSection({
  processSection,
  processCards,
  mediaAssets,
  isLoadingMedia,
}: ProcessSectionProps) {
  if (!processSection.isActive || !Array.isArray(processCards) || processCards.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingSection height="h-96" />}>
      <section className="relative bg-white px-4 py-20 sm:px-6 lg:px-8 dark:bg-black">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center font-bold font-neue-stance text-4xl sm:text-5xl">
            {processSection.title}
          </h2>
          <p className="mb-12 text-center text-base text-black/44 dark:text-neutral-400">
            {processSection.content || ""}
          </p>

          {/* Only render cards once media is loaded or if no media is needed */}
          {!isLoadingMedia || mediaAssets.length > 0 ? (
            <OptimizedDraggableCardsWrapper
              items={convertProcessCardsToDraggableCards(
                processCards.map((card) => ({
                  ...card,
                  description: card.description || "",
                  icon: card.icon ?? undefined,
                  iconType:
                    card.iconType === "image" || card.iconType === "text"
                      ? card.iconType
                      : undefined,
                })),
                mediaAssets,
              )}
              className="mt-8 min-h-[500px] sm:min-h-[600px] md:mt-12 md:min-h-[700px]"
            />
          ) : (
            <div className="mt-8 flex min-h-[500px] items-center justify-center sm:min-h-[600px] md:mt-12 md:min-h-[700px]">
              <div className="space-y-4 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-gray-900 border-b-2"></div>
                <p className="text-gray-600">Loading process cards...</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Suspense>
  );
}
