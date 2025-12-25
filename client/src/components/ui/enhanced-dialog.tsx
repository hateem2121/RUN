"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { useNestedModalFocus } from "@/hooks/use-nested-modal-focus";
import { useModalPositioning } from "@/hooks/useViewportAwarePositioning";
import { cn } from "@/lib/utils";

// Re-export the basic components that don't need enhancement
const EnhancedDialog = DialogPrimitive.Root;
const EnhancedDialogTrigger = DialogPrimitive.Trigger;
const EnhancedDialogPortal = DialogPrimitive.Portal;
const EnhancedDialogClose = DialogPrimitive.Close;

// Z-Index class mapping for proper Tailwind compilation with clear overlay/content separation
function getZIndexClass(nestingLevel: number, isOverlay: boolean = false): string {
  if (isOverlay) {
    // Overlays use dedicated overlay z-index tiers, always below their corresponding content
    switch (nestingLevel) {
      case 0:
        return "z-modal-backdrop"; // Base overlay: z-index 40
      case 1:
        return "z-modal-overlay-1"; // Level 1 overlay: z-index 52
      case 2:
        return "z-modal-overlay-2"; // Level 2 overlay: z-index 62
      case 3:
        return "z-modal-overlay-3"; // Level 3 overlay: z-index 72
      default:
        return "z-modal-overlay-3"; // Maximum overlay nesting
    }
  } else {
    // Content uses main modal z-index tiers, always above their corresponding overlay
    switch (nestingLevel) {
      case 0:
        return "z-modal"; // Base content: z-index 50
      case 1:
        return "z-modal-nested"; // Level 1 content: z-index 55
      case 2:
        return "z-modal-nested-2"; // Level 2 content: z-index 65
      case 3:
        return "z-modal-nested-3"; // Level 3 content: z-index 75
      default:
        return "z-modal-critical"; // Maximum content nesting: z-index 100
    }
  }
}

// Enhanced overlay with better nested modal support
const EnhancedDialogOverlay = ({
  className,
  nestingLevel = 0,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
  nestingLevel?: number;
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Overlay>>;
}) => {
  const baseOpacity = nestingLevel === 0 ? "bg-black/80" : "bg-black/60";

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "pointer-events-none fixed inset-0",
        getZIndexClass(nestingLevel, true),
        baseOpacity,
        "data-[state=closed]:animate-out data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "transition-all duration-300 ease-out",
        nestingLevel > 0 && "nested-modal-overlay",
        className,
      )}
      {...props}
    />
  );
};
EnhancedDialogOverlay.displayName = "EnhancedDialogOverlay";

// Enhanced content with focus management and accessibility
interface EnhancedDialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  nestingLevel?: number;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  shouldTrapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  description?: string;
  role?: string;
  contentType?: "default" | "media-library" | "form" | "fullscreen";
  preferredSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Content>>;
}

