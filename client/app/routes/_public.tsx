import { useEffect } from "react";
import { Outlet } from "react-router";
import { Footer } from "@/components/layout/Footer";
import { QuoteOverlay } from "@/components/navigation/QuoteOverlay";

export default function Component() {
  useEffect(() => {
    let isActive = true;
    let scroll: { destroy: () => void } | undefined;
    import("locomotive-scroll").then((LocomotiveScroll) => {
      if (!isActive) return;
      scroll = new LocomotiveScroll.default();
    });
    return () => {
      isActive = false;
      if (scroll) scroll.destroy();
    };
  }, []);

  return (
    <>
      <Outlet />
      <Footer />
      <QuoteOverlay />
    </>
  );
}
