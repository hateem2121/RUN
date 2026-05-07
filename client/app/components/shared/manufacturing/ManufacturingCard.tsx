import type React from "react";
import { useEffect, useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gsap } from "@/lib/gsap";

interface ManufacturingCardProps {
  children: React.ReactNode;
  title?: string | undefined;
  subtitle?: string | undefined;
  index?: number | undefined;
  variant?: "public" | "admin";
  enableAnimations?: boolean | undefined;
  hoverEffects?: boolean | undefined;
  className?: string | undefined;
  headerContent?: React.ReactNode;
}

/**
 * Standardized manufacturing card component used across public and admin interfaces
 * Provides consistent styling, animations, and behavior patterns
 */
export function ManufacturingCard({
  children,
  title,
  subtitle,
  index = 0,
  variant = "public",
  enableAnimations = true,
  hoverEffects = true,
  className = "",
  headerContent,
}: ManufacturingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableAnimations || !cardRef.current) {
      return;
    }

    if (variant === "public") {
      // Public variant: scroll-triggered animations
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: index % 2 === 0 ? 30 : -30,
          rotateX: -10,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          delay: index * 0.1,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse",
          },
        },
      );
    } else {
      // Admin variant: simple fade-in
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: index * 0.05,
        },
      );
    }
  }, [index, variant, enableAnimations]);

  const cardContent = (
    <Card
      ref={cardRef}
      className={` ${variant === "public" ? "border-blue-200 bg-linear-to-br from-white to-blue-50" : ""} ${className} `}
    >
      {(title || subtitle || headerContent) && (
        <CardHeader>
          {title && <CardTitle className="text-foreground">{title}</CardTitle>}
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
          {headerContent}
        </CardHeader>
      )}
      <CardContent className="relative">{children}</CardContent>
    </Card>
  );

  if (variant === "public" && hoverEffects) {
    return (
      <ManufacturingErrorBoundary>
        <div style={{ transformStyle: "preserve-3d" }} className="manufacturing-card-hover-scale">
          {cardContent}
        </div>
      </ManufacturingErrorBoundary>
    );
  }

  return <ManufacturingErrorBoundary>{cardContent}</ManufacturingErrorBoundary>;
}
