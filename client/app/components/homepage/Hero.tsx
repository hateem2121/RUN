import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, DoubleSide, MathUtils, type Mesh, type ShaderMaterial } from "three";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { colors, getCssVar } from "@/lib/design-tokens";
import { HERO_TEXT as FALLBACK_HERO_TEXT } from "./constants";

// Shader definitions moved outside component for performance
const vertexShader = `
  precision mediump float;
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uScroll;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // OPTIMIZATION: Simple Sine Interference instead of Noise
    // Calculates two sine waves moving in different directions
    float wave1 = sin(pos.x * 1.5 + uTime * 0.5);
    float wave2 = sin(pos.y * 2.0 + uTime * 0.8);
    
    // Kinetic Scroll Distortion
    // As user scrolls, the cloth gets "pulled" or glitched
    float scrollFactor = uScroll * 0.002;
    float wave3 = sin(pos.x * 10.0 + uTime * 2.0) * scrollFactor;
    
    // Combine for elevation
    float elevation = (wave1 + wave2 + wave3) * 0.3;
    pos.z += elevation;
    
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    // OPTIMIZATION: Fake Lighting
    // Map elevation (-0.6 to 0.6) to a 0.0-1.0 range
    float mixStrength = (vElevation + 0.6) * 0.8;
    
    // Simple gradient mix instead of calculating normals and light reflection
    vec3 color = mix(uColorStart, uColorEnd, mixStrength);
    
    // OPTIMIZATION: UV-based scanlines are cheaper and more consistent than gl_FragCoord
    float scanline = sin(vUv.y * 60.0) * 0.02;
    color += scanline;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Optimized Custom Shader to replace MeshDistortMaterial
const OptimizedClothMaterial = () => {
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 }, // New uniform for scroll reactivity
      uColorStart: { value: new Color("#050505") }, // Fallback to dark
      uColorEnd: { value: new Color("#1a1a1a") }, // Soft Charcoal Highlight
    }),
    [],
  );

  // Fix: Resolve CSS variables for Three.js (WebGL cannot parse "var(--...)")
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const startColor = getCssVar(colors.surfaceLight);
    const endColor = getCssVar(colors.surfaceGray);

    const uniforms = materialRef.current?.uniforms;
    if (uniforms) {
      if (startColor && uniforms.uColorStart) {
        uniforms.uColorStart.value.set(new Color(startColor));
      }
      if (endColor && uniforms.uColorEnd) {
        uniforms.uColorEnd.value.set(new Color(endColor));
      }
    }
  }, [resolvedTheme]);

  useFrame((state) => {
    if (materialRef.current?.uniforms) {
      if (materialRef.current.uniforms.uTime) {
        materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      }
      if (materialRef.current.uniforms.uScroll) {
        materialRef.current.uniforms.uScroll.value = MathUtils.lerp(
          materialRef.current.uniforms.uScroll.value,
          window.scrollY,
          0.1,
        );
      }
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      side={DoubleSide}
      transparent={false} // OPTIMIZATION: Opaque is faster (avoids alpha blending/sorting)
    />
  );
};

const ClothMesh = () => {
  const mesh = useRef<Mesh>(null);
  const { viewport, mouse } = useThree();

  // Detection for reducing heavy calculations on mobile
  const isMobile = useIsMobile();

  useFrame((state) => {
    if (mesh.current) {
      const t = state.clock.getElapsedTime();

      if (!isMobile) {
        // Interpolate mouse position for smooth interaction on desktop
        const targetRotX = (mouse.y * viewport.height) / 100;
        const targetRotY = (mouse.x * viewport.width) / 100;

        // Gentle rotation
        mesh.current.rotation.x = MathUtils.lerp(
          mesh.current.rotation.x,
          Math.sin(t * 0.2) * 0.1 + targetRotX,
          0.1,
        );
        mesh.current.rotation.y = MathUtils.lerp(
          mesh.current.rotation.y,
          Math.sin(t * 0.3) * 0.1 + targetRotY,
          0.1,
        );
      } else {
        // Simplified auto-rotation for mobile (save battery/CPU)
        mesh.current.rotation.x = Math.sin(t * 0.2) * 0.1;
        mesh.current.rotation.y = Math.sin(t * 0.3) * 0.1;
      }
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -2]} scale={1.5}>
      {/* 
        OPTIMIZATION: Significantly reduced polygon count (20x20) for mobile performance
        while maintaining enough fidelity for the sine wave simulation.
      */}
      <planeGeometry args={[15, 10, 20, 20]} />
      <OptimizedClothMaterial />
    </mesh>
  );
};

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [dpr, setDpr] = useState([1, 1.5]);
  const [isInView, setIsInView] = useState(false);

  const { data: homepageData } = useHomepageData();
  const heroData = homepageData?.hero?.result;

  // Split title by | or use fallback
  const heroLines = useMemo(() => {
    if (heroData?.title) {
      return heroData.title.split("|").map((t: string) => t.trim());
    }
    return FALLBACK_HERO_TEXT;
  }, [heroData]);

  // Performance: Detect if Hero is in view to pause WebGL
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setDpr([1, 1]);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!textContainerRef.current) return;

    // Explicitly use .current
    const scope = textContainerRef.current;

    const ctx = gsap.context(() => {
      // Intro Animation
      const titles = scope.querySelectorAll("h1");

      if (titles.length > 0) {
        gsap.fromTo(
          titles,
          {
            y: "110%",
            opacity: 0,
            scale: 0.85,
            rotateX: 15,
            transformOrigin: "center bottom",
            filter: "blur(12px)",
          },
          {
            y: "0%",
            opacity: 1,
            scale: 1,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 2.4,
            stagger: 0.15,
            ease: "expo.out",
            delay: 2.9,
            force3D: true,
          },
        );
      }
    }, scope);

    // Optimized Mouse Parallax Logic
    const lines = scope.querySelectorAll(".hero-line");
    if (lines.length > 0) {
      // Create quickTo setters for each line to avoid querySelectorAll in the loop
      const lineSetters = Array.from(lines).map((line, i) => {
        gsap.set(line, { x: 0, y: 0 }); // Initialize for quickTo
        return {
          x: gsap.quickTo(line, "x", { duration: 1, ease: "power2.out" }),
          y: gsap.quickTo(line, "y", { duration: 1, ease: "power2.out" }),
          speed: (i + 1) * 20,
        };
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isInView) return; // Don't calculate if not looking

        const xPos = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        const yPos = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

        lineSetters.forEach(({ x, y, speed }) => {
          x(xPos * speed);
          y(yPos * speed);
        });
      };

      // Only add mouse listener on desktop
      // (Verified safe: inside useEffect)
      if (window.innerWidth > 768) {
        window.addEventListener("mousemove", handleMouseMove);
      }

      return () => {
        ctx.revert();
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }

    return () => ctx.revert();
  }, [isInView]);

  return (
    <section
      ref={containerRef}
      className="bg-background-alt relative h-screen w-full overflow-hidden"
    >
      {/* 3D Background - Frameloop conditional for performance */}
      <div className="absolute inset-0 z-base opacity-20" style={{ pointerEvents: "none" }}>
        <Canvas
          frameloop={isInView ? "always" : "never"}
          dpr={dpr as [number, number]}
          gl={{ powerPreference: "high-performance", antialias: false }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ClothMesh />
        </Canvas>
      </div>

      {/* Hero Content */}
      <div className="z-elevated pointer-events-none absolute inset-0 flex items-center justify-center md:pt-0 pt-32">
        <div
          ref={textContainerRef}
          className="flex flex-col items-center justify-center px-4 text-center perspective-[1000px] mb-20 md:mb-0"
        >
          {heroLines.map((line: string, i: number) => (
            <div key={i} className="hero-line -my-2 overflow-visible py-2 will-change-transform">
              <h1 className="text-foreground text-[10vw] leading-[0.9] font-bold tracking-tighter will-change-transform md:text-[6vw] lg:text-[7vw] md:leading-[0.85] xs:text-[9vw] tiny:text-[8vw]">
                {line}
              </h1>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="z-sticky pointer-events-auto absolute right-8 bottom-8 hidden md:block"
        aria-hidden="true"
      >
        <div className="relative h-24 w-24 animate-[spin_10s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-black dark:fill-white">
            <path
              id="curve"
              d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0"
              fill="transparent"
            />
            <text className="text-[14px] font-bold tracking-widest uppercase">
              <textPath href="#curve">Scroll Down • Scroll Down •</textPath>
            </text>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
