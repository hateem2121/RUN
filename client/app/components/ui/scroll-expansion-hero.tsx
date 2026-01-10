import { motion } from "framer-motion";
import {
  type ReactNode,
  type TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { MediaUrlBuilder } from "@/lib/media-url-builder";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string | undefined;
  bgImageSrc: string;
  title?: string | undefined;
  date?: string | undefined;
  scrollToExpand?: string | undefined;
  textBlend?: boolean | undefined;
  children?: ReactNode;
  // New overlay content props
  headline?: string | undefined;
  subheadline?: string | undefined;
  statistics?: Array<{
    label: string;
    value: string;
    unit?: string | undefined;
    icon: string;
  }>;
}

// Throttle utility for performance optimization (high-resolution timing)
const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number,
): ((...args: Parameters<F>) => ReturnType<F> | undefined) => {
  let lastCall = 0;
  return function (this: any, ...args: Parameters<F>): ReturnType<F> | undefined {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return func.apply(this, args);
    }
    return undefined;
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
  }, []);

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
      if (touchEvent.touches?.[0]) {
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
  }, [throttledSetProgress]); // Empty dependency array prevents re-registration

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
    <div ref={sectionRef} className="overflow-x-hidden transition-colors duration-700 ease-in-out">
      <section className="relative flex min-h-screen flex-col items-center justify-start">
        <div className="relative flex min-h-screen w-full flex-col items-center">
          <motion.div
            className="absolute inset-0 z-base h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <OptimizedImage
              mediaId={MediaUrlBuilder.extractAssetId(bgImageSrc) || 0}
              alt="Background"
              className="h-screen w-screen object-cover"
              priority={true}
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          <div className="container relative z-elevated mx-auto flex flex-col items-center justify-start">
            <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
              <div
                className="absolute top-1/2 left-1/2 z-base rounded-2xl transition-none"
                style={mediaStyle}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="pointer-events-none relative h-full w-full">
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
                        className="h-full w-full rounded-xl border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div
                        className="absolute inset-0 z-elevated"
                        style={{ pointerEvents: "none" }}
                      ></div>

                      <div className="absolute inset-0 rounded-xl bg-black/40" />
                    </div>
                  ) : (
                    <div className="pointer-events-none relative h-full w-full">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="h-full w-full rounded-xl object-cover"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <div
                        className="absolute inset-0 z-elevated"
                        style={{ pointerEvents: "none" }}
                      ></div>

                      <div className="absolute inset-0 rounded-xl bg-black/40" />
                    </div>
                  )
                ) : (
                  <div className="relative h-full w-full">
                    <OptimizedImage
                      mediaId={MediaUrlBuilder.extractAssetId(mediaSrc) || 0}
                      alt={title || "Media content"}
                      className="h-full w-full rounded-xl object-cover"
                      quality={90}
                    />

                    <div className="absolute inset-0 rounded-xl bg-black/50" />
                  </div>
                )}

                <div className="relative z-elevated mt-4 flex flex-col items-center text-center">
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
                className={`relative z-elevated flex w-full flex-col items-center justify-center gap-4 text-center transition-none ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                {/* Display headline and subheadline if provided, otherwise fall back to title */}
                {headline ? (
                  <div className="space-y-4">
                    <motion.h1
                      className="font-bold text-4xl text-white transition-none md:text-5xl lg:text-6xl"
                      style={{
                        transform: `translate3d(-${textTranslateX * 0.5}vw, 0, 0)`,
                        willChange: "transform",
                      }}
                    >
                      {headline}
                    </motion.h1>
                    {subheadline && (
                      <motion.p
                        className="mx-auto max-w-3xl text-lg text-white/90 leading-relaxed md:text-xl lg:text-2xl"
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
                        className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
                        style={{
                          transform: `translate3d(0, ${textTranslateX * 0.2}vw, 0)`,
                          willChange: "transform",
                        }}
                      >
                        {statistics.map((stat, index) => (
                          <div key={index} className="rounded-lg bg-white/10 p-4">
                            <div className="font-bold text-2xl text-white md:text-3xl">
                              {stat.value}
                              {stat.unit && <span className="ml-1 text-sm">{stat.unit}</span>}
                            </div>
                            <div className="mt-1 text-sm text-white/80">{stat.label}</div>
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
                      className="px-0 py-1 font-semibold text-4xl text-white transition-none md:text-5xl lg:text-6xl"
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
              className="flex w-full flex-col px-8 py-10 md:px-16 lg:py-20"
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
