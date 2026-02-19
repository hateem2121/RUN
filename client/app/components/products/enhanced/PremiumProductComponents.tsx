/**
 * Premium Product Detail Components
 * Clipped geometric elements, enhanced galleries, and premium UI components
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Boxes,
  ChevronDown,
  FileText,
  Heart,
  Info,
  Leaf,
  Package,
  Play,
  Shield,
} from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import type { MediaAsset } from "@/schemas/product";
import type { FabricDisplayProps, SizeChartDisplayProps, TabbedDetailsProps } from "./types";

// ============================================================================
// ClippedElement - Geometric Angular Cut Component
// ============================================================================

interface ClippedElementProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string | undefined;
  clipAmount?: number | undefined;
  style?: React.CSSProperties;
  [x: string]: unknown;
}

export const ClippedElement: React.FC<ClippedElementProps> = ({
  as: Tag = "div",
  children,
  className = "",
  clipAmount = 20,
  style = {},
  ...props
}) => {
  const clipPathStyle = {
    clipPath: `polygon(0 0, 100% 0, calc(100% - ${clipAmount}px) 100%, 0 100%)`,
  };
  const finalStyle = { ...style, ...clipPathStyle };
  const Element = Tag as React.ElementType;

  return (
    <Element className={className} style={finalStyle} {...props}>
      {children}
    </Element>
  );
};

// ============================================================================
// Enhanced Product Gallery with Thumbnails
// ============================================================================

export const MediaType = {
  Image: "image",
  Video: "video",
  Model3D: "3d_model",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

/**
 * Normalizes media type strings from various backend formats into MediaType enum
 * Handles variants like 'model', '3d_model', '3d-model', etc.
 */
export function normalizeMediaType(type: string | undefined | null): MediaType {
  if (!type) {
    return MediaType.Image;
  }

  const normalizedType = type.toLowerCase().trim();

  // Video types
  if (normalizedType === "video") {
    return MediaType.Video;
  }

  // 3D model types - handle all variants
  if (
    normalizedType === "model" ||
    normalizedType === "3d_model" ||
    normalizedType === "3d-model" ||
    normalizedType === "3dmodel"
  ) {
    return MediaType.Model3D;
  }

  // Default to image for unknown types or explicit 'image'
  return MediaType.Image;
}

export interface MediaItem {
  id: number;
  type: MediaType;
  src: string;
  thumbnail: string;
  filename?: string | undefined;
  mimeType?: string | undefined;
}

interface Hotspot {
  id: string;
  position: string;
  normal: string;
  text: string;
}

export interface ProductGalleryHandle {
  switchTo3DView: () => void;
}

interface ProductGalleryProps {
  media: MediaItem[];
  hotspots?: Hotspot[];
}

