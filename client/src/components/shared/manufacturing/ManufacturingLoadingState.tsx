// import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Factory, Loader2 } from "lucide-react";

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
  className = ""
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
              <Factory className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-48 animate-pulse" />
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
          <Loader2 className="w-8 h-8 text-blue-600" />
        </motion.div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-4"
          >
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
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
                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-4/6 animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded px-3 py-1 animate-pulse w-20" />
                <div className="h-6 bg-gray-200 rounded px-3 py-1 animate-pulse w-16" />
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
        <Loader2 className="w-4 h-4 text-blue-600" />
      </motion.div>
      <span className="text-sm text-gray-600">Loading...</span>
    </div>
  );
}