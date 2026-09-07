import type { NavigationItem } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  Moon,
  Phone,
  Search,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { NavCommandSearch } from "@/components/navigation/NavCommandSearch";
import { getOptimizedQueryOptions, queryKeys } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useCursorStore } from "@/stores/useCursorStore";
import { useQuoteStore } from "@/stores/useQuoteStore";

const FALLBACK_NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Fabrics", href: "/fabrics" },
  { label: "Manufacturing", href: "/manufacturing" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Technology", href: "/technology" },
  { label: "About", href: "/about" },
] as const;

const FALLBACK_CATEGORIES_LINKS = [
  { label: "Team Wear", href: "/categories/team-wear" },
  { label: "Active Wear", href: "/categories/active-wear" },
  { label: "Casual Wear", href: "/categories/casual-wear" },
  { label: "Outer Wear", href: "/categories/outer-wear" },
  { label: "Sports Accessories", href: "/categories/sports-accessories" },
] as const;

/**
 * Validates and sanitizes dynamic navigation URLs to prevent javascript: XSS and open redirects
 */
export const sanitizeNavHref = (href: string | null | undefined): string => {
  if (!href || typeof href !== "string") return "#";
  const trimmed = href.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return "#";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return "#";
};

function SvgFilletLeft() {
  return (
    <div
      className="pointer-events-none absolute top-0 -left-[19.5px] h-[20px] w-[20px] select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-full w-full fill-black text-black"
        style={{ transform: "rotate(90deg)" }}
        aria-hidden="true"
      >
        <path d="M 0 0 L 20 0 C 8.954 0 0 8.954 0 20 Z" />
        <path
          d="M 0 20 C 0 8.954 8.954 0 20 0"
          fill="none"
          stroke="currentColor"
          className="text-neutral-800/80 dark:text-white/15"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function SvgFilletRight() {
  return (
    <div
      className="pointer-events-none absolute top-0 -right-[19.5px] h-[20px] w-[20px] select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" className="h-full w-full fill-black text-black" aria-hidden="true">
        <path d="M 0 0 L 20 0 C 8.954 0 0 8.954 0 20 Z" />
        <path
          d="M 0 20 C 0 8.954 8.954 0 20 0"
          fill="none"
          stroke="currentColor"
          className="text-neutral-800/80 dark:text-white/15"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

export const CeilingNotchNavbar = memo(function CeilingNotchNavbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const location = useLocation();
  const currentPath = location.pathname;
  const { setTheme, resolvedTheme } = useTheme();

  const openDrawer = useQuoteStore((state) => state.openDrawer);
  const quoteCount = useQuoteStore((state) => state.items.length);
  const setCursor = useCursorStore((state) => state.setCursor);
  const resetCursor = useCursorStore((state) => state.resetCursor);

  const mobileMenuId = useId();
  const categoryMenuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mobileMenuOpenRef = useRef(mobileMenuOpen);
  const categoryMenuOpenRef = useRef(categoryMenuOpen);

  // TanStack Query for dynamic CMS navigation items with high-performance cache
  const { data: cmsItems } = useQuery<NavigationItem[]>({
    queryKey: queryKeys.navigation(),
    queryFn: async () => {
      const res = await fetch("/api/navigation-items");
      if (!res.ok) throw new Error("Failed to load navigation");
      return res.json();
    },
    ...getOptimizedQueryOptions("static"),
  });

  // Derive dynamic links with fallback
  const filteredNav = cmsItems
    ?.filter((i) => i.isActive && !i.href?.startsWith("/categories"))
    .map((i) => ({ label: i.label, href: sanitizeNavHref(i.href) }));
  const navLinks = filteredNav?.length ? filteredNav : FALLBACK_NAV_LINKS;

  const filteredCategories = cmsItems
    ?.filter((i) => i.isActive && i.href?.startsWith("/categories"))
    .map((i) => ({ label: i.label, href: sanitizeNavHref(i.href) }));
  const categoryLinks = filteredCategories?.length ? filteredCategories : FALLBACK_CATEGORIES_LINKS;

  // React 19 safe pointer-fine cursor guard
  const handleSetCursor = useCallback(
    (variant: "button" | "default") => {
      if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
        setCursor(variant);
      }
    },
    [setCursor],
  );

  const handleResetCursor = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
      resetCursor();
    }
  }, [resetCursor]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update refs in effect to maintain React 19 render-phase purity
  useEffect(() => {
    mobileMenuOpenRef.current = mobileMenuOpen;
    categoryMenuOpenRef.current = categoryMenuOpen;
  }, [mobileMenuOpen, categoryMenuOpen]);

  // Route change reset effect: brings navbar into view, closes menus, resets cursor
  useEffect(() => {
    if (currentPath) {
      setIsVisible(true);
      setMobileMenuOpen(false);
      setCategoryMenuOpen(false);
      resetCursor();
    }
  }, [currentPath, resetCursor]);

  // Close open drawer or dropdown when search palette is opened
  useEffect(() => {
    if (searchOpen) {
      setMobileMenuOpen(false);
      setCategoryMenuOpen(false);
    }
  }, [searchOpen]);

  // Close desktop category menu on outside clicks or when focus moves outside
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
    const handleFocusOutside = (e: FocusEvent) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(e.target as Node)
      ) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("focusin", handleFocusOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("focusin", handleFocusOutside);
    };
  }, [categoryMenuOpen]);

  // Clean up body scroll locking if viewport is resized to desktop width (>= 1280px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1280px)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileMenuOpen(false);
        document.body.style.overflow = "";
      }
    };
    mql.addEventListener("change", handleMediaChange);
    return () => mql.removeEventListener("change", handleMediaChange);
  }, []);

  // High-performance Directional scroll compression (smart header) via requestAnimationFrame
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const currentScrollY = window.scrollY;
        const deltaY = currentScrollY - lastScrollY;

        if (
          currentScrollY > 120 &&
          deltaY > 8 &&
          !mobileMenuOpenRef.current &&
          !categoryMenuOpenRef.current
        ) {
          setIsVisible(false);
        } else if (deltaY < -4 || currentScrollY < 60) {
          setIsVisible(true);
        }
        lastScrollY = currentScrollY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Lock body scroll and manage focus for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable && focusable.length > 0) {
        focusable[0]?.focus();
      }
    }, 50);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  // Clean up category timeout on unmount
  useEffect(() => {
    return () => {
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
    };
  }, []);

  const closeMobileMenu = useCallback(
    (focusTrigger = false) => {
      setMobileMenuOpen(false);
      resetCursor();
      if (focusTrigger) {
        hamburgerBtnRef.current?.focus();
      }
    },
    [resetCursor],
  );

  // Focus trap cycling for mobile menu
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMobileMenu(true);
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  // Keyboard navigation for desktop Categories mega dropdown
  const handleCategoryTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setCategoryMenuOpen(true);
      if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
      categoryTimeoutRef.current = setTimeout(() => {
        const firstLink = categoryMenuRef.current?.querySelector<HTMLAnchorElement>("a[href]");
        firstLink?.focus();
      }, 50);
    } else if (e.key === "Escape" && categoryMenuOpen) {
      e.preventDefault();
      setCategoryMenuOpen(false);
    }
  };

  const handleCategoryMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setCategoryMenuOpen(false);
      categoryTriggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const links = categoryMenuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]");
      if (!links?.length) return;
      const linksArray = Array.from(links);
      const currentIndex = linksArray.indexOf(document.activeElement as HTMLAnchorElement);
      let nextIndex = 0;
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < linksArray.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : linksArray.length - 1;
      }
      linksArray[nextIndex]?.focus();
    } else if (e.key === "Tab") {
      // Allow natural tab exit and close dropdown
      setCategoryMenuOpen(false);
    }
  };

  // Hide on admin routes
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 pointer-events-auto transition-transform duration-300 ease-out motion-reduce:transition-none focus-within:translate-y-0 print:hidden",
          mobileMenuOpen ? "z-modal" : "z-dock",
          !isVisible && "-translate-y-[calc(100%+12px)]",
        )}
      >
        {/* Primary Notch Container */}
        <nav
          aria-label="Main Navigation"
          className="relative flex h-[calc(52px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] items-center justify-between gap-3 rounded-b-[18px] border-b border-neutral-800/80 dark:border-white/15 bg-black/95 px-4 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 sm:px-5 md:gap-5 xl:gap-7"
        >
          <SvgFilletLeft />

          {/* Left: Brand Identity */}
          <Link
            to="/"
            onMouseEnter={() => handleSetCursor("button")}
            onMouseLeave={handleResetCursor}
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
              <span className="hidden text-neutral-400 text-xs sm:inline font-normal">
                (PVT) LTD
              </span>
              <span className="sr-only"> - Homepage</span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links (Responsive xl:flex to prevent overflow at 1024px) */}
          <div className="hidden items-center gap-4 text-sm font-medium xl:flex xl:gap-6">
            {/* Categories Mega Dropdown Trigger */}
            <div ref={categoryContainerRef} className="relative">
              <button
                ref={categoryTriggerRef}
                type="button"
                onClick={() => setCategoryMenuOpen((prev) => !prev)}
                onKeyDown={handleCategoryTriggerKeyDown}
                onMouseEnter={() => handleSetCursor("button")}
                onMouseLeave={handleResetCursor}
                aria-haspopup="true"
                aria-expanded={categoryMenuOpen}
                aria-controls={categoryMenuId}
                className={cn(
                  "inline-flex min-h-[32px] items-center gap-1 rounded-xs px-2.5 py-1 transition-colors duration-200 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer",
                  location.pathname.startsWith("/categories") || categoryMenuOpen
                    ? "font-semibold text-white"
                    : "text-white/70",
                )}
              >
                <span>Categories</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-white/60 transition-transform duration-200",
                    categoryMenuOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Desktop Category Dropdown Card */}
              {categoryMenuOpen && (
                <div
                  id={categoryMenuId}
                  ref={categoryMenuRef}
                  role="menu"
                  tabIndex={-1}
                  onKeyDown={handleCategoryMenuKeyDown}
                  className="absolute top-full left-0 mt-3 w-60 animate-in rounded-xl border border-neutral-800 bg-black/95 p-3 text-white shadow-2xl backdrop-blur-xl duration-200 fade-in slide-in-from-top-2"
                >
                  <div role="none" className="flex flex-col gap-1">
                    {categoryLinks.map((cat) => {
                      const isCatActive = location.pathname === cat.href;
                      return (
                        <Link
                          key={cat.href}
                          to={cat.href}
                          role="menuitem"
                          aria-current={isCatActive ? "page" : undefined}
                          onClick={() => setCategoryMenuOpen(false)}
                          onMouseEnter={() => handleSetCursor("button")}
                          onMouseLeave={handleResetCursor}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-neutral-800 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white",
                            isCatActive
                              ? "bg-neutral-800/60 font-semibold text-white"
                              : "text-white/80",
                          )}
                        >
                          <span>{cat.label}</span>
                          <ArrowRight className="h-3 w-3 opacity-40" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
              const isExternal =
                link.href.startsWith("http") ||
                link.href.startsWith("mailto:") ||
                link.href.startsWith("tel:");

              return isExternal ? (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  onMouseEnter={() => handleSetCursor("button")}
                  onMouseLeave={handleResetCursor}
                  className="inline-flex min-h-[32px] items-center rounded-xs px-2.5 py-1 text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => handleSetCursor("button")}
                  onMouseLeave={handleResetCursor}
                  className={cn(
                    "inline-flex min-h-[32px] items-center rounded-xs px-2.5 py-1 transition-colors duration-200 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                    isActive ? "font-semibold text-white" : "text-white/70",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions (Search, Theme Toggle, RFQ CTA, Mobile Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Search / Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              onMouseEnter={() => handleSetCursor("button")}
              onMouseLeave={handleResetCursor}
              aria-label="Quick search and commands (Cmd+K)"
              className="relative flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 text-xs text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer after:absolute after:-inset-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Search</span>
              <kbd className="hidden rounded bg-white/10 px-1 py-0.2 font-mono text-[9px] text-white/50 xl:inline">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle (Hydration-safe icon) */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              onMouseEnter={() => handleSetCursor("button")}
              onMouseLeave={handleResetCursor}
              className="relative flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-white/70 transition-colors hover:bg-neutral-800 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer after:absolute after:-inset-1.5"
              aria-label={
                mounted
                  ? `Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`
                  : "Toggle theme"
              }
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-300" />
                )
              ) : (
                <span className="h-4 w-4 block opacity-0" aria-hidden="true" />
              )}
            </button>

            {/* Request Quote Pill Button with Dynamic RFQ Item Counter */}
            <button
              type="button"
              onClick={openDrawer}
              onMouseEnter={() => handleSetCursor("button")}
              onMouseLeave={handleResetCursor}
              className="hidden items-center justify-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-semibold text-black text-xs transition-all hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white sm:inline-flex cursor-pointer"
            >
              <span>Request Quote</span>
              {mounted && quoteCount > 0 ? (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white tabular-nums animate-in zoom-in-50 duration-200">
                  <span className="sr-only">({quoteCount} items in quote request)</span>
                  <span aria-hidden="true">{quoteCount}</span>
                </span>
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              ref={hamburgerBtnRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              onMouseEnter={() => handleSetCursor("button")}
              onMouseLeave={handleResetCursor}
              className="relative flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-md text-white transition-colors hover:bg-neutral-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black xl:hidden cursor-pointer after:absolute after:-inset-1.5"
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuId}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <SvgFilletRight />
        </nav>

        {/* Mobile Expanding Dropdown Card with Accessible Modal Dialog Semantics */}
        {mobileMenuOpen && (
          <div
            id={mobileMenuId}
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            className="mt-2 w-[calc(100vw-32px)] max-w-[420px] animate-in rounded-2xl border border-neutral-800 bg-black/95 p-5 text-white shadow-2xl backdrop-blur-xl duration-200 fade-in slide-in-from-top-3 xl:hidden max-h-[80vh] overflow-y-auto focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white/20"
          >
            {/* Top Bar with Explicit Accessible Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 font-bold text-white text-[10px]">
                  R
                </div>
                <span className="font-neue-stance font-bold text-sm tracking-tight">
                  RUN APPAREL
                </span>
              </div>
              <button
                type="button"
                onClick={() => closeMobileMenu(true)}
                aria-label="Close navigation menu"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-neutral-800 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white cursor-pointer after:absolute after:-inset-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              {/* Quick Search Button in Mobile Menu */}
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  setSearchOpen(true);
                }}
                className="flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Search catalog, fabrics, or capabilities...</span>
                <kbd className="ml-auto font-mono text-[10px] text-neutral-500">⌘K</kbd>
              </button>

              <h2 className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase pt-1">
                [ Categories ]
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {categoryLinks.map((cat) => {
                  const isCatActive = location.pathname === cat.href;
                  return (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      aria-current={isCatActive ? "page" : undefined}
                      onClick={() => closeMobileMenu()}
                      className={cn(
                        "flex min-h-[44px] items-center rounded-xl bg-neutral-900/60 px-3 py-2 text-xs transition-colors hover:bg-neutral-800 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white",
                        isCatActive ? "bg-neutral-800 font-semibold text-white" : "text-white/80",
                      )}
                    >
                      {cat.label}
                    </Link>
                  );
                })}
              </div>

              <div className="my-1 border-neutral-800 border-t" />

              <h2 className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                [ Navigation ]
              </h2>
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    location.pathname === link.href ||
                    location.pathname.startsWith(`${link.href}/`);
                  const isExternal =
                    link.href.startsWith("http") ||
                    link.href.startsWith("mailto:") ||
                    link.href.startsWith("tel:");

                  return isExternal ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={() => closeMobileMenu()}
                      className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-neutral-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-4 w-4 opacity-50" />
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      to={link.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => closeMobileMenu()}
                      className={cn(
                        "flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white",
                        isActive ? "bg-neutral-800/80 font-semibold text-white" : "text-white/80",
                      )}
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-4 w-4 opacity-50" />
                    </Link>
                  );
                })}
              </div>

              <div className="my-2 border-neutral-800 border-t" />

              {/* Primary RFQ Submission CTA */}
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  openDrawer();
                }}
                className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black text-sm transition-transform active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                <span>Request Quote / RFQ</span>
                {mounted && quoteCount > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1.5 text-xs font-bold text-white tabular-nums">
                    {quoteCount}
                  </span>
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>

              {/* B2B Trust & Direct Assistance Footer */}
              <div className="mt-2 space-y-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 text-[11px] text-neutral-400">
                <div className="flex items-center gap-2 text-neutral-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>ISO 9001 · OEKO-TEX Standard 100 · GOTS Certified</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  ⚡ Minimum Order Quantity: 50 pcs / style
                </div>
                <a
                  href="https://wa.me/923361777313"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline font-medium pt-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Direct Factory Hotline (Sialkot, Pakistan)</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Backdrop Scrim for Mobile Menu: allows dismissing by tapping anywhere outside */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-modal-backdrop bg-black/60 backdrop-blur-xs xl:hidden animate-in fade-in duration-200"
          onClick={() => closeMobileMenu(true)}
          aria-hidden="true"
        />
      )}

      {/* Global Command Palette / Search Dialog */}
      <NavCommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
});
