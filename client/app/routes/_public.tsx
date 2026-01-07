import { Outlet } from "react-router";
import Footer from "@/components/layout/Footer";

export default function PublicLayout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}
