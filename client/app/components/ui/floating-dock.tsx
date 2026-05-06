import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName: _mobileClassName,
  iconSize = "medium",
  disableMobile: _disableMobile,
}: {
  items: {
    id?: number | string;
    title: string;
    icon: React.ReactNode;
    href: string;
    iconSize?: string | undefined;
  }[];
  desktopClassName?: string | undefined;
  mobileClassName?: string | undefined;
  iconSize?: "small" | "medium" | "large";
  disableMobile?: boolean | undefined;
}) => {
  return <FloatingDockDesktop items={items} className={desktopClassName} iconSize={iconSize} />;
};

const FloatingDockDesktop = ({
  items,
  className,
  iconSize = "medium",
}: {
  items: {
    id?: number | string;
    title: string;
    icon: React.ReactNode;
    href: string;
    iconSize?: string | undefined;
  }[];
  className?: string | undefined;
  iconSize?: "small" | "medium" | "large";
}) => {
  const dockRef = useRef<HTMLElement>(null);

  const sizeMap = {
    small: { base: 32, hover: 64, icon: 16, iconHover: 32 },
    medium: { base: 44, hover: 80, icon: 24, iconHover: 40 },
    large: { base: 48, hover: 96, icon: 24, iconHover: 48 },
  };

  useGSAP(
    () => {
      const dockItems = gsap.utils.toArray<HTMLElement>(".dock-item");
      const iconWrappers = gsap.utils.toArray<HTMLElement>(".dock-icon-wrapper");

      const handleMouseMove = (e: MouseEvent) => {
        const sizes = sizeMap[iconSize as keyof typeof sizeMap] || sizeMap.medium;
        const maxDistance = 150;

        dockItems.forEach((item, i) => {
          const rect = item.getBoundingClientRect();
          const itemCenterX = rect.left + rect.width / 2;
          const distance = Math.abs(e.clientX - itemCenterX);

          const ratio = distance < maxDistance ? 1 - distance / maxDistance : 0;
          const targetSize = sizes.base + ratio * (sizes.hover - sizes.base);
          const targetIconSize = sizes.icon + ratio * (sizes.iconHover - sizes.icon);

          gsap.to(item, {
            width: targetSize,
            height: targetSize,
            duration: 0.2,
            ease: "power2.out",
          });

          if (iconWrappers[i]) {
            gsap.to(iconWrappers[i], {
              width: targetIconSize,
              height: targetIconSize,
              duration: 0.2,
              ease: "power2.out",
            });
          }
        });
      };

      const handleMouseLeave = () => {
        const sizes = sizeMap[iconSize as keyof typeof sizeMap] || sizeMap.medium;
        dockItems.forEach((item, i) => {
          gsap.to(item, {
            width: sizes.base,
            height: sizes.base,
            duration: 0.3,
            ease: "power2.out",
          });
          if (iconWrappers[i]) {
            gsap.to(iconWrappers[i], {
              width: sizes.icon,
              height: sizes.icon,
              duration: 0.3,
              ease: "power2.out",
            });
          }
        });
      };

      dockRef.current?.addEventListener("mousemove", handleMouseMove);
      dockRef.current?.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        dockRef.current?.removeEventListener("mousemove", handleMouseMove);
        dockRef.current?.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { scope: dockRef, dependencies: [iconSize] },
  );

  return (
    <Card
      variant="glass-premium"
      className={cn(
        "mx-auto hidden items-center gap-2 px-14 py-5 md:flex border-(--color-border)/50",
        className,
      )}
    >
      <nav
        ref={dockRef}
        aria-label="Desktop navigation dock"
        className="flex w-full transform-gpu items-center gap-2"
      >
        {items.map((item) => (
          <IconItem
            key={item.id || item.title}
            title={item.title}
            icon={item.icon}
            href={item.href}
            iconSize={item.iconSize || iconSize}
          />
        ))}
      </nav>
    </Card>
  );
};

function IconItem({
  title,
  icon,
  href,
  iconSize = "medium",
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  iconSize?: string | undefined;
}) {
  const sizeMap = {
    small: { base: 32, icon: 16 },
    medium: { base: 44, icon: 24 },
    large: { base: 48, icon: 24 },
  };

  const sizes = sizeMap[iconSize as keyof typeof sizeMap] || sizeMap.medium;

  return (
    <Link
      to={href}
      aria-label={title}
      className="group flex min-h-11 flex-col items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div
        className="dock-item center-flex relative overflow-hidden rounded-full border border-(--color-border)/60 bg-white/10 shadow-glow-lg backdrop-blur-lg transition-transform duration-150 group-active:scale-95 dark:border-(--color-border)/70 dark:bg-black/20"
        style={{ width: sizes.base, height: sizes.base }}
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-white/10 via-transparent to-black/10" />

        {/* Inner glow */}
        <div className="card-border-overlay rounded-full" />

        {/* Hover shimmer */}
        <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="shimmer-overlay rounded-full" />
        </div>

        <div
          className="dock-icon-wrapper center-flex relative z-(--z-index-elevated)"
          style={{ width: sizes.icon, height: sizes.icon }}
        >
          {icon}
        </div>
      </div>

      {/* Permanent title label with improved contrast */}
      <div className="max-w-20 truncate rounded-full bg-white/5 px-2 py-0.5 whitespace-nowrap text-center font-medium text-foreground text-[10px] backdrop-blur-md drop-shadow-sm md:max-w-32 md:text-xs dark:bg-black/20">
        {title}
      </div>
    </Link>
  );
}
