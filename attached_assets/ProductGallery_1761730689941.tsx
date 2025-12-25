import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { type Hotspot, type Media, MediaType } from "../types";
import { XIcon } from "./Icons";

// Define a more specific type for the model-viewer element
interface ModelViewerElement extends HTMLElement {
  model: any;
  cameraTarget: string;
  cameraOrbit: string;
}

export interface ProductGalleryHandle {
  switchTo3DView: () => void;
}

interface ProductGalleryProps {
  media: Media[];
  hotspots?: Hotspot[];
}

const ProductGallery = forwardRef<ProductGalleryHandle, ProductGalleryProps>(
  ({ media, hotspots }, ref) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeAnnotation, setActiveAnnotation] = useState<Hotspot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const modelViewerRef = useRef<ModelViewerElement>(null);
    const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      switchTo3DView: () => {
        const model3DIndex = media.findIndex((item) => item.type === MediaType.Model3D);
        if (model3DIndex !== -1) {
          setActiveIndex(model3DIndex);
        } else {
        }
      },
    }));

    useEffect(() => {
      const preloadAssets = async () => {
        const promises = media.map((item) => {
          return new Promise<void>((resolve, reject) => {
            if (item.type === MediaType.Image) {
              const img = new Image();
              img.src = item.src;
              img.onload = () => resolve();
              img.onerror = () => reject(`Failed to load image: ${item.src}`);
            } else if (item.type === MediaType.Video) {
              // Video preloading can be tricky; this is a basic approach
              const video = document.createElement("video");
              video.src = item.src;
              video.oncanplaythrough = () => resolve();
              video.onerror = () => reject(`Failed to load video: ${item.src}`);
            } else {
              // For 3D models, we rely on the component's own loading state/poster
              resolve();
            }
          });
        });

        try {
          await Promise.all(promises);
          // A small delay to prevent jarring flashes on fast connections
          setTimeout(() => setIsLoading(false), 300);
        } catch (_error) {
          // Still show the gallery even if some assets fail to load
          setIsLoading(false);
        }
      };

      preloadAssets();
    }, [media]);

    // Handle camera focus on hotspot selection
    useEffect(() => {
      const viewer = modelViewerRef.current;
      if (viewer) {
        if (activeAnnotation) {
          viewer.cameraTarget = activeAnnotation.position;
          viewer.cameraOrbit = "0deg 75deg 1.5m";
        }
      }
    }, [activeAnnotation]);

    // Scroll the active thumbnail into view
    useEffect(() => {
      thumbnailRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }, [activeIndex]);

    const handleHotspotClick = (hotspot: Hotspot) => {
      if (activeAnnotation && activeAnnotation.id === hotspot.id) {
        setActiveAnnotation(null); // Toggle off if same hotspot is clicked
      } else {
        setActiveAnnotation(hotspot);
      }
    };

    const renderMedia = () => {
      const item = media[activeIndex];
      switch (item.type) {
        case MediaType.Image:
          return <img src={item.src} alt="Product" className="h-full w-full object-cover" />;
        case MediaType.Video:
          return (
            <video controls autoPlay loop muted className="h-full w-full object-cover">
              <source src={item.src} type="video/mp4" />
            </video>
          );
        case MediaType.Model3D:
          return (
            <model-viewer
              ref={modelViewerRef}
              src={item.src}
              poster={item.thumbnail}
              alt="A 3D model of the product"
              auto-rotate
              camera-controls
              shadow-intensity="1"
              environment-image="neutral"
              className="h-full w-full"
            >
              {hotspots?.map((hotspot) => (
                <button
                  key={hotspot.id}
                  slot={`hotspot-${hotspot.id}`}
                  data-position={hotspot.position}
                  data-normal={hotspot.normal}
                  onClick={() => handleHotspotClick(hotspot)}
                  className="hotspot"
                ></button>
              ))}
            </model-viewer>
          );
        default:
          return null;
      }
    };

    return (
      <div className="w-full p-4 md:p-8 lg:w-full">
        <div className="subtle-noise-bg relative aspect-h-1 aspect-w-1 h-[65vh] sm:h-[75vh] lg:h-[85vh]">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="loader"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-white"
              >
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-300 border-t-2 border-t-black"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {renderMedia()}
          </motion.div>

          {!isLoading && activeAnnotation && (
            <div className="absolute top-4 right-4 z-20 max-w-xs transform animate-fade-in rounded-lg bg-white p-4 shadow-lg transition-all duration-300 ease-in-out">
              <p className="text-gray-800 text-sm">{activeAnnotation.text}</p>
              <button
                onClick={() => setActiveAnnotation(null)}
                className="absolute top-1 right-1 text-gray-500 hover:text-gray-800"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <motion.div
          className="thumbnail-scrollbar mt-4 flex items-center space-x-2 overflow-x-auto p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 20 : 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          {media.map((item, index) => (
            <button
              ref={(el) => (thumbnailRefs.current[index] = el)}
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 flex-shrink-0 transform transition-all duration-300 ease-in-out ${
                activeIndex === index
                  ? "ring-2 ring-black ring-offset-2"
                  : "opacity-60 hover:scale-105 hover:opacity-100"
              }`}
            >
              <img
                src={item.thumbnail}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </motion.div>
      </div>
    );
  },
);

export default ProductGallery;
