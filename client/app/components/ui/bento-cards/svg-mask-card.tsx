import { memo, useEffect, useState } from "react";

// import { motion } from "framer-motion";
// import { EnhancedBentoCardErrorBoundary } from "./enhanced-error-boundary";
// import { LoadingState } from "./enhanced-loading-states";
// import { AnimatedCardWrapper, ImageLoadAnimation } from "./enhanced-animations";

interface SvgMaskCardProps {
  title: string;
  description: string;
  // Enhanced dual media props
  maskSvgUrl?: string | null | undefined; // Custom SVG mask file
  contentMediaUrl?: string | null | undefined; // Content media (video/image)
  // Legacy support
  mediaUrl?: string | null | undefined; // Backward compatibility
  link?: string | undefined;
}

const SvgMaskCard = memo(function SvgMaskCard({
  title,
  // description,
  maskSvgUrl,
  contentMediaUrl,
  mediaUrl,
  link,
}: SvgMaskCardProps) {
  const [hasError, setHasError] = useState(false);
  const [contentLoadError, setContentLoadError] = useState(false);
  const [isLoadingMask, setIsLoadingMask] = useState(false);
  // const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [contentType, setContentType] = useState<"image" | "video" | "unknown">("unknown");

  // Default SVG mask to prevent undefined errors
  const getDefaultSvgMask = () => {
    return "url('/assets/default-mask.svg')";
  };

  // Initialize svgMaskDataUri with default mask to prevent undefined errors
  const [svgMaskDataUri, setSvgMaskDataUri] = useState<string>(getDefaultSvgMask());

  // Determine actual content media URL (new field takes priority over legacy)
  const actualContentMediaUrl = contentMediaUrl || mediaUrl;

  // HTTP-driven content type detection
  useEffect(() => {
    if (!actualContentMediaUrl) {
      return;
    }

    fetch(actualContentMediaUrl, { method: "HEAD" })
      .then((r) => {
        const ct = r.headers.get("content-type");
        if (ct?.startsWith("video")) {
          setContentType("video");
        } else if (ct?.startsWith("image")) {
          setContentType("image");
        } else {
          setContentType("unknown");
        }
      })
      .catch(() => setContentType("unknown"));
  }, [actualContentMediaUrl]);

  // ENHANCED DUAL MEDIA SYSTEM: Parallel loading with intelligent caching
  useEffect(() => {
    const loadSvgMask = async () => {
      if (!maskSvgUrl) {
        setSvgMaskDataUri(getDefaultSvgMask());
        setIsLoadingMask(false);
        return;
      }

      setIsLoadingMask(true);
      setHasError(false);

      // Check cache first for faster performance
      const cacheKey = `svg-mask-${maskSvgUrl}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          // Check if cache is still valid (1 hour TTL)
          if (Date.now() - parsedCache.timestamp < parsedCache.ttl) {
            setSvgMaskDataUri(parsedCache.dataUri);
            setIsLoadingMask(false);
            return;
          }
        } catch {
          // Fallback to raw cached value
          setSvgMaskDataUri(cached);
          setIsLoadingMask(false);
          return;
        }
      }

      try {
        // Fetch with timeout and enhanced error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(maskSvgUrl, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "max-age=3600", // Cache for 1 hour
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status}`);
        }

        const svgText = await response.text();

        if (!svgText || svgText.trim() === "") {
          throw new Error("Empty SVG content");
        }

        // Create optimized data URI from SVG content with preserveAspectRatio
        const svgWithAspectRatio = svgText.replace(
          "<svg ",
          '<svg preserveAspectRatio="xMidYMid slice" ',
        );
        const encodedSvg = encodeURIComponent(svgWithAspectRatio);
        const dataUri = `url("data:image/svg+xml,${encodedSvg}")`;

        // Cache the processed data URI with expiration
        const cacheData = {
          dataUri,
          timestamp: Date.now(),
          ttl: 3600000, // 1 hour TTL
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

        setSvgMaskDataUri(dataUri);
        setIsLoadingMask(false);
      } catch (_error) {
        // Fallback to default mask
        const defaultMask = getDefaultSvgMask();
        setSvgMaskDataUri(defaultMask);
        // Cache the default mask for this URL to prevent repeated failures
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            dataUri: defaultMask,
            timestamp: Date.now(),
            ttl: 3600000,
          }),
        );
        setIsLoadingMask(false);
        // We don't setHasError(true) here because we have a default mask fallback
        // This prevents the entire card from showing an error overlay just because a mask failed to load
      }
    };

    loadSvgMask();
  }, [maskSvgUrl]);

  // PARALLEL CONTENT MEDIA PRELOADING for enhanced performance
  useEffect(() => {
    if (!actualContentMediaUrl) {
      return;
    }

    const preloadContentMedia = () => {
      try {
        if (contentType === "video") {
          // Preload video metadata with enhanced error handling
          const video = document.createElement("video");
          video.preload = "metadata";
          video.src = actualContentMediaUrl;
          video.onloadedmetadata = () => {};
          video.onerror = () => {
            setContentLoadError(true);
            // Don't spam the console with errors, just handle gracefully
          };
        } else if (contentType === "image") {
          // Preload image
          const img = new Image();
          img.onload = () => {};
          img.onerror = () => {
            setContentLoadError(true);
          };
          img.src = actualContentMediaUrl;
        }
      } catch (_error) {
        setContentLoadError(true);
      }
    };

    preloadContentMedia();
  }, [actualContentMediaUrl, contentType]);

  const handleContentError = () => {
    setContentLoadError(true);
  };

  // const handleGeneralError = () => {
  //   setHasError(true);
  // };

  // Show loading state while SVG mask is being processed
  if (isLoadingMask) {
    return (
      <section
        className="relative h-auto min-h-300 w-full max-h-600 bg-surface-subtle"
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center text-text-muted">
            <div className="text-sm">Loading mask...</div>
            <div className="mt-1 text-xs">
              {maskSvgUrl ? "Processing custom SVG" : "Using default mask"}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative flex h-auto min-h-300 w-full max-h-600 flex-col bg-(--bg) [mask-image:var(--mask-uri)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
      // biome-ignore lint/style/noInlineStyles: Dynamic masking logic
      style={{
        "--bg":
          hasError || contentLoadError
            ? "var(--color-surface-subtle)"
            : actualContentMediaUrl
              ? "transparent"
              : "transparent",
        "--mask-uri": svgMaskDataUri,
      } as React.CSSProperties}
      aria-label={`Masked media: ${title || "Category content"}`}
    >
      {/* Error state */}
      {(hasError || contentLoadError) && (
        <div className="flex h-full w-full items-center justify-center bg-surface-subtle">
          <div className="text-center text-text-muted">
            <div className="font-medium text-sm">
              {hasError ? "Media configuration error" : "Content not found"}
            </div>
            <div className="text-xs">{title}</div>
            {maskSvgUrl && contentMediaUrl && (
              <div className="mt-1 space-y-1 text-xs">
                <div>🎭 Mask: {maskSvgUrl ? "Custom SVG" : "Default"}</div>
                <div>🎬 Content: {contentLoadError ? "Failed" : "Loading"}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video content */}
      {!hasError &&
        !contentLoadError &&
        (contentType === "video" || contentType === "unknown") &&
        actualContentMediaUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-auto min-h-300 w-full max-h-600 object-cover"
            onError={handleContentError}
            // onLoadStart={() => setIsContentLoaded(true)}
            // onLoadedData={() => setIsContentLoaded(true)}
            // onPlaying={() => setIsContentLoaded(true)}
            // onPause={() => setIsContentLoaded(true)}
          >
            <source src={actualContentMediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

      {/* Image content */}
      {!hasError && !contentLoadError && contentType === "image" && actualContentMediaUrl && (
        <img
          src={actualContentMediaUrl}
          alt={title || "Category content"}
          className="h-auto min-h-300 w-full max-h-600 object-cover"
          onError={handleContentError}
        />
      )}

      {/* Fallback content when no media is available */}
      {!hasError && !contentLoadError && !actualContentMediaUrl && (
        <div className="flex h-full w-full items-center justify-center bg-surface-subtle">
          <div className="text-center text-text-muted">
            <div className="font-medium text-sm">No media content</div>
            <div className="text-xs">{title}</div>
            <div className="mt-1 text-xs">🎭 Mask: {maskSvgUrl ? "Custom SVG" : "Default"}</div>
          </div>
        </div>
      )}

      {/* Click handler */}
      {link && (
        <a
          href={link}
          className="absolute inset-0 z-elevated"
          aria-label={`View ${title}`}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = link;
          }}
        />
      )}
    </section>
  );
});

export default SvgMaskCard;
