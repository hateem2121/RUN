import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useConcurrentLocation } from "@/hooks/useConcurrentLocation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useConcurrentLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!pageRef.current) return;
    gsap.from(pageRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
  }, [location]);

  return <div ref={pageRef}>{children}</div>;
}
