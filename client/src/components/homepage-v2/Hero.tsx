import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion, useScroll, useTransform } from "framer-motion";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Color, DoubleSide, MathUtils, type Mesh, type ShaderMaterial } from "three";
import { useMediaQuery } from "@/hooks/use-media-query";
import { HERO_TEXT } from "./constants";

// --- SHADERS REMAIN UNCHANGED FOR PERFORMANCE ---
const vertexShader = `
  precision mediump float;
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uScroll;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 1.5 + uTime * 0.5);
    float wave2 = sin(pos.y * 2.0 + uTime * 0.8);
    float scrollFactor = uScroll * 0.002;
    float wave3 = sin(pos.x * 10.0 + uTime * 2.0) * scrollFactor;
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
    float mixStrength = (vElevation + 0.6) * 0.8;
    vec3 color = mix(uColorStart, uColorEnd, mixStrength);
    float scanline = sin(vUv.y * 60.0) * 0.02;
    color += scanline;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const OptimizedClothMaterial = () => {
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uColorStart: { value: new Color("#050505") },
      uColorEnd: { value: new Color("#1a1a1a") },
    }),
    [],
  );

  useFrame((state) => {
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms;
      if (uniforms?.uTime) {
        uniforms.uTime.value = state.clock.getElapsedTime();
      }
      if (uniforms?.uScroll) {
        uniforms.uScroll.value = MathUtils.lerp(uniforms.uScroll.value, window.scrollY, 0.1);
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
      transparent={false}
    />
  );
};

const ClothMesh = () => {
  const mesh = useRef<Mesh>(null);
  const { viewport, mouse } = useThree();
  const isMobile = useMediaQuery("(max-width: 767px)");

  useFrame((state) => {
    if (mesh.current) {
      const t = state.clock.getElapsedTime();

      if (!isMobile) {
        const targetRotX = (mouse.y * viewport.height) / 100;
        const targetRotY = (mouse.x * viewport.width) / 100;

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
        mesh.current.rotation.x = Math.sin(t * 0.2) * 0.1;
        mesh.current.rotation.y = Math.sin(t * 0.3) * 0.1;
      }
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -2]} scale={1.5}>
      <planeGeometry args={[15, 10, 20, 20]} />
      <OptimizedClothMaterial />
    </mesh>
  );
};

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [dpr] = useState<[number, number]>([1, 1.5]);

  // 1. MOTION: Scroll-driven parallax using Framer Motion
  // Replaces GSAP ScrollTrigger for the text effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-luxury-surface"
    >
      {/* 3D Background */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
        <Canvas
          frameloop="always" // Can be optimized based on intersection observer
          dpr={dpr}
          gl={{ powerPreference: "high-performance", antialias: false }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ClothMesh />
        </Canvas>
      </div>

      {/* Hero Content */}
      <div className="pointer-events-none absolute inset-0 z-elevated flex items-center justify-center">
        <div className="perspective-[1000px] flex flex-col items-center justify-center px-4 text-center">
          {HERO_TEXT.map((line, i) => (
            <div key={i} className="hero-line overflow-hidden py-1">
              <motion.h1
                initial={{
                  y: "110%",
                  rotateX: 15,
                  opacity: 0,
                  filter: "blur(10px)",
                }}
                animate={{
                  y: "0%",
                  rotateX: 0,
                  opacity: 1,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1], // Expo out equivalent
                  delay: 0.2 + i * 0.1,
                }}
                style={{ y: i % 2 === 0 ? y1 : y2, opacity }}
                className="font-bold text-display-xl text-luxury-interactive leading-tight tracking-tighter mix-blend-multiply will-change-transform"
              >
                {line}
              </motion.h1>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator - Native CSS Animation */}
      <div className="pointer-events-auto absolute right-8 bottom-8 z-elevated hidden md:block">
        <div className="relative h-24 w-24 animate-[spin_10s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-black">
            <path
              id="curve"
              d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0"
              fill="transparent"
            />
            <text className="font-bold text-[14px] uppercase tracking-widest">
              <textPath href="#curve">Scroll Down • Scroll Down •</textPath>
            </text>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-black" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
