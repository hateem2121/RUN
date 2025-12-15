import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Color, MathUtils, Mesh, ShaderMaterial, DoubleSide } from "three";
import { HERO_TEXT } from "./constants";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, useScroll, useTransform } from "framer-motion";

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
      if (uniforms && uniforms.uTime) {
        uniforms.uTime.value = state.clock.getElapsedTime();
      }
      if (uniforms && uniforms.uScroll) {
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
      className="relative w-full h-screen bg-luxury-surface overflow-hidden"
    >
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
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
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center justify-center perspective-[1000px] px-4 text-center">
          {HERO_TEXT.map((line, i) => (
            <div key={i} className="hero-line overflow-hidden py-2 -my-2">
              <motion.h1
                initial={{ y: "110%", rotateX: 15, opacity: 0, filter: "blur(10px)" }}
                animate={{ y: "0%", rotateX: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1], // Expo out equivalent
                  delay: 0.2 + i * 0.1,
                }}
                style={{ y: i % 2 === 0 ? y1 : y2, opacity }}
                className="text-display-xl leading-[0.85] font-bold text-luxury-interactive tracking-tighter mix-blend-multiply will-change-transform"
              >
                {line}
              </motion.h1>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator - Native CSS Animation */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-auto hidden md:block">
        <div className="relative w-24 h-24 animate-[spin_10s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
            <path
              id="curve"
              d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0"
              fill="transparent"
            />
            <text className="text-[14px] uppercase font-bold tracking-widest">
              <textPath href="#curve">Scroll Down • Scroll Down •</textPath>
            </text>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-black rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
