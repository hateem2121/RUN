import type {
	HomepageProcessCard,
	HomepageSection,
	MediaAsset,
} from "@shared/schema";
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
		className={`animate-pulse ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg mx-4`}
	/>
);

export function ProcessSection({
	processSection,
	processCards,
	mediaAssets,
	isLoadingMedia,
}: ProcessSectionProps) {
	if (
		!processSection.isActive ||
		!Array.isArray(processCards) ||
		processCards.length === 0
	) {
		return null;
	}

	return (
		<Suspense fallback={<LoadingSection height="h-96" />}>
			<section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 font-neue-stance">
						{processSection.title}
					</h2>
					<p className="dark:text-neutral-400 mb-12 text-center text-black/44 text-base">
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
							className="mt-8 md:mt-12 min-h-[500px] sm:min-h-[600px] md:min-h-[700px]"
						/>
					) : (
						<div className="mt-8 md:mt-12 min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center">
							<div className="text-center space-y-4">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
								<p className="text-gray-600">Loading process cards...</p>
							</div>
						</div>
					)}
				</div>
			</section>
		</Suspense>
	);
}
