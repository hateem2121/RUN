/**
 * Premium Product Detail Components
 * Clipped geometric elements, enhanced galleries, and premium UI components
 */

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Info,
  Shield,
  Box,
  Leaf,
  FileText,
  Heart,
  Play,
  Boxes,
  ChevronDown,
} from "lucide-react";
import type { Product } from "@shared/schema";
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";

// ============================================================================
// ClippedElement - Geometric Angular Cut Component
// ============================================================================

interface ClippedElementProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  clipAmount?: number;
  style?: React.CSSProperties;
  [x: string]: any;
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
  const Element = Tag as any;

  return (
    <Element className={className} style={finalStyle} {...props}>
      {children}
    </Element>
  );
};

// ============================================================================
// Enhanced Product Gallery with Thumbnails
// ============================================================================

export enum MediaType {
  Image = "image",
  Video = "video",
  Model3D = "3d_model",
}

/**
 * Normalizes media type strings from various backend formats into MediaType enum
 * Handles variants like 'model', '3d_model', '3d-model', etc.
 */
export function normalizeMediaType(type: string | undefined | null): MediaType {
  if (!type) return MediaType.Image;

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

interface MediaItem {
  id: number;
  type: MediaType;
  src: string;
  thumbnail: string;
  filename?: string;
  mimeType?: string;
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

export const ProductGallery = forwardRef<ProductGalleryHandle, ProductGalleryProps>(
  ({ media }, ref) => {
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
    }, [activeIndex]);

    useEffect(() => {
      thumbnailRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }, [activeIndex]);

    const renderMedia = () => {
      const item = media[activeIndex];
      if (!item) return null;

      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={item.src}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
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
                        className={`w-full h-full object-contain transition-opacity duration-300 ${
                          imageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImageLoaded(true)}
                      />
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="w-12 h-12 border-2 border-t-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
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
                      className="w-full h-full object-contain"
                      onError={(e) => console.error("Video load error:", e)}
                    >
                      <source src={item.src} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  );
                case MediaType.Model3D:
                  return (
                    <div className="w-full h-full">
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
                          } as any
                        }
                        config={{
                          loading: "eager",
                        }}
                        className="w-full h-full"
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
      <div className="w-full p-3 sm:p-5 md:p-7 lg:p-9 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="product-gallery-container relative h-[50vh] sm:h-[60vh] lg:h-[70vh] bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-black">{renderMedia()}</div>
          </div>
          <motion.div
            className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 p-2 overflow-x-auto thumbnail-scrollbar snap-x snap-mandatory"
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
  },
);

// ============================================================================
// Thumbnail Button Component with Media Type Indicators
// ============================================================================

interface ThumbnailButtonProps {
  item: MediaItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const ThumbnailButton = forwardRef<HTMLButtonElement, ThumbnailButtonProps>(
  ({ item, index, isActive, onClick }, ref) => {
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
            icon: <Play className="w-6 h-6 text-white" fill="white" />,
            bgColor: "bg-gradient-to-br from-purple-500 to-pink-500",
            label: "Video",
          };
        case MediaType.Model3D:
          return {
            icon: <Boxes className="w-6 h-6 text-white" />,
            bgColor: "bg-gradient-to-br from-blue-500 to-cyan-500",
            label: "3D Model",
          };
        default:
          return {
            icon: <Box className="w-6 h-6 text-white" />,
            bgColor: "bg-gradient-to-br from-gray-400 to-gray-600",
            label: "Media",
          };
      }
    };

    const fallbackContent = getFallbackContent();

    // Get badge for media type indicator (small overlay on thumbnail)
    const getMediaTypeBadge = () => {
      if (item.type === MediaType.Image) return null;

      return (
        <div className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5">
          {item.type === MediaType.Video ? (
            <Play className="w-2.5 h-2.5 text-white" fill="white" />
          ) : (
            <Boxes className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      );
    };

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 transition-all duration-300 ease-in-out transform rounded-md overflow-hidden snap-center touch-manipulation min-h-[44px] min-w-[44px] ${
          isActive
            ? "ring-2 ring-black ring-offset-2 scale-105"
            : "opacity-60 hover:opacity-100 hover:scale-105 active:scale-95"
        }`}
        data-testid={`button-gallery-thumbnail-${index}`}
        aria-label={`View ${fallbackContent.label} ${index + 1}`}
      >
        {shouldShowFallback ? (
          // Fallback UI with icon (shown when no thumbnail or failed to load)
          <div
            className={`w-full h-full flex items-center justify-center ${fallbackContent.bgColor}`}
          >
            {fallbackContent.icon}
          </div>
        ) : (
          // Show the actual thumbnail image
          <>
            <img
              src={item.thumbnail}
              alt={`Thumbnail ${index + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setThumbnailError(true)}
              data-testid={`img-thumbnail-${index}`}
            />
            {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
          </>
        )}
        {/* Media type badge overlay - always show for videos and 3D models when thumbnail loads successfully */}
        {!shouldShowFallback && getMediaTypeBadge()}
      </button>
    );
  },
);

ThumbnailButton.displayName = "ThumbnailButton";

// ============================================================================
// Tabbed Product Details
// ============================================================================

type Tab = "specs" | "tech" | "care" | "info" | "certs";

interface TabbedDetailsProps {
  product: Product & {
    specifications?: string[];
    technicalSpecs?: Record<string, any>;
    careInstructions?: string[];
    minimumOrderQuantity?: number;
    leadTime?: string | null;
    customFit?: string | null;
    customWeight?: string | null;
  };
  certificates: any[];
}

export const TabbedDetails: React.FC<TabbedDetailsProps> = ({ product, certificates }) => {
  const [activeTab, setActiveTab] = useState<Tab>("specs");

  const renderTabContent = () => {
    switch (activeTab) {
      case "specs":
        return (
          <div className="animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold uppercase tracking-wider">Product Specs</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 pl-1">
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec, i) => (
                  <li key={i} className="flex items-start" data-testid={`spec-item-${i}`}>
                    <span className="mr-2 mt-1">-</span>
                    <span className="flex-1">{spec}</span>
                  </li>
                ))
              ) : (
                <li className="text-center py-6">
                  <p className="text-gray-400 italic text-sm">
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
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold uppercase tracking-wider">Technical Specifications</h3>
            </div>
            {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 ? (
              <div className="space-y-3" data-testid="tech-specs-list">
                {Object.entries(product.technicalSpecs).map(([key, value], i) => (
                  <div key={i} className="flex items-start" data-testid={`tech-spec-${i}`}>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 italic text-sm">
                  Technical specifications are not currently available for this item.
                </p>
              </div>
            )}
          </div>
        );
      case "care":
        return (
          <div className="animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold uppercase tracking-wider">Care Instructions</h3>
            </div>
            <ul
              className="space-y-2 text-sm text-gray-600 pl-1"
              data-testid="care-instructions-list"
            >
              {product.careInstructions && product.careInstructions.length > 0 ? (
                product.careInstructions.map((instruction, i) => (
                  <li key={i} className="flex items-start" data-testid={`care-instruction-${i}`}>
                    <span className="mr-2 mt-1">•</span>
                    <span className="flex-1">{instruction}</span>
                  </li>
                ))
              ) : (
                <li className="text-center py-6 list-none">
                  <p className="text-gray-400 italic text-sm">
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
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold uppercase tracking-wider">Key Info</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 pl-1">
              <li className="flex items-start">
                <span className="mr-2 mt-1">-</span>
                <span className="flex-1">
                  <strong>MOQ:</strong>{" "}
                  {product.minimumOrderQuantity && product.minimumOrderQuantity > 0
                    ? `${product.minimumOrderQuantity} units`
                    : "Contact us for details"}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">-</span>
                <span className="flex-1">
                  <strong>Lead Time:</strong> {product.leadTime || "Contact us for details"}
                </span>
              </li>
              {product.customFit && (
                <li className="flex items-start">
                  <span className="mr-2 mt-1">-</span>
                  <span className="flex-1">
                    <strong>Fit:</strong> {product.customFit}
                  </span>
                </li>
              )}
              {product.customWeight && (
                <li className="flex items-start">
                  <span className="mr-2 mt-1">-</span>
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
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold uppercase tracking-wider">Certifications</h3>
            </div>
            <div className="flex flex-col space-y-3">
              {certificates && certificates.length > 0 ? (
                certificates.map((cert, i) => (
                  <div key={i} className="flex items-center bg-gray-50 p-3 rounded">
                    <Shield className="w-5 h-5 text-green-600 mr-3 shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{cert.name || cert}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 italic text-sm">
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
      <div className="relative border-b border-gray-200 spacing-subsection">
        <div
          className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-px"
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
              className={`min-h-[48px] px-4 sm:px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] md:tracking-[0.12em] transition-all duration-300 relative -mb-px whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-gray-400 hover:text-black hover:scale-105"
              }`}
              clipAmount={10}
              data-testid={`button-tab-${tab.id}`}
            >
              <span className="truncate max-w-[120px] sm:max-w-none">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.span
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-0.75 md:h-1 bg-black rounded-full"
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
          <h3 className="font-bold mb-4 uppercase tracking-wider">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
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

interface SizeChartDisplayProps {
  sizeChart: any;
}

export const SizeChartDisplay: React.FC<SizeChartDisplayProps> = ({ sizeChart }) => {
  if (!sizeChart || !sizeChart.measurements) {
    return <p className="text-gray-600">Size information is not available for this product.</p>;
  }

  const sizes = Object.keys(sizeChart.measurements);
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");

  if (sizes.length === 0) {
    return <p className="text-gray-600">Size information is not available for this product.</p>;
  }

  const measurements = sizeChart.measurements[selectedSize];
  const measurementKeys = measurements ? Object.keys(measurements) : [];

  return (
    <div>
      <div className="flex items-center flex-wrap gap-2 mb-8 pb-3 border-b border-gray-200">
        {sizes.map((size) => (
          <ClippedElement
            key={size}
            as="button"
            onClick={() => setSelectedSize(size)}
            className={`min-h-[48px] px-4 sm:px-5 py-2.5 text-sm font-bold uppercase tracking-[0.08em] md:tracking-[0.12em] transition-all duration-300 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
              selectedSize === size
                ? "bg-black text-white scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
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
            className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-4 sm:gap-y-6 text-sm"
          >
            {measurementKeys.map((key) => (
              <div key={key}>
                <span className="text-gray-500 uppercase text-xs tracking-wider">{key}</span>
                <p className="font-bold text-base sm:text-lg mt-1">{measurements[key] || "N/A"}</p>
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

interface FabricDisplayProps {
  fabric: any;
  fibers?: any[];
}

export const FabricDisplay: React.FC<FabricDisplayProps> = ({ fabric, fibers = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!fabric) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Material information is not available for this product.</p>
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
      <h3 className="text-xl sm:text-2xl font-bold mb-4" data-testid="text-fabric-name">
        {fabric.name}
      </h3>

      {/* Desktop: Always show description */}
      {hasDescription && (
        <p
          className="hidden md:block text-gray-700 leading-relaxed mb-8 whitespace-pre-line"
          data-testid="text-fabric-description"
        >
          {fabric.description}
        </p>
      )}

      {/* Always Visible: Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-8">
        {fabric.weight && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-weight">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Weight</div>
            <div className="font-semibold">{fabric.weight} GSM</div>
          </div>
        )}
        {fabric.fabricType && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-type">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Fabric Type</div>
            <div className="font-semibold">{fabric.fabricType}</div>
          </div>
        )}
        {fabric.sport && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-sport">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
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
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Seasonality</div>
            <div className="font-semibold">{fabric.seasonality}</div>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      {hasCollapsibleContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden flex items-center justify-center gap-2 w-full mt-6 py-3 text-sm font-bold uppercase tracking-wider text-black hover:bg-gray-50 transition-colors border-t border-b border-gray-200"
          data-testid="button-toggle-materials"
        >
          <span>{isExpanded ? "Show Less" : "Show More"}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Desktop: Always show all content */}
      <div className="hidden md:block">
        {hasPerformanceFeatures && (
          <div className="mt-8">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4">
              Performance Features
            </h4>
            <ul className="space-y-2" data-testid="list-fabric-features">
              {fabric.properties.performanceFeatures.map((feature: string, index: number) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-black mr-2">•</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasFiberComposition && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Fiber Composition</h4>
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
            className="md:hidden overflow-hidden"
          >
            <div className="pt-6">
              {hasDescription && (
                <p
                  className="text-gray-700 leading-relaxed mb-8 whitespace-pre-line"
                  data-testid="text-fabric-description"
                >
                  {fabric.description}
                </p>
              )}

              {hasPerformanceFeatures && (
                <div className="mt-8">
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-4">
                    Performance Features
                  </h4>
                  <ul className="space-y-2" data-testid="list-fabric-features">
                    {fabric.properties.performanceFeatures.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="text-black mr-2">•</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasFiberComposition && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-6">
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

export const FiberCompositionDisplay: React.FC<FiberCompositionDisplayProps> = ({
  fabric,
  fibers = [],
}) => {
  const compositions = fabric?.properties?.compositions || [];

  if (compositions.length === 0) {
    return (
      <p className="text-gray-600 text-sm">
        Fiber composition information is not available for this fabric.
      </p>
    );
  }

  // Find default composition or use first one
  const defaultComposition = compositions.find((c: any) => c.isDefault) || compositions[0];
  const [selectedComposition, setSelectedComposition] = useState<string>(
    defaultComposition?.name || "",
  );

  const currentComposition =
    compositions.find((c: any) => c.name === selectedComposition) || defaultComposition;
  const compositionFibers = currentComposition?.fibers || [];

  // Helper to get fiber details
  const getFiberDetails = (fiberId: number) => {
    return (
      fibers.find((f: any) => f.id === fiberId) || {
        name: "Unknown Fiber",
        type: "unknown",
      }
    );
  };

  // Helper to get fiber icon based on type
  const getFiberIcon = (fiberType: string) => {
    const type = fiberType.toLowerCase();
    if (type.includes("cotton") || type.includes("natural")) {
      return <Leaf className="w-6 h-6 text-green-600" />;
    } else if (type.includes("polyester") || type.includes("synthetic")) {
      return <Package className="w-6 h-6 text-blue-600" />;
    } else if (type.includes("recycled")) {
      return <Shield className="w-6 h-6 text-emerald-600" />;
    }
    return <FileText className="w-6 h-6 text-gray-600" />;
  };

  return (
    <div>
      {/* Composition Toggle Buttons */}
      {compositions.length > 1 && (
        <div className="flex items-center flex-wrap gap-2 mb-8 pb-3 border-b border-gray-200">
          {compositions.map((comp: any) => (
            <ClippedElement
              key={comp.name}
              as="button"
              onClick={() => setSelectedComposition(comp.name)}
              className={`min-h-[48px] px-4 sm:px-5 py-2.5 text-sm font-bold uppercase tracking-[0.08em] md:tracking-[0.12em] transition-all duration-300 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                selectedComposition === comp.name
                  ? "bg-black text-white scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
              }`}
              clipAmount={8}
              aria-pressed={selectedComposition === comp.name}
              data-testid={`button-composition-${comp.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {comp.name}
            </ClippedElement>
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {compositionFibers.map((fiber: any, index: number) => {
              const fiberDetails = getFiberDetails(fiber.fiberId);
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow-sm duration-200"
                  data-testid={`fiber-card-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFiberIcon(fiberDetails.type)}
                      <h4 className="font-bold text-sm uppercase tracking-wider">
                        {fiberDetails.name}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-black">{fiber.percentage}%</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {fiberDetails.type}
                    </span>
                  </div>
                  {/* Visual percentage bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-black rounded-full"
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
        <div className="text-center py-8 text-gray-500">
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
      icon: <Shield className="w-8 h-8 text-black" />,
      title: "SMETA 4-PILLAR AUDIT",
      description:
        "Our facility is SMETA 4-Pillar audited, ensuring the highest standards of ethical trade, labor, health, safety, and environmental practices. We guarantee zero child labor and fair wages.",
    },
    {
      icon: <Leaf className="w-8 h-8 text-black" />,
      title: "SUSTAINABLE SOURCING",
      description:
        "We partner with a network of certified suppliers for materials that meet GOTS, OEKO-TEX, and Recycled Claim Standard (RCS), ensuring a responsible and sustainable supply chain.",
    },
    {
      icon: <Box className="w-8 h-8 text-black" />,
      title: "INNOVATION & TECHNOLOGY",
      description:
        "Leveraging cutting-edge 3D design technology like CLO 3D and Optitex, we reduce sampling time by up to 40% and minimize material waste, offering you faster, more sustainable development cycles.",
    },
  ];

  return (
    <section className="subtle-noise-bg py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-black-display mb-4">
            ETHICAL MANUFACTURING & INNOVATION
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            We merge a 135-year legacy with modern technology and an unwavering commitment to
            transparency and ethical production.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white p-8 text-center"
            >
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="font-bold uppercase tracking-wider mb-3">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
