import { useEffect } from "react";
import { Outlet } from "react-router";
import { Footer } from "@/components/layout/Footer";
import { QuoteOverlay } from "@/components/navigation/QuoteOverlay";

export default function Component() {
  useEffect(() => {
    let scroll: { destroy: () => void } | undefined;
    import("locomotive-scroll").then((LocomotiveScroll) => {
      scroll = new LocomotiveScroll.default();
    });
    return () => {
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
