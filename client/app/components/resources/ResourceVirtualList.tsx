import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number | undefined;
  className?: string | undefined;
}

interface VirtualRowProps {
  children: ReactNode;
  height: number;
  animIndex: number;
}

function VirtualRow({ children, height, animIndex }: VirtualRowProps): React.ReactElement {
  const rowRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(rowRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        delay: animIndex * 0.02,
        ease: "power2.out",
      });
    },
    { scope: rowRef },
  );
  return (
    <div ref={rowRef} style={{ height }}>
      {children}
    </div>
  );
}

export function ResourceVirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 3,
  className = "",
}: VirtualListProps<T>): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollTop(scrollRef.current.scrollTop);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
    return undefined;
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <VirtualRow key={startIndex + index} height={itemHeight} animIndex={index}>
              {renderItem(item, startIndex + index)}
            </VirtualRow>
          ))}
        </div>
      </div>
    </div>
  );
}
