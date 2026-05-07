import { ArrowUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROUTE_ACCENT_MAP: Record<string, { bg: string; hover: string }> = {
  "/manufacturing": { bg: "bg-manufacturing-accent", hover: "hover:bg-manufacturing-accent/90" },
  "/technology": { bg: "bg-technology-accent", hover: "hover:bg-technology-accent/90" },
  "/sustainability": {
    bg: "bg-sustainability-primary",
    hover: "hover:bg-sustainability-primary/90",
  },
};

const DEFAULT_ACCENT = { bg: "bg-manufacturing-accent", hover: "hover:bg-manufacturing-accent/90" };

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const accent = useMemo(() => {
    const match = Object.entries(ROUTE_ACCENT_MAP).find(([path]) =>
      location.pathname.startsWith(path),
    );
    return match ? match[1] : DEFAULT_ACCENT;
  }, [location.pathname]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={cn(
        "fixed right-8 bottom-8 z-modal transition-all duration-500 ease-in-out",
        isVisible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-10 scale-90 opacity-0",
      )}
    >
      <Button
        variant="default"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          "h-14 w-14 rounded-full text-black shadow-luxury-lg transition-all hover:scale-110 active:scale-95",
          accent.bg,
          accent.hover,
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
}
