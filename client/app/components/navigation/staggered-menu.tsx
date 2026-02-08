import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  displayItemNumbering?: boolean | undefined;
  className?: string | undefined;
  logoUrl?: string | undefined;
  menuButtonColor?: string | undefined;
  openMenuButtonColor?: string | undefined;
  accentColor?: string | undefined;
  changeMenuColorOnOpen?: boolean | undefined;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

export const StaggeredMenu = ({
  position = "right",
  colors = ["var(--color-brand-lavender)", "var(--color-primary)"],
  items = [],
  displayItemNumbering = true,
  className,
  menuButtonColor = "var(--color-foreground)",
  openMenuButtonColor = "var(--color-foreground)",
  changeMenuColorOnOpen = true,
  accentColor = "var(--color-primary)",
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  // Focus trap hook integration
  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isOpen: open,
    onClose: () => {
      // Only trigger close if open
      if (openRef.current) toggleMenu();
    },
    restoreFocus: true,
  });

  // We need to sync the internal panelRef used for GSAP with the focusTrapRef
  // We can just use focusTrapRef as the panel ref since it attaches to the `aside`
  const panelRef = focusTrapRef;

  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const hamburgerTopRef = useRef<HTMLSpanElement | null>(null);
  const hamburgerMiddleRef = useRef<HTMLSpanElement | null>(null);
  const hamburgerBottomRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerAnimRef = useRef<gsap.core.Timeline | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);

  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;

      const top = hamburgerTopRef.current;
      const middle = hamburgerMiddleRef.current;
      const bottom = hamburgerBottomRef.current;
      const icon = iconRef.current;

      if (!panel || !top || !middle || !bottom || !icon) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });

      gsap.set(top, { y: 0, rotation: 0 });
      gsap.set(middle, { opacity: 1 });
      gsap.set(bottom, { y: 0, rotation: 0 });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position, panelRef.current]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
    ) as HTMLElement[];

    const layerStates = layers.map((el) => ({
      el,
      start: Number(gsap.getProperty(el, "xPercent")),
    }));
    const panelStart = Number(gsap.getProperty(panel, "xPercent"));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic CSS variable
    if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as any]: 0 });

    const tl = gsap.timeline({ paused: true });

    // Check for reduced motion
    const itemDuration = shouldReduceMotion ? 0.2 : 0.5;
    const panelDuration = shouldReduceMotion ? 0.3 : 0.65;
    const staggerDelay = shouldReduceMotion ? 0 : 0.07;

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: itemDuration, ease: "power4.out" },
        i * staggerDelay,
      );
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * staggerDelay : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime,
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;

      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: "power4.out",
          stagger: { each: 0.1, from: "start" },
        },
        itemsStart,
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: "power2.out",
            // biome-ignore lint/suspicious/noExplicitAny: Dynamic CSS variable
            ["--sm-num-opacity" as any]: 1,
            stagger: { each: 0.08, from: "start" },
          },
          itemsStart + 0.1,
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [panelRef.current, shouldReduceMotion]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();

    const offscreen = position === "left" ? -100 : 100;

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

        const numberEls = Array.from(
          panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
        ) as HTMLElement[];
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic CSS variable
        if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as any]: 0 });

        busyRef.current = false;
      },
    });
  }, [position, panelRef.current]);

  const animateHamburger = useCallback((opening: boolean) => {
    const top = hamburgerTopRef.current;
    const middle = hamburgerMiddleRef.current;
    const bottom = hamburgerBottomRef.current;
    if (!top || !middle || !bottom) return;

    hamburgerAnimRef.current?.kill();

    if (opening) {
      // Animate to X
      hamburgerAnimRef.current = gsap
        .timeline({ defaults: { ease: "power2.out", duration: 0.3 } })
        .to(top, { y: 8, rotation: 45 }, 0)
        .to(middle, { opacity: 0 }, 0)
        .to(bottom, { y: -8, rotation: -45 }, 0);
    } else {
      // Animate to hamburger
      hamburgerAnimRef.current = gsap
        .timeline({ defaults: { ease: "power2.out", duration: 0.3 } })
        .to(top, { y: 0, rotation: 0 }, 0)
        .to(middle, { opacity: 1 }, 0)
        .to(bottom, { y: 0, rotation: 0 }, 0);
    }
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.05,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen],
  );

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateHamburger(target);
    animateColor(target);
  }, [playOpen, playClose, animateHamburger, animateColor, onMenuOpen, onMenuClose]);

  // Handle ESC key directly in hook, but ensure aria attributes are correct here
  // Add safe area padding to style manually until Tailwind env() support is verified in this context,
  // though we can use style prop for env vars which is safer.

  return (
    <div className="sm-scope pointer-events-none fixed top-0 left-0 z-(--z-index-sticky) h-screen w-screen overflow-hidden">
      <div
        className={`${
          className ? `${className} ` : ""
        }staggered-menu-wrapper relative z-(--z-index-sticky) h-full w-full`}
        style={
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic CSS variable
          accentColor ? ({ ["--sm-accent" as any]: accentColor } as React.CSSProperties) : undefined
        }
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers pointer-events-none absolute top-0 right-0 bottom-0 z-(--z-index-default) w-full"
          aria-hidden="true"
        >
          {(() => {
            const raw = colors?.length
              ? colors.slice(0, 4)
              : ["var(--color-neutral-900)", "var(--color-neutral-800)"];
            const arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1);
            }
            return arr.map((c, i) => (
              <div
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            ));
          })()}
        </div>

        <header
          className="staggered-menu-header absolute top-0 left-0 z-(--z-index-dock) flex w-full items-center justify-center bg-transparent p-4"
          aria-label="Main navigation header"
          // biome-ignore lint/style/useSelfClosingElements: CSS safety
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <button
            ref={toggleBtnRef}
            className="sm-toggle pointer-events-auto relative my-0 flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-full border-0 bg-white/50 py-6 text-black/60 shadow-lg backdrop-blur-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open ? "true" : "false"}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            data-testid="mobile-menu-toggle"
          >
            <span
              ref={iconRef}
              className="sm-hamburger relative inline-flex h-4 w-5 flex-col items-center justify-center gap-1"
              aria-hidden="true"
            >
              <span
                ref={hamburgerTopRef}
                className="sm-hamburger-line h-0.5 w-full rounded-full bg-current"
              />
              <span
                ref={hamburgerMiddleRef}
                className="sm-hamburger-line h-0.5 w-full rounded-full bg-current"
              />
              <span
                ref={hamburgerBottomRef}
                className="sm-hamburger-line h-0.5 w-full rounded-full bg-current"
              />
            </span>
          </button>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel pointer-events-auto absolute top-0 right-0 z-(--z-index-modal) flex h-full w-full flex-col overflow-y-auto bg-(--color-background)/95 px-6 pt-20 pb-8 shadow-2xl backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[80vw] md:w-96"
          style={{
            WebkitBackdropFilter: "blur(16px)",
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))", // Safe area + base padding
            paddingTop: "max(5rem, env(safe-area-inset-top))",
          }}
          aria-hidden={!open}
          tabIndex={-1} // Allow programmatic focus
        >
          <div className="sm-panel-inner flex flex-1 flex-col">
            <ul
              className="sm-panel-list m-0 flex list-none flex-col gap-6 p-0"
              data-numbering={displayItemNumbering || undefined}
            >
              {items?.length ? (
                items.map((it, idx) => (
                  <li
                    className="sm-panel-itemWrap relative overflow-hidden leading-none"
                    key={it.label + idx}
                  >
                    <Link
                      className="sm-panel-item relative inline-block cursor-pointer rounded-lg pr-[1.2em] font-bold text-4xl text-foreground uppercase leading-tight tracking-tight no-underline outline-none transition-all duration-200 ease-out hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-95 sm:text-5xl"
                      to={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                      data-testid={`mobile-nav-link-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => {
                        toggleMenu();
                      }}
                    >
                      <span className="sm-panel-itemLabel inline-block will-change-transform [transform-origin:50%_100%]">
                        {it.label}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li
                  className="sm-panel-itemWrap relative overflow-hidden leading-none"
                  aria-hidden="true"
                >
                  <span className="sm-panel-item relative inline-block cursor-pointer pr-[1.2em] font-bold text-4xl text-muted-foreground uppercase leading-tight tracking-tight no-underline transition-all duration-200 ease-out sm:text-5xl">
                    <span className="sm-panel-itemLabel inline-block will-change-transform [transform-origin:50%_100%]">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::before {
  content: "0" attr(data-index);
  position: absolute;
  right: 0;
  top: 0;
  font-size: 0.35em;
  font-weight: 500;
  color: var(--sm-accent, var(--color-primary));
  opacity: var(--sm-num-opacity, 0);
  pointer-events: none;
  user-select: none;
}
      `}</style>
    </div>
  );
};

export default StaggeredMenu;
