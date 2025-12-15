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
  const [mediaResults, setMediaResults] = useState<Record<number, { src: string | null; isInline: boolean; loadTime: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllMedia = async () => {
      console.log(`🚀 [BatchDemo] Loading ${assetIds.length} assets:`, assetIds);
      const startTime = performance.now();
      
      // Load all media using batch system
      const results: Record<number, { src: string | null; isInline: boolean; loadTime: number }> = {};
      
      await Promise.all(
        assetIds.map(async (assetId) => {
          const assetStartTime = performance.now();
          const src = await getMediaSrc(assetId);
          const loadTime = performance.now() - assetStartTime;
          
          results[assetId] = {
            src,
            isInline: src?.startsWith('data:') || false,
            loadTime
          };
          
          console.log(`✨ [BatchDemo] Asset ${assetId}:`, {
            isInline: results[assetId].isInline,
            loadTime: `${loadTime.toFixed(1)}ms`,
            hasContent: !!src
          });
        })
      );
      
      const totalTime = performance.now() - startTime;
      console.log(`🎯 [BatchDemo] Total batch loading time: ${totalTime.toFixed(1)}ms`);
      
      setMediaResults(results);
      setIsLoading(false);
    };

    loadAllMedia();
  }, [assetIds]);

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg" data-testid="batch-demo-loading">
        <h3 className="font-semibold text-blue-800">🚀 Batch Loading Test</h3>
        <p className="text-blue-600">Loading {assetIds.length} assets using batch system...</p>
      </div>
    );
  }

  const inlineCount = Object.values(mediaResults).filter(r => r.isInline).length;
  const totalAssets = assetIds.length;

  return (
    <div className="p-4 bg-green-50 rounded-lg" data-testid="batch-demo-results">
      <h3 className="font-semibold text-green-800 mb-2">✅ Batch Loading Results</h3>
      
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="text-sm text-gray-600">
          <strong>Performance Impact:</strong>
        </div>
        <div className="text-lg font-semibold text-green-700">
          {inlineCount}/{totalAssets} assets inlined (eliminated N+1 requests)
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {assetIds.map((assetId) => {
          const result = mediaResults[assetId];
          if (!result?.src) return null;

          return (
            <div key={assetId} className="border rounded p-2 bg-white">
              <div className="text-xs text-gray-500 mb-1">
                Asset {assetId} {result.isInline && "📦 INLINED"}
              </div>
              <img
                src={result.src}
                alt={`Asset ${assetId}`}
                className="w-full h-20 object-cover rounded"
                data-testid={`batched-image-${assetId}`}
              />
              <div className="text-xs text-gray-400 mt-1">
                {result.isInline ? "No HTTP request!" : `${result.loadTime.toFixed(1)}ms`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        🎯 This demo proves Phase 1A eliminates N+1 cascade for small assets
      </div>
    </div>
  );
}