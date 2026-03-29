"use client";
import { IconMenu2, IconX } from "@tabler/icons-react";
import gsap from "gsap";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean | undefined;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean | undefined;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean | undefined;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean | undefined;
}) => {
  return (
    <SidebarProvider
      open={open}
      {...(setOpen ? { setOpen } : {})}
      {...(animate !== undefined ? { animate } : {})}
    >
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen, animate } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // GSAP width animation
  useEffect(() => {
    if (!sidebarRef.current || !animate) return;
    gsap.to(sidebarRef.current, {
      width: open ? "300px" : "60px",
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [open, animate]);

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed top-0 bottom-0 left-0 z-sticky hidden w-80 shrink-0 bg-neutral-100 px-4 py-4 md:flex md:flex-col dark:bg-neutral-800",
        className,
      )}
      style={{
        transform: "none",
        willChange: "auto",
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      role="navigation"
      aria-label="Desktop Sidebar"
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const [shouldRender, setShouldRender] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Track render state
  useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open]);

  // Animate in/out
  useEffect(() => {
    if (!drawerRef.current || !shouldRender) return;
    if (open) {
      gsap.fromTo(
        drawerRef.current,
        { x: "-100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.3, ease: "power2.inOut" },
      );
    } else {
      gsap.to(drawerRef.current, {
        x: "-100%",
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => setShouldRender(false),
      });
    }
  }, [open, shouldRender]);

  return (
    <div
      className={cn(
        "fixed top-0 right-0 left-0 z-modal flex h-16 w-full flex-row items-center justify-between bg-neutral-100 px-4 py-4 md:hidden dark:bg-neutral-800",
      )}
      role="navigation"
      aria-label="Mobile Sidebar"
      {...props}
    >
      <div className="flex w-full justify-end">
        <IconMenu2
          className="text-neutral-800 dark:text-neutral-200"
          onClick={() => setOpen(!open)}
        />
      </div>
      {shouldRender && (
        <div
          ref={drawerRef}
          className={cn(
            "fixed inset-0 z-modal flex h-full w-full flex-col justify-between bg-white p-10 dark:bg-neutral-900",
            className,
          )}
        >
          <div
            className="absolute top-10 right-10 z-modal text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          >
            <IconX />
          </div>
          {children}
        </div>
      )}
    </div>
  );
};

export const SidebarLink = ({ link, className, ...props }: { link: Links; className?: string }) => {
  const { open, animate } = useSidebar();
  const { pathname } = useLocation();
  const location = pathname;
  const labelRef = useRef<HTMLSpanElement>(null);

  // Enhanced active state detection - check for exact match or admin sub-routes
  const isActive =
    location === link.href || (link.href.startsWith("/admin/") && location.startsWith(link.href));

  // Animate label display/opacity based on open state
  useEffect(() => {
    if (!labelRef.current || !animate) return;
    if (open) {
      gsap.to(labelRef.current, {
        display: "inline-block",
        opacity: 1,
        duration: 0.15,
        ease: "power1.out",
      });
    } else {
      gsap.to(labelRef.current, {
        opacity: 0,
        duration: 0.1,
        ease: "power1.in",
        onComplete: () => {
          if (labelRef.current) {
            gsap.set(labelRef.current, { display: "none" });
          }
        },
      });
    }
  }, [open, animate]);

  return (
    <Link
      to={link.href}
      prefetch="intent"
      className={cn(
        "group/sidebar flex items-center justify-start gap-2 py-2 transition-all duration-200",
        isActive
          ? "rounded-md bg-neutral-200 px-2 dark:bg-neutral-700"
          : "rounded-md hover:bg-neutral-100 hover:px-2 dark:hover:bg-neutral-800",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      <div
        className={cn(
          "transition-colors duration-200",
          isActive ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400",
        )}
      >
        {link.icon}
      </div>

      <span
        ref={labelRef}
        style={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "!m-0 !p-0 inline-block whitespace-pre text-sm transition duration-150",
          isActive
            ? "font-medium text-neutral-900 dark:text-white"
            : "text-neutral-700 dark:text-neutral-200",
          !isActive && "group-hover/sidebar:translate-x-1",
        )}
      >
        {link.label}
      </span>
    </Link>
  );
};
