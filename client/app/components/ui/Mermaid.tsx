import DOMPurify from "dompurify";
import mermaid from "mermaid";
import { memo, useEffect, useRef, useState } from "react";

export interface MermaidProps {
  chart: string;
  className?: string | undefined; // Optional for Tailwind styling
  theme?: "default" | "dark" | "neutral" | "base" | "forest";
}

const Mermaid = memo(({ chart, className = "", theme = "default" }: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid config
    mermaid.initialize({
      startOnLoad: false,
      theme: theme,
      securityLevel: "strict", // SEC-006: Prevent script execution in diagrams
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
      } catch (_err: unknown) {
        if (isMounted) {
          // Provide a user-friendly fallback
          setError("Unable to render chart. Syntax error or invalid configuration.");
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
        className={`rounded border border-red-300 bg-red-50 p-4 font-mono text-sm whitespace-pre-wrap text-red-600 ${className}`}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-chart ${className}`}
      // SEC-006: Sanitize SVG output before injecting
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized content
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(svgContent, { USE_PROFILES: { svg: true, svgFilters: true } }),
      }}
    />
  );
});

Mermaid.displayName = "Mermaid";

export default Mermaid;