export const ProductGallery = ({
  media,
  ref,
}: ProductGalleryProps & { ref?: React.Ref<ProductGalleryHandle> }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    switchTo3DView: () => {
      const model3DIndex = media.findIndex((item) => item.type === MediaType.Model3D);
      if (model3DIndex !== -1) {
        setActiveIndex(model3DIndex);
      }
    },
  }));

  // Reset loading state when active media changes
  useEffect(() => {
    setImageLoaded(false);
  }, []);

  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  const renderMedia = () => {
    const item = media[activeIndex];
    if (!item) {
      return null;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={item.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          {(() => {
            switch (item.type) {
              case MediaType.Image:
                return (
                  <>
                    <img
                      src={item.src}
                      alt="Product"
                      loading={activeIndex === 0 ? "eager" : "lazy"}
                      {...(activeIndex === 0 && {
                        fetchPriority: "high" as const,
                      })}
                      className={`h-full w-full object-contain transition-opacity duration-300 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="center-flex absolute inset-0 bg-black">
                        <div className="border-border h-12 w-12 animate-spin rounded-full border-2 border-t-2 border-t-white"></div>
                      </div>
                    )}
                  </>
                );
              case MediaType.Video:
                return (
                  <video
                    controls
                    autoPlay
                    loop
                    muted
                    className="h-full w-full object-contain"
                    onError={(_e) => {}}
                  >
                    <source src={item.src} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                );
              case MediaType.Model3D:
                return (
                  <div className="h-full w-full">
                    <LazyUnifiedModelViewer
                      asset={
                        {
                          id: item.id,
                          url: item.src,
                          type: "3d_model",
                          filename: item.filename || "product-model.glb",
                          mimeType: item.mimeType || "model/gltf-binary",
                          storagePath: item.src,
                          bucketName: "default",
                          originalName: "product-model.glb",
                          fileSize: null,
                          thumbnailUrl: null,
                          thumbnailFilename: null,
                          width: null,
                          height: null,
                          caption: null,
                          altText: "Product 3D Model",
                          blurhash: null,
                          processing: false,
                          processingProgress: null,
                          processingError: null,
                          metadata: {},
                          tags: null,
                          isPublic: true,
                          isActive: true,
                          folderId: null,
                          downloadCount: 0,
                          lastAccessedAt: null,
                          deletedAt: null,
                          uploadedAt: null,
                          updatedAt: null,
                          createdAt: null,
                        } as unknown as MediaAsset
                      }
                      config={{
                        loading: "eager",
                      }}
                      className="h-full w-full"
                      showControls={true}
                      showLoadingProgress={true}
                    />
                  </div>
                );
              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="flex w-full justify-center p-3 sm:p-5 md:p-7 lg:p-9">
      <div className="w-full max-w-3xl">
        <div className="product-gallery-container relative aspect-square w-full overflow-hidden rounded-lg bg-black sm:aspect-4/3 lg:aspect-video">
          <div className="absolute inset-0 bg-black">{renderMedia()}</div>
        </div>
        <motion.div
          className="thumbnail-scrollbar mt-3 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto p-2 sm:mt-4 sm:gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          {media.map((item, index) => (
            <ThumbnailButton
              key={index}
              item={item}
              index={index}
              isActive={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              ref={(el) => {
                thumbnailRefs.current[index] = el;
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// Thumbnail Button Component with Media Type Indicators
// ============================================================================

interface ThumbnailButtonProps {
  item: MediaItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const ThumbnailButton = ({
  item,
  index,
  isActive,
  onClick,
  ref,
}: ThumbnailButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if thumbnail URL is missing or invalid
  const hasThumbnail = item.thumbnail && item.thumbnail.trim() !== "";

  // Determine if we should show a fallback (only when thumbnail is missing or failed to load)
  const shouldShowFallback = !hasThumbnail || thumbnailError;

  // Get fallback icon and background color based on media type
  const getFallbackContent = () => {
    switch (item.type) {
      case MediaType.Video:
        return {
          icon: <Play className="h-6 w-6 text-white" fill="white" />,
          bgColor: "bg-linear-to-br from-purple-500 to-pink-500",
          label: "Video",
        };
      case MediaType.Model3D:
        return {
          icon: <Boxes className="h-6 w-6 text-white" />,
          bgColor: "bg-linear-to-br from-blue-500 to-cyan-500",
          label: "3D Model",
        };
      default:
        return {
          icon: <Box className="h-6 w-6 text-white" />,
          bgColor: "bg-linear-to-br from-muted-foreground to-muted-foreground",
          label: "Media",
        };
    }
  };

  const fallbackContent = getFallbackContent();

  // Get badge for media type indicator (small overlay on thumbnail)
  const getMediaTypeBadge = () => {
    if (item.type === MediaType.Image) {
      return null;
    }

    return (
      <div className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5">
        {item.type === MediaType.Video ? (
          <Play className="h-2.5 w-2.5 text-white" fill="white" />
        ) : (
          <Boxes className="h-2.5 w-2.5 text-white" />
        )}
      </div>
    );
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative h-14 min-h-11 w-14 min-w-11 shrink-0 transform touch-manipulation snap-center overflow-hidden rounded-md transition-all duration-300 ease-in-out sm:h-16 sm:w-16 ${
        isActive
          ? "scale-105 ring-2 ring-black ring-offset-2"
          : "opacity-60 hover:scale-105 hover:opacity-100 active:scale-95"
      }`}
      data-testid={`button-gallery-thumbnail-${index}`}
      aria-label={`View ${fallbackContent.label} ${index + 1}`}
    >
      {shouldShowFallback ? (
        // Fallback UI with icon (shown when no thumbnail or failed to load)
        <div
          className={`flex h-full w-full items-center justify-center ${fallbackContent.bgColor}`}
        >
          {fallbackContent.icon}
        </div>
      ) : (
        // Show the actual thumbnail image
        <>
          <img
            src={item.thumbnail}
            alt={`Thumbnail ${index + 1}`}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setThumbnailError(true)}
            data-testid={`img-thumbnail-${index}`}
          />
          {!imageLoaded && <div className="bg-muted/20 absolute inset-0 animate-pulse" />}
        </>
      )}
      {/* Media type badge overlay - always show for videos and 3D models when thumbnail loads successfully */}
      {!shouldShowFallback && getMediaTypeBadge()}
    </button>
  );
};

ThumbnailButton.displayName = "ThumbnailButton";

// ============================================================================
// Tabbed Product Details
// ============================================================================

type Tab = "specs" | "tech" | "care" | "info" | "certs";

export const TabbedDetails: React.FC<TabbedDetailsProps> = ({ product, certificates }) => {
  const [activeTab, setActiveTab] = useState<Tab>("specs");

  const renderTabContent = () => {
    switch (activeTab) {
      case "specs":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Package className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Product Specs</h3>
            </div>
            <ul className="text-muted-foreground space-y-2 pl-1 text-sm">
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec, i) => (
                  <li key={i} className="flex items-start" data-testid={`spec-item-${i}`}>
                    <span className="mt-1 mr-2">-</span>
                    <span className="flex-1">{spec}</span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    Product specifications are not currently available for this item.
                  </p>
                </li>
              )}
            </ul>
          </div>
        );
      case "tech":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Technical Specifications</h3>
            </div>
            {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 ? (
              <div className="space-y-3" data-testid="tech-specs-list">
                {Object.entries(product.technicalSpecs).map(([key, value], i) => (
                  <div key={i} className="flex items-start" data-testid={`tech-spec-${i}`}>
                    <div className="flex-1">
                      <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-foreground/80 text-sm font-medium">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-muted-foreground/70 text-sm italic">
                  Technical specifications are not currently available for this item.
                </p>
              </div>
            )}
          </div>
        );
      case "care":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Heart className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Care Instructions</h3>
            </div>
            <ul
              className="text-muted-foreground space-y-2 pl-1 text-sm"
              data-testid="care-instructions-list"
            >
              {product.careInstructions && product.careInstructions.length > 0 ? (
                product.careInstructions.map((instruction, i) => (
                  <li key={i} className="flex items-start" data-testid={`care-instruction-${i}`}>
                    <span className="mt-1 mr-2">•</span>
                    <span className="flex-1">{instruction}</span>
                  </li>
                ))
              ) : (
                <li className="list-none py-6 text-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    Care instructions are not currently available for this item.
                  </p>
                </li>
              )}
            </ul>
          </div>
        );
      case "info":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Info className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Key Info</h3>
            </div>
            <ul className="text-muted-foreground space-y-2 pl-1 text-sm">
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>
                <span className="flex-1">
                  <strong>MOQ:</strong>{" "}
                  {product.minimumOrderQuantity && product.minimumOrderQuantity > 0
                    ? `${product.minimumOrderQuantity} units`
                    : "Contact us for details"}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>
                <span className="flex-1">
                  <strong>Lead Time:</strong> {product.leadTime || "Contact us for details"}
                </span>
              </li>
              {product.customFit && (
                <li className="flex items-start">
                  <span className="mt-1 mr-2">-</span>
                  <span className="flex-1">
                    <strong>Fit:</strong> {product.customFit}
                  </span>
                </li>
              )}
              {product.customWeight && (
                <li className="flex items-start">
                  <span className="mt-1 mr-2">-</span>
                  <span className="flex-1">
                    <strong>Weight:</strong> {product.customWeight}
                  </span>
                </li>
              )}
            </ul>
          </div>
        );
      case "certs":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Shield className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Certifications</h3>
            </div>
            <div className="flex flex-col space-y-3">
              {certificates && certificates.length > 0 ? (
                certificates.map((cert, i) => (
                  <div key={i} className="bg-background flex items-center rounded p-3">
                    <Shield className="mr-3 h-5 w-5 shrink-0 text-green-600" />
                    <span className="text-foreground/80 text-sm font-medium">{cert.name}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    Certifications information is not currently available for this item.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const tabConfig = [
    { id: "specs", label: "Product Specs" },
    { id: "tech", label: "Technical Specs" },
    { id: "care", label: "Care Instructions" },
    { id: "info", label: "Key Info" },
    { id: "certs", label: "Certifications" },
  ];

  return (
    <div>
      <div className="spacing-subsection border-border relative border-b">
        <div
          className="scrollbar-hide flex snap-x snap-mandatory items-center space-x-2 overflow-x-auto pb-px sm:space-x-3 md:space-x-4"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
          }}
        >
          {tabConfig.map((tab) => (
            <ClippedElement
              key={tab.id}
              as="button"
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`min-h-tab tracking-premium md:tracking-premium-lg relative -mb-px px-4 py-3 text-sm font-bold whitespace-nowrap uppercase transition-all duration-300 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden sm:px-6 ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-muted-foreground/70 hover:scale-105 hover:text-black"
              }`}
              clipAmount={10}
              data-testid={`button-tab-${tab.id}`}
            >
              <span className="max-w-32 truncate sm:max-w-none">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.span
                  layoutId="active-tab-indicator"
                  className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-black sm:h-0.75 md:h-1"
                />
              )}
            </ClippedElement>
          ))}
        </div>
      </div>
      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      {product.tags && product.tags.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 font-bold tracking-wider uppercase">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-muted text-foreground rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Inline Size Chart Display
// ============================================================================

export const SizeChartDisplay: React.FC<SizeChartDisplayProps> = ({ sizeChart }) => {
  const sizes = sizeChart?.measurements ? Object.keys(sizeChart.measurements) : [];
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");

  if (!sizeChart || !sizeChart.measurements || sizes.length === 0) {
    return (
      <p className="text-muted-foreground">Size information is not available for this product.</p>
    );
  }

  const measurements = sizeChart.measurements[selectedSize];
  const measurementKeys = measurements ? Object.keys(measurements) : [];

  return (
    <div>
      <div className="border-border mb-8 flex flex-wrap items-center gap-2 border-b pb-3">
        {sizes.map((size) => (
          <ClippedElement
            key={size}
            as="button"
            onClick={() => setSelectedSize(size)}
            className={`min-h-tab tracking-premium md:tracking-premium-lg px-4 py-2.5 text-sm font-bold uppercase transition-all duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden sm:px-5 ${
              selectedSize === size
                ? "scale-105 bg-black text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/20 hover:scale-105"
            }`}
            clipAmount={8}
            aria-pressed={selectedSize === size}
            data-testid={`button-size-${size.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {size}
          </ClippedElement>
        ))}
      </div>
      {measurements && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSize}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-4 sm:gap-x-6 sm:gap-y-6 lg:gap-x-8"
          >
            {measurementKeys.map((key) => (
              <div key={key}>
                <span className="text-muted-foreground text-xs tracking-wider uppercase">
                  {key}
                </span>
                <p className="mt-1 text-base font-bold sm:text-lg">{measurements[key] || "N/A"}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ============================================================================
// Fabric Display Component
// ============================================================================

export const FabricDisplay: React.FC<FabricDisplayProps> = ({ fabric, fibers = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!fabric) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Material information is not available for this product.
        </p>
      </div>
    );
  }

  // Check if we have collapsible content
  const hasDescription = !!fabric.description;
  const hasPerformanceFeatures =
    fabric.properties?.performanceFeatures && fabric.properties.performanceFeatures.length > 0;
  const hasFiberComposition =
    fabric.properties?.compositions && fabric.properties.compositions.length > 0;
  const hasCollapsibleContent = hasDescription || hasPerformanceFeatures || hasFiberComposition;

  return (
    <div>
      {/* Always Visible: Fabric Name */}
      <h3 className="mb-4 text-xl font-bold sm:text-2xl" data-testid="text-fabric-name">
        {fabric.name}
      </h3>

      {/* Desktop: Always show description */}
      {hasDescription && (
        <p
          className="text-foreground/80 mb-8 hidden leading-relaxed whitespace-pre-line md:block"
          data-testid="text-fabric-description"
        >
          {fabric.description}
        </p>
      )}

      {/* Always Visible: Property Grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
        {fabric.weight && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-weight">
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Weight
            </div>
            <div className="font-semibold">{fabric.weight} GSM</div>
          </div>
        )}
        {fabric.fabricType && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-type">
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Fabric Type
            </div>
            <div className="font-semibold">{fabric.fabricType}</div>
          </div>
        )}
        {fabric.sport && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-sport">
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Sport Category
            </div>
            <div className="font-semibold">{fabric.sport}</div>
          </div>
        )}
        {fabric.seasonality && (
          <div
            className="border-l-4 border-black pl-4 sm:pl-6"
            data-testid="info-fabric-seasonality"
          >
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Seasonality
            </div>
            <div className="font-semibold">{fabric.seasonality}</div>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      {hasCollapsibleContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-border hover:bg-background mt-6 flex w-full items-center justify-center gap-2 border-t border-b py-3 text-sm font-bold tracking-wider text-black uppercase transition-colors md:hidden"
          data-testid="button-toggle-materials"
        >
          <span>{isExpanded ? "Show Less" : "Show More"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Desktop: Always show all content */}
      <div className="hidden md:block">
        {hasPerformanceFeatures && (
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-bold tracking-wider uppercase">
              Performance Features
            </h4>
            <ul className="space-y-2" data-testid="list-fabric-features">
              {fabric.properties?.performanceFeatures?.map((feature: string, index: number) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="mr-2 text-black">•</span>
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasFiberComposition && (
          <div className="border-border mt-10 border-t pt-8">
            <h4 className="mb-6 text-sm font-bold tracking-wider uppercase">Fiber Composition</h4>
            <FiberCompositionDisplay fabric={fabric} fibers={fibers} />
          </div>
        )}
      </div>

      {/* Mobile: Collapsible content with animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="pt-6">
              {hasDescription && (
                <p
                  className="text-foreground/80 mb-8 leading-relaxed whitespace-pre-line"
                  data-testid="text-fabric-description"
                >
                  {fabric.description}
                </p>
              )}

              {hasPerformanceFeatures && (
                <div className="mt-8">
                  <h4 className="mb-4 text-sm font-bold tracking-wider uppercase">
                    Performance Features
                  </h4>
                  <ul className="space-y-2" data-testid="list-fabric-features">
                    {fabric.properties?.performanceFeatures?.map(
                      (feature: string, index: number) => (
                        <li key={index} className="flex items-start text-sm">
                          <span className="mr-2 text-black">•</span>
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {hasFiberComposition && (
                <div className="border-border mt-10 border-t pt-8">
                  <h4 className="mb-6 text-sm font-bold tracking-wider uppercase">
                    Fiber Composition
                  </h4>
                  <FiberCompositionDisplay fabric={fabric} fibers={fibers} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Fiber Composition Display with Interactive Toggle
// ============================================================================

interface FiberCompositionDisplayProps {
  fabric: any;
  fibers?: any[];
}

interface Composition {
  name: string;
  isDefault: boolean;
  fibers: Array<{ fiberId: number; percentage: string }>;
}

export const FiberCompositionDisplay: React.FC<FiberCompositionDisplayProps> = ({
  fabric,
  fibers = [],
}) => {
  const compositions = (fabric?.properties?.compositions as Composition[]) || [];

  // Find default composition or use first one
  const defaultComposition = compositions.find((c) => c.isDefault) || compositions[0];
  const [selectedComposition, setSelectedComposition] = useState<string>(
    defaultComposition?.name || "",
  );

  if (compositions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Fiber composition information is not available for this fabric.
      </p>
    );
  }

  const activeComposition =
    compositions.find((c) => c.name === selectedComposition) || defaultComposition;
  const compositionFibers = activeComposition?.fibers || [];

  // Helper to get fiber details
  const getFiberDetails = (fiberId: number) => {
    return (
      fibers.find((f) => f.id === fiberId) || {
        name: "Unknown Fiber",
        type: "unknown",
      }
    );
  };

  // Helper to get fiber icon based on type
  const getFiberIcon = (fiberType: string) => {
    const type = fiberType.toLowerCase();
    if (type.includes("cotton") || type.includes("natural")) {
      return <Leaf className="h-6 w-6 text-green-600" />;
    } else if (type.includes("polyester") || type.includes("synthetic")) {
      return <Package className="h-6 w-6 text-blue-600" />;
    } else if (type.includes("recycled")) {
      return <Shield className="h-6 w-6 text-emerald-600" />;
    }
    return <FileText className="text-muted-foreground h-6 w-6" />;
  };

  return (
    <div>
      {compositions.length > 1 && (
        <div className="border-border mb-8 flex flex-wrap items-center gap-2 border-b pb-3">
          {compositions.map((comp) => (
            <button
              key={comp.name}
              onClick={() => setSelectedComposition(comp.name)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedComposition === comp.name || (!selectedComposition && comp.isDefault)
                  ? "bg-black text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/30"
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>
      )}

      {/* Fiber Breakdown - Visual Cards */}
      {compositionFibers.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedComposition}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {compositionFibers.map((fiber, index: number) => {
              const fiberDetails = getFiberDetails(fiber.fiberId);
              return (
                <div
                  key={index}
                  className="border-border transition-shadow-sm rounded-lg border p-4 duration-200 hover:shadow-md"
                  data-testid={`fiber-card-${index}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFiberIcon(fiberDetails.type)}
                      <h4 className="text-sm font-bold tracking-wider uppercase">
                        {fiberDetails.name}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-black">{fiber.percentage}%</span>
                    <span className="text-muted-foreground text-xs tracking-wider uppercase">
                      {fiberDetails.type}
                    </span>
                  </div>
                  {/* Visual percentage bar */}
                  <div className="bg-muted/20 mt-3 h-2 w-full overflow-hidden rounded-full">
                    <motion.div
                      className="h-full rounded-full bg-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${fiber.percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Fallback: Minimalist Table for Simple Display */}
      {compositionFibers.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <p>No fiber composition data available for this selection.</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Ethical Manufacturing Section
// ============================================================================

export const EthicalManufacturing: React.FC = () => {
  const highlights = [
    {
      icon: <Shield className="h-8 w-8 text-black" />,
      title: "SMETA 4-PILLAR AUDIT",
      description:
        "Our facility is SMETA 4-Pillar audited, ensuring the highest standards of ethical trade, labor, health, safety, and environmental practices. We guarantee zero child labor and fair wages.",
    },
    {
      icon: <Leaf className="h-8 w-8 text-black" />,
      title: "SUSTAINABLE SOURCING",
      description:
        "We partner with a network of certified suppliers for materials that meet GOTS, OEKO-TEX, and Recycled Claim Standard (RCS), ensuring a responsible and sustainable supply chain.",
    },
    {
      icon: <Box className="h-8 w-8 text-black" />,
      title: "INNOVATION & TECHNOLOGY",
      description:
        "Leveraging cutting-edge 3D design technology like CLO 3D and Optitex, we reduce sampling time by up to 40% and minimize material waste, offering you faster, more sustainable development cycles.",
    },
  ];

  return (
    <section className="subtle-noise-bg py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-black-display mb-4 text-3xl md:text-4xl">
            ETHICAL MANUFACTURING & INNOVATION
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl">
            We merge a 135-year legacy with modern technology and an unwavering commitment to
            transparency and ethical production.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white p-8 text-center"
            >
              <div className="mb-4 flex justify-center">{item.icon}</div>
              <h3 className="mb-3 font-bold tracking-wider uppercase">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
