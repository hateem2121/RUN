import { Outlet } from "react-router";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/ui/CustomCursor";

export default function Component() {
  return (
    <>
      <CustomCursor />
      <Outlet />
      <Footer />
    </>
  );
}
