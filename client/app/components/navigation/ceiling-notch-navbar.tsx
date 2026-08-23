import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useQuoteStore } from "@/stores/useQuoteStore";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Fabrics", href: "/fabrics" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Technology", href: "/technology" },
  { label: "About", href: "/about" },
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
  const location = useLocation();
  const { setTheme, resolvedTheme } = useTheme();
  const openDrawer = useQuoteStore((state) => state.openDrawer);
  const mobileMenuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route changes
  const currentPath = location.pathname;
  useEffect(() => {
    if (currentPath) {
      setMobileMenuOpen(false);
    }
  }, [currentPath]);

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
    <header className="fixed top-0 left-1/2 z-dock -translate-x-1/2 pointer-events-auto">
      {/* Primary Notch Container */}
      <nav
        aria-label="Main Navigation"
        className="relative flex h-[52px] items-center justify-between gap-4 rounded-b-[18px] bg-black px-4 text-white shadow-2xl transition-all duration-300 sm:px-5 md:gap-8"
      >
        <SvgFilletLeft />

        {/* Left: Brand Identity */}
        <Link
          to="/"
          className="group flex items-center gap-2 rounded-md px-1 py-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          aria-label="RUN APPAREL Homepage"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 font-bold text-white text-xs tracking-wider">
            R
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap font-bold font-neue-stance text-sm sm:text-base tracking-tight">
            <span>RUN APPAREL</span>
            <span className="hidden text-neutral-400 text-xs sm:inline font-normal">(PVT) LTD</span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "rounded-xs px-1 transition-colors duration-200 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white",
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-neutral-800 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white"
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
            className="hidden items-center justify-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-semibold text-black text-xs transition-all hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
          >
            <span>Request Quote</span>
            <ArrowRight className="h-3 w-3" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-neutral-800 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white lg:hidden"
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
          className="mt-2 w-[calc(100vw-32px)] max-w-[400px] animate-in rounded-2xl border border-neutral-800 bg-black/95 p-5 text-white shadow-2xl backdrop-blur-xl duration-200 fade-in slide-in-from-top-3 lg:hidden"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const isActive =
                location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-neutral-800",
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black text-sm transition-transform active:scale-[0.98]"
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
