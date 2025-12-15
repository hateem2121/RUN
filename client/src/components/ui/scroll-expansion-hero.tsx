import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
  useCallback,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { MediaUrlBuilder } from "@/lib/media-url-builder";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
  // New overlay content props
  headline?: string;
  subheadline?: string;
  statistics?: Array<{
    label: string;
    value: string;
    unit?: string;
    icon: string;
  }>;
}

// Throttle utility for performance optimization (high-resolution timing)
const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number,
): ((...args: Parameters<F>) => ReturnType<F> | void) => {
  let lastCall = 0;
  return function (this: any, ...args: Parameters<F>): ReturnType<F> | void {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  textBlend,
  children,
  headline,
  subheadline,
  statistics = [],
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Use refs to avoid event listener re-registration
  const scrollProgressRef = useRef<number>(0);
  const mediaFullyExpandedRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number>(0);

  // Throttled state update for better performance
  const throttledSetProgress = useCallback(
    throttle((newProgress: number) => {
      setScrollProgress(newProgress);
      scrollProgressRef.current = newProgress;
    }, 16), // ~60fps max
    [],
  );

  // Update refs when state changes
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    mediaFullyExpandedRef.current = mediaFullyExpanded;
  }, [mediaFullyExpanded]);

  useEffect(() => {
    touchStartYRef.current = touchStartY;
  }, [touchStartY]);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: Event) => {
      const wheelEvent = e as unknown as WheelEvent;
      if (mediaFullyExpandedRef.current && wheelEvent.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpandedRef.current) {
        e.preventDefault();
        // Optimized scroll delta for smoother progression
        const scrollDelta = wheelEvent.deltaY * 0.002;
        const newProgress = Math.min(Math.max(scrollProgressRef.current + scrollDelta, 0), 1);
        throttledSetProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as unknown as TouchEvent;
      if (touchEvent.touches && touchEvent.touches[0]) {
        setTouchStartY(touchEvent.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as unknown as TouchEvent;
      if (!touchStartYRef.current || !touchEvent.touches || !touchEvent.touches[0]) return;

      const touchY = touchEvent.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      if (mediaFullyExpandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpandedRef.current) {
        e.preventDefault();
        // Optimized sensitivity for mobile
        const scrollFactor = deltaY < 0 ? 0.006 : 0.004;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(Math.max(scrollProgressRef.current + scrollDelta, 0), 1);
        throttledSetProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpandedRef.current) {
        window.scrollTo(0, 0);
      }
    };

    // Add listeners with proper performance optimizations
    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // Empty dependency array prevents re-registration

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Memoized calculations for better performance
  const mediaStyle = useMemo(
    () => ({
      width: `${300 + scrollProgress * (isMobileState ? 650 : 1250)}px`,
      height: `${400 + scrollProgress * (isMobileState ? 200 : 400)}px`,
      maxWidth: "95vw",
      maxHeight: "85vh",
      boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
      transform: "translate3d(-50%, -50%, 0)", // Hardware acceleration
      willChange: "transform, width, height", // Optimize for animation
    }),
    [scrollProgress, isMobileState],
  );

  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  // Split title into specific sentences for natural reading
  const titleLines = useMemo(() => {
    if (!title) return [];

    // Remove em dashes and clean up the title
    const cleanTitle = title
      .replace(/\s*—\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Define specific sentences that should stay together
    const sentences = [
      "A Legacy of Craftsmanship, A Future of Sustainability",
      "RUN APPAREL (PVT) LTD",
      "A Subsidiary of DURUS INDUSTRIES (PVT) LTD",
    ];

    // Check if title contains these specific sentences and split accordingly
    const foundSentences: string[] = [];
    let remainingText = cleanTitle;

    sentences.forEach((sentence) => {
      if (remainingText.includes(sentence)) {
        foundSentences.push(sentence);
        remainingText = remainingText.replace(sentence, "").trim();
      }
    });

    // Add any remaining text as separate lines
    if (remainingText) {
      foundSentences.push(remainingText);
    }

    // If no specific sentences found, fall back to simple splitting
    if (foundSentences.length === 0) {
      const words = cleanTitle.split(" ");
      if (words.length <= 3) {
        return [cleanTitle];
      } else {
        const midPoint = Math.ceil(words.length / 2);
        return [words.slice(0, midPoint).join(" "), words.slice(midPoint).join(" ")];
      }
    }

    return foundSentences;
  }, [title]);

  // Animation directions for each line (different directions for each sentence)
  const getLineTransform = useCallback(
    (lineIndex: number) => {
      const baseTranslate = textTranslateX;

      switch (lineIndex) {
        case 0:
          return `translate3d(-${baseTranslate}vw, 0, 0)`; // First sentence moves left
        case 1:
          return `translate3d(${baseTranslate}vw, 0, 0)`; // Second sentence moves right
        case 2:
          return `translate3d(0, -${baseTranslate * 0.3}vw, 0)`; // Third sentence moves up
        default:
          return `translate3d(0, 0, 0)`; // No movement for additional lines
      }
    },
    [textTranslateX],
  );

  return (
    <div ref={sectionRef} className="transition-colors duration-700 ease-in-out overflow-x-hidden">
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          <motion.div
            className="absolute inset-0 z-0 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <OptimizedImage
              mediaId={MediaUrlBuilder.extractAssetId(bgImageSrc) || 0}
              alt="Background"
              className="w-screen h-screen object-cover"
              priority={true}
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              <div
                className="absolute z-0 top-1/2 left-1/2 transition-none rounded-2xl"
                style={mediaStyle}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="relative w-full h-full pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes("embed")
                            ? mediaSrc +
                              (mediaSrc.includes("?") ? "&" : "?") +
                              "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                            : mediaSrc.replace("watch?v=", "embed/") +
                              "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                              mediaSrc.split("v=")[1]
                        }
                        className="w-full h-full rounded-xl border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: "none" }}
                      ></div>

                      <div className="absolute inset-0 bg-black/40 rounded-xl" />
                    </div>
                  ) : (
                    <div className="relative w-full h-full pointer-events-none">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover rounded-xl"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: "none" }}
                      ></div>

                      <div className="absolute inset-0 bg-black/40 rounded-xl" />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-full">
                    <OptimizedImage
                      mediaId={MediaUrlBuilder.extractAssetId(mediaSrc) || 0}
                      alt={title || "Media content"}
                      className="w-full h-full object-cover rounded-xl"
                      quality={90}
                    />

                    <div className="absolute inset-0 bg-black/50 rounded-xl" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center relative z-10 mt-4">
                  {date && (
                    <p
                      className="text-2xl text-blue-200"
                      style={{
                        transform: `translate3d(-${textTranslateX}vw, 0, 0)`,
                        willChange: "transform",
                      }}
                    >
                      {date}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                {/* Display headline and subheadline if provided, otherwise fall back to title */}
                {headline ? (
                  <div className="space-y-4">
                    <motion.h1
                      className="text-4xl md:text-5xl lg:text-6xl transition-none text-white font-bold"
                      style={{
                        transform: `translate3d(-${textTranslateX * 0.5}vw, 0, 0)`,
                        willChange: "transform",
                      }}
                    >
                      {headline}
                    </motion.h1>
                    {subheadline && (
                      <motion.p
                        className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
                        style={{
                          transform: `translate3d(${textTranslateX * 0.3}vw, 0, 0)`,
                          willChange: "transform",
                        }}
                      >
                        {subheadline}
                      </motion.p>
                    )}
                    {/* Statistics display */}
                    {statistics && statistics.length > 0 && (
                      <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto"
                        style={{
                          transform: `translate3d(0, ${textTranslateX * 0.2}vw, 0)`,
                          willChange: "transform",
                        }}
                      >
                        {statistics.map((stat, index) => (
                          <div key={index} className="bg-white/10 rounded-lg p-4">
                            <div className="text-2xl md:text-3xl font-bold text-white">
                              {stat.value}
                              {stat.unit && <span className="text-sm ml-1">{stat.unit}</span>}
                            </div>
                            <div className="text-sm text-white/80 mt-1">{stat.label}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // Fallback to original title display
                  titleLines.map((line, index) => (
                    <motion.h2
                      key={index}
                      className="text-4xl md:text-5xl lg:text-6xl transition-none text-[#ffffff] font-semibold pl-[0px] pr-[0px] pt-[5px] pb-[5px]"
                      style={{
                        transform: getLineTransform(index),
                        willChange: "transform",
                      }}
                    >
                      {line}
                    </motion.h2>
                  ))
                )}
              </div>
            </div>

            <motion.section
              className="flex flex-col w-full px-8 py-10 md:px-16 lg:py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.8 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export { ScrollExpandMedia };
