import mermaid from "mermaid";
import { memo, useEffect, useRef, useState } from "react";

export interface MermaidProps {
	chart: string;
	className?: string; // Optional for Tailwind styling
	theme?: "default" | "dark" | "neutral" | "base" | "forest";
}

const Mermaid = memo(
	({ chart, className = "", theme = "default" }: MermaidProps) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const [svgContent, setSvgContent] = useState<string>("");
		const [error, setError] = useState<string | null>(null);

		useEffect(() => {
			// Initialize mermaid config
			mermaid.initialize({
				startOnLoad: false,
				theme: theme,
				securityLevel: "loose", // Often needed for click interactions, though standard is 'strict'
			});

			let isMounted = true;
			const id = `mermaid-${crypto.randomUUID()}`;

			const renderChart = async () => {
				try {
					// Reset error state on new render attempt
					setError(null);

					// Generate SVG - mermaid.render returns { svg } object in v10+
					const { svg } = await mermaid.render(id, chart);

					if (isMounted) {
						setSvgContent(svg);
					}
				} catch (err: unknown) {
					if (isMounted) {
						// Provide a user-friendly fallback
						setError(
							"Unable to render chart. Syntax error or invalid configuration.",
						);
					}
				}
			};

			if (chart) {
				renderChart();
			}

			return () => {
				isMounted = false;
				// Cleanup isn't strictly necessary for the 'svgContent' state approach
				// as we replace the dangerousInnerHTML, but good practice to cancel promises if possible (not easily doable here)
			};
		}, [chart, theme]);

		if (error) {
			return (
				<div
					className={`p-4 border border-red-300 bg-red-50 text-red-600 rounded whitespace-pre-wrap font-mono text-sm ${className}`}
				>
					{error}
				</div>
			);
		}

		return (
			<div
				ref={containerRef}
				className={`mermaid-chart ${className}`}
				dangerouslySetInnerHTML={{ __html: svgContent }}
			/>
		);
	},
);

Mermaid.displayName = "Mermaid";

export default Mermaid;
