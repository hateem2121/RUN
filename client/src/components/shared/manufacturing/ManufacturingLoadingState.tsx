// import React from "react";
import { motion } from "framer-motion";
import { Factory, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ManufacturingLoadingStateProps {
  variant?: "card" | "skeleton" | "spinner" | "grid";
  count?: number;
  message?: string;
  className?: string;
}

/**
 * Standardized loading states for manufacturing components
 * Provides consistent loading experiences across public and admin interfaces
 */
export function ManufacturingLoadingState({
  variant = "skeleton",
  count = 3,
  message = "Loading manufacturing data...",
  className = "",
}: ManufacturingLoadingStateProps) {
  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Factory className="h-6 w-6 text-blue-600" />
            </motion.div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted/20" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (variant === "spinner") {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="h-8 w-8 text-blue-600" />
        </motion.div>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-4"
          >
            <div className="h-32 animate-pulse rounded-lg bg-muted/20" />
            <div className="space-y-2">
              <div className="h-4 animate-pulse rounded bg-muted/20" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Default: skeleton variant
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded bg-muted/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted/20" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded bg-muted/20 px-3 py-1" />
                <div className="h-6 w-16 animate-pulse rounded bg-muted/20 px-3 py-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Compact loading skeleton for inline use
 */
export function ManufacturingInlineLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-4 w-4 text-blue-600" />
      </motion.div>
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  );
}
