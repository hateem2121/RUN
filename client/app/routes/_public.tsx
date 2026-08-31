import { Outlet } from "react-router";
import { Footer } from "@/components/layout/Footer";
import { QuoteOverlay } from "@/components/navigation/QuoteOverlay";
import { CustomCursor } from "@/components/ui/CustomCursor";

export default function Component() {
  return (
    <>
      <CustomCursor />
      <Outlet />
      <Footer />
      <QuoteOverlay />
    </>
  );
}
