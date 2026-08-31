import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useCursorStore } from "@/stores/useCursorStore";
import { useQuoteStore } from "@/stores/useQuoteStore";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Fabrics", href: "/fabrics" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Technology", href: "/technology" },
  { label: "About", href: "/about" },
] as const;

const CATEGORIES_LINKS = [
  { label: "Team Wear", href: "/categories/team-wear" },
  { label: "Active Wear", href: "/categories/active-wear" },
  { label: "Casual Wear", href: "/categories/casual-wear" },
  { label: "Outer Wear", href: "/categories/outer-wear" },
  { label: "Sports Accessories", href: "/categories/sports-accessories" },
] as const;

function SvgFilletLeft() {
  return (
    <div
      className="pointer-events-none absolute top-0 -left-[20px] h-[20px] w-[20px] select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-full w-full fill-black text-black"
        style={{ transform: "rotate(90deg)" }}
      >
        <title>Left Fillet</title>
        <path d="M 0 0 L 20 0 C 8.954 0 0 8.954 0 20 Z" />
      </svg>
    </div>
  );
}

function SvgFilletRight() {
  return (
    <div
      className="pointer-events-none absolute top-0 -right-[20px] h-[20px] w-[20px] select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" className="h-full w-full fill-black text-black">
        <title>Right Fillet</title>
        <path d="M 0 0 L 20 0 C 8.954 0 0 8.954 0 20 Z" />
      </svg>
    </div>
  );
}

