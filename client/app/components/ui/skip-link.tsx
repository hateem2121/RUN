import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  targetId: string;
  className?: string;
}

/**
 * A standard accessibility component that allows keyboard users to jump directly to main content.
 * Follows WCAG 2.1 AA requirements for bypass blocks.
 */
export function SkipLink({ targetId, className }: SkipLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        // Set focus to the target element (must have tabIndex={-1} if not natively focusable)
        target.setAttribute("tabindex", "-1");
        target.focus();
        target.scrollIntoView({ behavior: "smooth" });
      }
    },
    [targetId],
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50",
        "focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:font-bold",
        "focus:rounded-xl focus:shadow-2xl focus:outline-none",
        className,
      )}
    >
      Skip to main content
    </a>
  );
}
