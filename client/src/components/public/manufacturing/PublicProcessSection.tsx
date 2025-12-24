import type { ManufacturingProcess, MediaAsset } from "@shared/schema";
import { motion } from "framer-motion";
import { ManufacturingErrorBoundary } from "@/components/manufacturing-error-boundary";
import { ProcessCard } from "@/components/shared/manufacturing";
import { SmartBentoGrid } from "@/components/ui/smart-bento-grid";

interface PublicProcessSectionProps {
	mediaAssets: MediaAsset[];
	processes: ManufacturingProcess[];
}

export function PublicProcessSection({
	mediaAssets,
	processes,
}: PublicProcessSectionProps) {
	// Filter active processes
	const activeProcesses = Array.isArray(processes)
		? processes.filter((process) => process.isActive !== false)
		: [];

	if (activeProcesses.length === 0) {
		return null;
	}

	return (
		<ManufacturingErrorBoundary>
			<section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
				<div className="mx-auto max-w-2xl px-6 lg:max-w-7xl">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-12"
					>
						<h2 className="text-4xl font-bold text-gray-900 mb-4">
							Manufacturing Processes
						</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							Advanced manufacturing techniques delivering precision and quality
							at every stage
						</p>
					</motion.div>

					<SmartBentoGrid>
						{activeProcesses.map((process, index) => (
							<ProcessCard
								key={process.id}
								process={process}
								index={index}
								mediaAssets={mediaAssets}
							/>
						))}
					</SmartBentoGrid>
				</div>
			</section>
		</ManufacturingErrorBoundary>
	);
}
