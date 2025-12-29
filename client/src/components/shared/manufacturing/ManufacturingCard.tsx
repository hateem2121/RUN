import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useEffect, useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/manufacturing-error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

interface ManufacturingCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  index?: number;
  variant?: "public" | "admin";
  enableAnimations?: boolean;
  hoverEffects?: boolean;
  className?: string;
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
    if (!enableAnimations || !cardRef.current) return;

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
        <motion.div
          whileHover={{
            scale: 1.02,
            rotateY: 2,
            transition: { type: "spring", stiffness: 300 },
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {cardContent}
        </motion.div>
      </ManufacturingErrorBoundary>
    );
  }

  return <ManufacturingErrorBoundary>{cardContent}</ManufacturingErrorBoundary>;
}