const EnhancedDialogContent = ({
  className,
  children,
  nestingLevel = 0,
  onOpenChange,
  isOpen = true,
  shouldTrapFocus = true,
  restoreFocus = true,
  autoFocus = true,
  description,
  role = "dialog",
  contentType = "default",
  preferredSize,
  ref,
  ...props
}: EnhancedDialogContentProps) => {
  // Generate unique IDs for accessibility - ALWAYS called
  const descriptionId = React.useId();
  const headingId = React.useId();

  // Stable ref for the onOpenChange callback to prevent infinite re-renders
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  // Memoize the onClose callback with stable dependencies - NO direct state updates
  const handleClose = React.useCallback(() => {
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      onOpenChangeRef.current?.(false);
    }, 0);
  }, []);

  // Focus management hook with memoized callback - ALWAYS called
  const { modalRef, contentRef, handleKeyDown } = useNestedModalFocus({
    isOpen,
    onClose: handleClose,
    nestingLevel,
    shouldTrapFocus,
    restoreFocus,
    autoFocus,
  });

  // Content-aware size mapping with enhanced media library support
  const sizeClassMap = React.useMemo(
    () => ({
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      "5xl": "max-w-5xl",
      full: "max-w-full",
    }),
    [],
  );

  // Intelligent content-aware sizing calculation
  const modalSizeAndLayout = React.useMemo(() => {
    // Define base modal size configuration
    const modalSize = {
      width: "max-w-lg",
      height: "auto",
      padding: "p-6",
      layout: "grid",
    };

    // 1. Prioritize explicit preferredSize if provided
    if (preferredSize) {
      const baseSize = sizeClassMap[preferredSize];

      // Enhanced sizing for media library contexts
      if (contentType === "media-library") {
        return {
          width: preferredSize === "full" ? "max-w-vw-95" : baseSize,
          height: preferredSize === "full" ? "h-[95vh]" : "h-[85vh]",
          padding: nestingLevel > 0 ? "p-4" : "p-6",
          layout: "flex flex-col overflow-hidden",
        };
      }

      // Enhanced sizing for fullscreen content
      if (contentType === "fullscreen") {
        return {
          width: "max-w-vw-95",
          height: "max-h-modal-lg",
          padding: "p-4",
          layout: "flex flex-col",
        };
      }

      return {
        width: baseSize || modalSize.width,
        height: "auto",
        padding: nestingLevel > 0 ? "p-4" : "p-6",
        layout: "grid",
      };
    }

    // 2. Content-type based intelligent defaults
    switch (contentType) {
      case "media-library":
        // Media library needs definite height for EnhancedDialogBody scroll container
        return {
          width: nestingLevel === 0 ? "max-w-6xl" : "max-w-vw-90",
          height: "h-[85vh]",
          padding: "p-4",
          layout: "flex flex-col overflow-hidden", // Prevent content overflow, let EnhancedDialogBody scroll
        };

      case "fullscreen":
        // Fullscreen contexts utilize most of the viewport
        return {
          width: "max-w-vw-95",
          height: "max-h-modal-lg",
          padding: "p-4",
          layout: "flex flex-col",
        };

      case "form":
        // Forms typically need medium to large width but not excessive height
        return {
          width: nestingLevel === 0 ? "max-w-2xl" : "max-w-xl",
          height: "max-h-modal-sm",
          padding: nestingLevel > 0 ? "p-4" : "p-6",
          layout: "flex flex-col",
        };

      default: {
        // 3. Fallback to enhanced nesting-based sizing
        const fallbackSizes = {
          0: { width: "max-w-lg", height: "auto" }, // Base modal
          1: { width: "max-w-4xl", height: "max-h-modal-sm" }, // Nested - assume might contain media
          2: { width: "max-w-2xl", height: "max-h-[75vh]" }, // Second-level nested
        };

        const fallback = fallbackSizes[nestingLevel as keyof typeof fallbackSizes] || {
          width: "max-w-xl",
          height: "max-h-viewport-70",
        };
        return {
          ...fallback,
          padding: nestingLevel > 0 ? "p-4" : "p-6",
          layout: "grid",
        };
      }
    }
  }, [contentType, preferredSize, nestingLevel, sizeClassMap]);

  // Enhanced viewport-aware positioning with optimization
  const { position, isReady, getDeviceOptimizedClasses } = useModalPositioning(
    isOpen,
    {
      minMargin: 16,
      maxContentWidth: modalSizeAndLayout.width === "max-w-full" ? 9999 : 1200,
      maxContentHeight: modalSizeAndLayout.height === "auto" ? 9999 : 800,
      preferredPosition: "center",
      nestingLevel,
      contentType,
    },
    [modalSizeAndLayout, contentType, isOpen],
  );

  // Optimized positioning styles with GPU acceleration
  const positionStyles = React.useMemo(() => {
    if (!position || !isReady) {
      // Fallback positioning for SSR or while calculating
      const fallbackOffset = nestingLevel * 20;
      return {
        transform: `translate(-50%, -50%) translate(${fallbackOffset}px, ${fallbackOffset}px) translateZ(0)`,
        maxWidth: "90vw",
        maxHeight: contentType === "media-library" ? "85vh" : "90vh", // Fixed height for media-library
      };
    }

    return {
      transform: position.transform,
      maxWidth: position.suggestedSize.width,
      // ARCHITECTURAL FIX: Remove maxHeight constraint for media-library to let h-[85vh] class work
      ...(contentType !== "media-library" && {
        maxHeight: position.suggestedSize.height,
      }),
      ...(position.isConstrainedByViewport &&
        ({
          "--modal-constrained": "1",
        } as React.CSSProperties)),
    };
  }, [position, isReady, nestingLevel, contentType]);

  // Device-optimized classes for enhanced styling
  const deviceClasses = React.useMemo(() => {
    if (!isReady) return [];
    return getDeviceOptimizedClasses();
  }, [isReady, getDeviceOptimizedClasses]);

  return (
    <EnhancedDialogPortal>
      <EnhancedDialogOverlay nestingLevel={nestingLevel} />
      <DialogPrimitive.Content
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
        style={positionStyles}
        className={cn(
          "fixed top-[50%] left-[50%] w-full translate-x-[-50%] translate-y-[-50%]",
          modalSizeAndLayout.layout,
          "gap-4 border bg-background shadow-lg duration-300",
          "data-[state=closed]:animate-out data-[state=open]:animate-in",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "sm:rounded-lg",
          "focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
          // Apply content-aware sizing
          modalSizeAndLayout.width,
          modalSizeAndLayout.height,
          modalSizeAndLayout.padding,
          // Z-index management with proper class mapping
          getZIndexClass(nestingLevel, false),
          // Visual depth indicators
          nestingLevel > 0 && "nested-modal-content shadow-2xl ring-2 ring-primary/20",
          // Enhanced shadow-sm for nested modals
          nestingLevel > 0 && "shadow-deep",
          // Modal depth classes for additional styling
          `modal-depth-${Math.min(nestingLevel, 3)}`,
          // Content type specific styling
          contentType === "media-library" && "media-library-modal",
          contentType === "fullscreen" && "fullscreen-modal",
          // Focus trap enhancement for nested modals
          nestingLevel > 0 && "enhanced-modal-focus-trap",
          // Enhanced scrolling for media library contexts
          contentType === "media-library" &&
            modalSizeAndLayout.layout === "flex flex-col" &&
            "flex min-h-0 flex-col",
          // Device-optimized classes for enhanced positioning
          ...deviceClasses,
          // Viewport constraint indicator
          position?.isConstrainedByViewport && "modal-viewport-constrained",
          // Performance optimization classes
          "backface-hidden transform-gpu",
          className,
        )}
        {...props}
      >
        {/* ARCHITECTURAL DISEASE ELIMINATED: No more React.Children introspection - explicit slot system */}
        <div ref={modalRef} className="contents">
          <div ref={contentRef} tabIndex={-1} className="contents">
            {children}

            {/* Hidden description for screen readers */}
            {description && (
              <div id={descriptionId} className="sr-only">
                {description}
              </div>
            )}

            {/* Enhanced close button with better accessibility */}
            <DialogPrimitive.Close
              className={cn(
                "absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background",
                "transition-all duration-200 hover:scale-110 hover:opacity-100",
                "focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:pointer-events-none",
                "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                // Enhanced styling for nested modals
                nestingLevel > 0 && "border bg-background/80",
              )}
              aria-label={`Close ${nestingLevel > 0 ? "nested " : ""}dialog`}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
        </div>
      </DialogPrimitive.Content>
    </EnhancedDialogPortal>
  );
};
EnhancedDialogContent.displayName = "EnhancedDialogContent";