export const CeilingNotchNavbar = memo(function CeilingNotchNavbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const { setTheme, resolvedTheme } = useTheme();
  const openDrawer = useQuoteStore((state) => state.openDrawer);
  const setCursor = useCursorStore((state) => state.setCursor);
  const resetCursor = useCursorStore((state) => state.resetCursor);
  const mobileMenuId = useId();
  const categoryMenuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = menuRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close desktop category menu on outside clicks
  useEffect(() => {
    if (!categoryMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(e.target as Node)
      ) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryMenuOpen]);

  // Directional scroll compression (smart header)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;

      if (currentScrollY > 120 && deltaY > 8 && !mobileMenuOpen && !categoryMenuOpen) {
        setIsVisible(false);
      } else if (deltaY < -4 || currentScrollY < 60) {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen, categoryMenuOpen]);

  // Close menus on route changes
  const currentPath = location.pathname;
  useEffect(() => {
    if (currentPath) {
      setMobileMenuOpen(false);
      setCategoryMenuOpen(false);
    }
  }, [currentPath]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close menus on Escape key press
  useEffect(() => {
    if (!mobileMenuOpen && !categoryMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setCategoryMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, categoryMenuOpen]);

  // Hide on admin routes
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  if (!mounted) {
    return (
      <header className="fixed top-0 left-1/2 z-dock -translate-x-1/2 pointer-events-none">
        <div className="relative flex h-[52px] w-[90vw] max-w-[760px] items-center justify-between rounded-b-[18px] bg-black px-4 shadow-2xl">
          <SvgFilletLeft />
          <div className="h-5 w-28 animate-pulse rounded-md bg-neutral-800" />
          <div className="hidden items-center gap-6 md:flex">
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-800" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-full bg-neutral-800" />
          <SvgFilletRight />
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-1/2 z-dock -translate-x-1/2 pointer-events-auto transition-transform duration-300 ease-out",
        !isVisible && "-translate-y-[calc(100%+12px)]",
      )}
    >
      {/* Primary Notch Container */}
      <nav
        aria-label="Main Navigation"
        className="relative flex h-[52px] items-center justify-between gap-4 rounded-b-[18px] bg-black px-4 text-white shadow-2xl transition-all duration-300 sm:px-5 md:gap-8"
      >
        <SvgFilletLeft />

        {/* Left: Brand Identity */}
        <Link
          to="/"
          onMouseEnter={() => setCursor("button")}
          onMouseLeave={resetCursor}
          className="group flex items-center gap-2 rounded-md px-1 py-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 font-bold text-white text-xs tracking-wider"
            aria-hidden="true"
          >
            R
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap font-bold font-neue-stance text-sm sm:text-base tracking-tight">
            <span>RUN APPAREL</span>
            <span className="hidden text-neutral-400 text-xs sm:inline font-normal">(PVT) LTD</span>
            <span className="sr-only"> - Homepage</span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {/* Categories Mega Dropdown Trigger */}
          <div ref={categoryContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((prev) => !prev)}
              onMouseEnter={() => setCursor("button")}
              onMouseLeave={resetCursor}
              aria-expanded={categoryMenuOpen}
              aria-controls={categoryMenuId}
              className={cn(
                "inline-flex min-h-[28px] items-center gap-1 rounded-xs px-2 py-1 transition-colors duration-200 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white",
                location.pathname.startsWith("/categories") || categoryMenuOpen
                  ? "font-semibold text-white"
                  : "text-white/70",
              )}
            >
              <span>Categories</span>
              <span className="text-[10px] text-white/50">▼</span>
            </button>

            {/* Desktop Category Dropdown Card */}
            {categoryMenuOpen && (
              <div
                id={categoryMenuId}
                className="absolute top-full left-0 mt-3 w-56 animate-in rounded-xl border border-neutral-800 bg-black/95 p-3 text-white shadow-2xl backdrop-blur-xl duration-200 fade-in slide-in-from-top-2"
              >
                <div className="flex flex-col gap-1">
                  {CATEGORIES_LINKS.map((cat) => (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      onClick={() => setCategoryMenuOpen(false)}
                      onMouseEnter={() => setCursor("button")}
                      onMouseLeave={resetCursor}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-neutral-800 hover:text-white"
                    >
                      <span>{cat.label}</span>
                      <ArrowRight className="h-3 w-3 opacity-40" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                to={link.href}
                onMouseEnter={() => setCursor("button")}
                onMouseLeave={resetCursor}
                className={cn(
                  "inline-flex min-h-[28px] items-center rounded-xs px-2 py-1 transition-colors duration-200 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white",
                  isActive ? "font-semibold text-white" : "text-white/70",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions (Theme Toggle, RFQ CTA, Mobile Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-white/70 transition-colors hover:bg-neutral-800 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white"
            aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-blue-300" />
            )}
          </button>

          {/* Request Quote Pill Button */}
          <button
            type="button"
            onClick={openDrawer}
            onMouseEnter={() => setCursor("button")}
            onMouseLeave={resetCursor}
            className="hidden items-center justify-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-semibold text-black text-xs transition-all hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
          >
            <span>Request Quote</span>
            <ArrowRight className="h-3 w-3" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-md text-white transition-colors hover:bg-neutral-800 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <SvgFilletRight />
      </nav>

      {/* Mobile Expanding Dropdown Card */}
      {mobileMenuOpen && (
        <div
          id={mobileMenuId}
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          onKeyDown={handleMenuKeyDown}
          className="mt-2 w-[calc(100vw-32px)] max-w-[400px] animate-in rounded-2xl border border-neutral-800 bg-black/95 p-5 text-white shadow-2xl backdrop-blur-xl duration-200 fade-in slide-in-from-top-3 lg:hidden max-h-[80vh] overflow-y-auto"
        >
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              [ Categories ]
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES_LINKS.map((cat) => (
                <Link
                  key={cat.href}
                  to={cat.href}
                  onMouseEnter={() => setCursor("button")}
                  onMouseLeave={resetCursor}
                  className="rounded-lg bg-neutral-900/60 px-2.5 py-1.5 text-xs text-white/80 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            <div className="my-1 border-neutral-800 border-t" />

            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
              [ Navigation ]
            </span>
            {NAV_LINKS.map((link) => {
              const isActive =
                location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onMouseEnter={() => setCursor("button")}
                  onMouseLeave={resetCursor}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-800 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white",
                    isActive ? "bg-neutral-800/80 font-semibold text-white" : "text-white/80",
                  )}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Link>
              );
            })}

            <div className="my-2 border-neutral-800 border-t" />

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openDrawer();
              }}
              onMouseEnter={() => setCursor("button")}
              onMouseLeave={resetCursor}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black text-sm transition-transform active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Request Quote / RFQ</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
});
