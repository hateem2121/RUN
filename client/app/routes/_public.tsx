import { Outlet } from "react-router";
import { Footer } from "@/components/layout/Footer";
import { QuoteOverlay } from "@/components/navigation/QuoteOverlay";

export default function PublicLayout() {
  return (
    <>
      <Outlet />
      <Footer />
      <QuoteOverlay />
    </>
  );
}
