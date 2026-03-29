import React, { useEffect } from "react";

interface AccessibilityWrapperProps {
  children: React.ReactNode;
}

export const AccessibilityWrapper = React.memo(function AccessibilityWrapper({
  children,
}: AccessibilityWrapperProps) {
  useEffect(() => {
    // Add keyboard navigation announcement
    const announcer = document.createElement("div");
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.id = "route-announcer";
    document.body.appendChild(announcer);

    return () => {
      document.body.removeChild(announcer);
    };
  }, []);

  return (
    <>
      {/* Skip to main content link - simplified for Visual Editor compatibility */}
      <a
        href="#main-content"
        className="sr-only rounded bg-blue-600 px-4 py-2 text-white focus:not-sr-only focus:static"
      >
        Skip to main content
      </a>

      {/* Main content wrapper */}
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </>
  );
});

// Utility function to announce route changes
export function announceRouteChange(message: string) {
  const announcer = document.getElementById("route-announcer");
  if (announcer) {
    announcer.textContent = message;
  }
}