// Enhanced header with automatic heading ID
const EnhancedDialogHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>
      {children}
    </div>
  );
};
EnhancedDialogHeader.displayName = "EnhancedDialogHeader";

// Enhanced body with dedicated scroll ownership - SURGICAL SOLUTION
const EnhancedDialogBody = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto", // SOLE SCROLL OWNERSHIP
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
EnhancedDialogBody.displayName = "EnhancedDialogBody";

// Enhanced footer with better spacing
const EnhancedDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      "border-border/50 border-t pt-4",
      className,
    )}
    {...props}
  />
);
EnhancedDialogFooter.displayName = "EnhancedDialogFooter";

// Enhanced title with automatic ID for accessibility
const EnhancedDialogTitle = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Title>>;
}) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-semibold text-lg leading-none tracking-tight",
      "text-foreground",
      className,
    )}
    {...props}
  />
);
EnhancedDialogTitle.displayName = "EnhancedDialogTitle";

// Enhanced description with better styling
const EnhancedDialogDescription = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Description>>;
}) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm leading-relaxed", className)}
    {...props}
  />
);
EnhancedDialogDescription.displayName = "EnhancedDialogDescription";

// Convenience component for nested modals
interface NestedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  nestingLevel?: number;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  className?: string;
  contentType?: "default" | "media-library" | "form" | "fullscreen";
}

export function NestedDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  nestingLevel = 1,
  size = "lg",
  className,
  contentType = "default",
}: NestedDialogProps) {
  return (
    <EnhancedDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <EnhancedDialogTrigger asChild>{trigger}</EnhancedDialogTrigger>}
      <EnhancedDialogContent
        nestingLevel={nestingLevel}
        isOpen={open}
        onOpenChange={onOpenChange}
        description={description}
        contentType={contentType}
        preferredSize={size}
        className={className}
        data-testid={`nested-dialog-level-${nestingLevel}`}
      >
        <EnhancedDialogHeader>
          <EnhancedDialogTitle>{title}</EnhancedDialogTitle>
          {description && <EnhancedDialogDescription>{description}</EnhancedDialogDescription>}
        </EnhancedDialogHeader>

        {/* DIALOG SCROLL FIX: Enhanced content container with proper scrolling for media library */}
        <div
          className={cn(
            "flex-1",
            contentType === "media-library"
              ? "min-h-0" // FIXED: Remove overflow-hidden to allow MediaLibraryContainer to handle scrolling
              : "overflow-hidden",
          )}
        >
          {children}
        </div>
      </EnhancedDialogContent>
    </EnhancedDialog>
  );
}

export {
  EnhancedDialog,
  EnhancedDialogPortal,
  EnhancedDialogOverlay,
  EnhancedDialogClose,
  EnhancedDialogTrigger,
  EnhancedDialogContent,
  EnhancedDialogHeader,
  EnhancedDialogBody,
  EnhancedDialogFooter,
  EnhancedDialogTitle,
  EnhancedDialogDescription,
};
