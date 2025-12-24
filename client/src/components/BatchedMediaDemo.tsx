/**
 * PHASE 1A PROOF OF CONCEPT - Demonstrate N+1 Elimination
 * Simple component to test batch media loading
 */
import { useEffect, useState } from "react";
import { getMediaSrc } from "@/lib/queryClient";

interface BatchedMediaDemoProps {
  assetIds: number[];
}

export function BatchedMediaDemo({ assetIds }: BatchedMediaDemoProps) {
  const [mediaResults, setMediaResults] = useState<
    Record<number, { src: string | null; isInline: boolean; loadTime: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllMedia = async () => {
      const startTime = performance.now();

      // Load all media using batch system
      const results: Record<number, { src: string | null; isInline: boolean; loadTime: number }> =
        {};

      await Promise.all(
        assetIds.map(async (assetId) => {
          const assetStartTime = performance.now();
          const src = await getMediaSrc(assetId);
          const loadTime = performance.now() - assetStartTime;

          results[assetId] = {
            src,
            isInline: src?.startsWith("data:") || false,
            loadTime,
          };
        }),
      );

      const _totalTime = performance.now() - startTime;

      setMediaResults(results);
      setIsLoading(false);
    };

    loadAllMedia();
  }, [assetIds]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-blue-50 p-4" data-testid="batch-demo-loading">
        <h3 className="font-semibold text-blue-800">🚀 Batch Loading Test</h3>
        <p className="text-blue-600">Loading {assetIds.length} assets using batch system...</p>
      </div>
    );
  }

  const inlineCount = Object.values(mediaResults).filter((r) => r.isInline).length;
  const totalAssets = assetIds.length;

  return (
    <div className="rounded-lg bg-green-50 p-4" data-testid="batch-demo-results">
      <h3 className="mb-2 font-semibold text-green-800">✅ Batch Loading Results</h3>

      <div className="mb-4 rounded border bg-white p-3">
        <div className="text-gray-600 text-sm">
          <strong>Performance Impact:</strong>
        </div>
        <div className="font-semibold text-green-700 text-lg">
          {inlineCount}/{totalAssets} assets inlined (eliminated N+1 requests)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {assetIds.map((assetId) => {
          const result = mediaResults[assetId];
          if (!result?.src) return null;

          return (
            <div key={assetId} className="rounded border bg-white p-2">
              <div className="mb-1 text-gray-500 text-xs">
                Asset {assetId} {result.isInline && "📦 INLINED"}
              </div>
              <img
                src={result.src}
                alt={`Asset ${assetId}`}
                className="h-20 w-full rounded object-cover"
                data-testid={`batched-image-${assetId}`}
              />
              <div className="mt-1 text-gray-400 text-xs">
                {result.isInline ? "No HTTP request!" : `${result.loadTime.toFixed(1)}ms`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-gray-500 text-xs">
        🎯 This demo proves Phase 1A eliminates N+1 cascade for small assets
      </div>
    </div>
  );
}
