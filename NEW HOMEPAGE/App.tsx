import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Menu, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import Categories from "./components/Categories";
import CustomCursor from "./components/CustomCursor";
import FeaturedProducts from "./components/FeaturedProducts";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Magnetic from "./components/Magnetic";
import Preloader from "./components/Preloader";
import Process from "./components/Process";
import Stats from "./components/Stats";
import Values from "./components/Values";

// Register Plugin Globally
gsap.registerPlugin(ScrollTrigger);

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  // Stable refs for skewable sections to avoid ref callback churn
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Proxy object to hold animation values - avoids quickTo strictness warnings
  const skewProxy = useRef({ val: 0 });

  // Store Lenis instance to control it later
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis Smooth Scroll with Skew Effect
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2.5,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // Kinetic Scroll Skew Effect via Proxy Pattern
    lenis.on("scroll", ({ velocity }: { velocity: number }) => {
      // Clamp velocity
      const targetSkew = Math.min(Math.max(velocity * 0.1, -5), 5);

      // Tween the proxy value - this handles the smoothing/easing
      gsap.to(skewProxy.current, {
        val: targetSkew,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
      });
    });

    // Single Ticker Loop to apply values to DOM
    const handleTicker = () => {
      const val = skewProxy.current.val;

      // Apply to explicit refs
      const targets = [heroRef.current, contentRef.current, footerRef.current];

      targets.forEach((el) => {
        if (el) {
          gsap.set(el, {
            skewY: val,
            rotateY: val * 0.2, // Subtle 3D rotation
            force3D: true, // Force GPU layer
            transformOrigin: "center center",
          });
        }
      });
    };

    gsap.ticker.add(handleTicker);

    // Sync Lenis RAF
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      gsap.ticker.remove(handleTicker);
    };
  }, []);

  // Lock body scroll and pause Lenis when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      lenisRef.current?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      lenisRef.current?.start();
    };
  }, [isMenuOpen]);

  return (
    <>
      {!preloaderFinished && <Preloader onComplete={() => setPreloaderFinished(true)} />}
      <CustomCursor />

      {/* Navigation Layer */}
      <nav
        className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-50 mix-blend-difference text-white pointer-events-none"
        aria-label="Main Navigation"
      >
        <div className="font-bold text-lg md:text-xl tracking-tighter uppercase pointer-events-auto">
          Run Apparel
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 pointer-events-auto items-center">
          <Magnetic>
            <button className="uppercase text-sm tracking-widest hover:text-[#3300FF] transition-all duration-300 px-2 py-4">
              Work
            </button>
          </Magnetic>
          <Magnetic>
            <button className="uppercase text-sm tracking-widest hover:text-[#3300FF] transition-all duration-300 px-2 py-4">
              Expertise
            </button>
          </Magnetic>
          <Magnetic>
            <button className="uppercase text-sm tracking-widest hover:text-[#3300FF] transition-all duration-300 px-2 py-4">
              Sustainability
            </button>
          </Magnetic>
        </div>

        <div className="pointer-events-auto">
          <Magnetic strength={0.5}>
            <button className="hidden md:block uppercase text-sm tracking-widest border border-current px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300">
              Let's Talk
            </button>
          </Magnetic>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden pointer-events-auto z-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-[#050505] z-40 flex flex-col items-center justify-center transition-all duration-500 ease-in-out md:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex flex-col gap-8 text-center">
          {["Work", "Expertise", "Sustainability", "Careers"].map((item, index) => (
            <button
              key={item}
              className={`text-4xl font-bold text-white uppercase tracking-tighter transition-all duration-500 ${isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => setIsMenuOpen(false)}
            >
              {item}
            </button>
          ))}
          <button
            className={`mt-8 px-8 py-4 border border-white text-white uppercase tracking-widest rounded-full transition-all duration-500 ${isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            style={{ transitionDelay: "500ms" }}
            onClick={() => setIsMenuOpen(false)}
          >
            Let's Talk
          </button>
        </div>
      </div>

      <main className="w-full bg-[#FAFAFA]">
        {/* GROUP 1: Skewable Top Section */}
        <div ref={heroRef} className="will-change-transform origin-top">
          <Hero />
        </div>

        {/* STATIC: Stats has sticky elements, kept outside skew to avoid jitter */}
        <Stats />

        {/* GROUP 2: Skewable Middle Content */}
        <div ref={contentRef} className="will-change-transform origin-top">
          <Categories />
          <FeaturedProducts />
          <Values />
        </div>

        {/* STATIC: Process has viewport pinning, MUST be outside transformed container */}
        <Process />

        {/* GROUP 3: Skewable Footer */}
        <div ref={footerRef} className="will-change-transform origin-top">
          <Footer />
        </div>
      </main>
    </>
  );
};

export default App;
