import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

gsap.registerPlugin(Draggable, InertiaPlugin);

export const DraggableCardBody = ({
  className,
  children,
}: {
  className?: string | undefined;
  children?: React.ReactNode;
}) => {
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window !== "undefined" && cardRef.current) {
        const section = cardRef.current.closest("section");
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          const cardRect = cardRef.current.getBoundingClientRect();

          const cardWidth = 320;
          const cardHeight = 384;
          const margin = 50;

          const sectionStyles = window.getComputedStyle(section);
          const paddingLeft = parseInt(sectionStyles.paddingLeft, 10) || 0;
          const paddingRight = parseInt(sectionStyles.paddingRight, 10) || 0;
          const paddingTop = parseInt(sectionStyles.paddingTop, 10) || 0;
          const paddingBottom = parseInt(sectionStyles.paddingBottom, 10) || 0;

          const contentWidth = sectionRect.width - paddingLeft - paddingRight;
          const contentHeight = sectionRect.height - paddingTop - paddingBottom;

          const cardRelativeX = cardRect.left - sectionRect.left - paddingLeft;
          const cardRelativeY = cardRect.top - sectionRect.top - paddingTop;

          const maxRightMovement = contentWidth - cardRelativeX - cardWidth + margin;
          const maxBottomMovement = contentHeight - cardRelativeY - cardHeight + margin;

          setConstraints({
            top: -(cardHeight - margin),
            left: -(cardWidth - margin),
            right: Math.max(0, maxRightMovement),
            bottom: Math.max(0, maxBottomMovement),
          });
        } else {
          setConstraints({
            top: -200,
            left: -200,
            right: window.innerWidth - 200,
            bottom: window.innerHeight - 200,
          });
        }
      }
    };

    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => {
      window.removeEventListener("resize", updateConstraints);
    };
  }, []);

  // GSAP tilt on mouse move (hover-only, not while dragging)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { width, height, left, top } = cardRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    const rotateY = (deltaX / 300) * 25;
    const rotateX = -(deltaY / 300) * 25;
    const opacityVal = 1 - (Math.abs(deltaX) / 300) * 0.2;
    const glareOpacityVal = (Math.abs(deltaX) / 300) * 0.2;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      opacity: opacityVal,
      duration: 0.3,
      ease: "power2.out",
      transformPerspective: 1000,
      transformStyle: "preserve-3d",
    });

    if (glareRef.current) {
      gsap.to(glareRef.current, {
        opacity: glareOpacityVal,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      opacity: 1,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
    if (glareRef.current) {
      gsap.to(glareRef.current, { opacity: 0, duration: 0.3 });
    }
  };

  useGSAP(
    () => {
      if (!cardRef.current) return;

      const draggable = Draggable.create(cardRef.current, {
        type: "x,y",
        inertia: true,
        bounds: {
          minX: constraints.left,
          maxX: constraints.right,
          minY: constraints.top,
          maxY: constraints.bottom,
        },
        onDragStart() {
          document.body.style.cursor = "grabbing";
        },
        onDrag() {
          const velocityX = this.getVelocity("x");
          gsap.to(cardRef.current, {
            rotateZ: Math.max(-15, Math.min(15, velocityX * 0.005)),
            duration: 0.1,
          });
        },
        onDragEnd() {
          document.body.style.cursor = "default";
          gsap.to(cardRef.current, {
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.4)",
          });
        },
      });

      return () => {
        draggable[0].kill();
      };
    },
    { scope: cardRef, dependencies: [constraints] },
  );

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "transform" }}
      className={cn(
        "group transform-3d relative min-h-96 w-80 overflow-hidden rounded-[20px] p-6",
        "bg-white/10 backdrop-blur-md dark:bg-white/5",
        "border border-border/60 dark:border-border/70",
        "shadow-glow-lg cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-linear-to-br from-white/10 via-transparent to-black/10" />

      {/* Inner glow */}
      <div className="card-border-overlay rounded-xl" />

      {/* Content */}
      <div className="relative z-elevated h-full">{children}</div>

      {/* Hover shimmer effect - disabled on mobile for performance */}
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="shimmer-overlay z-elevated" />
        </div>
      )}

      {/* Glare effect */}
      <div
        ref={glareRef}
        style={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 select-none bg-white/5"
      />
    </div>
  );
};

export const DraggableCardContainer = ({
  className,
  children,
}: {
  className?: string | undefined;
  children?: React.ReactNode;
}) => {
  return <div className={cn("perspective-deep", className)}>{children}</div>;
};
