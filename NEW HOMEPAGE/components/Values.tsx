import { Canvas, useFrame } from "@react-three/fiber";
import { Globe, Leaf, ShieldCheck, Zap } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, type Mesh, type ShaderMaterial } from "three";
import { useStore } from "../store";
import { CursorVariant } from "../types";

// Shaders moved outside for performance
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    
    // Create ripple effect
    float sinWave = sin(dist * 20.0 - uTime * 1.5);
    float distort = sinWave * 0.1;
    
    // Mix colors based on wave
    vec3 color = mix(uColor1, uColor2, 0.5 + distort);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const WaterRipple = () => {
  const mesh = useRef<Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new Color("#FFFFFF") },
      uColor2: { value: new Color("#E0F2FE") }, // Light blue tint
    }),
    [],
  );

  useFrame((state) => {
    if (mesh.current) {
      (mesh.current.material as ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        opacity={0.5}
      />
    </mesh>
  );
};

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  colSpan?: string;
  withRipple?: boolean;
  isMobile: boolean;
  setCursor: (variant: CursorVariant) => void;
  image: string;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  colSpan = "col-span-1",
  withRipple = false,
  isMobile,
  setCursor,
  image,
}) => (
  <div
    className={`${colSpan} group relative flex min-h-[400px] flex-col justify-between overflow-hidden border border-white/10 bg-[#0a0a0a] p-8 transition-all duration-500 will-change-transform hover:-translate-y-1 hover:shadow-2xl`}
    onMouseEnter={() => !isMobile && setCursor(CursorVariant.BUTTON)}
    onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
  >
    {/* Background Image Layer */}
    <div className="absolute inset-0 z-0">
      <img
        src={image}
        alt={title}
        decoding="async"
        className="h-full w-full object-cover opacity-50 grayscale transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    </div>

    {/* Ripple Layer - Only rendered on desktop for performance */}
    {withRipple && !isMobile && (
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-60 mix-blend-soft-light">
        <Canvas camera={{ position: [0, 0, 2] }} gl={{ alpha: true }}>
          <WaterRipple />
        </Canvas>
      </div>
    )}

    <div className="relative z-10 flex w-full justify-end">
      <Icon
        className={`h-12 w-12 stroke-[1] transition-colors duration-300 ${
          withRipple ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
        }`}
      />
    </div>
    <div className="relative z-10">
      <h3 className="mb-2 font-bold text-2xl text-white uppercase">{title}</h3>
      <p className="text-gray-400 transition-colors group-hover:text-gray-200">{subtitle}</p>
    </div>
  </div>
);

const Values: React.FC = () => {
  const setCursor = useStore((state) => state.setCursor);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="w-full bg-[#FAFAFA] px-4 py-32 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <h2 className="mb-16 text-center font-bold text-[12vw] uppercase leading-none md:text-[6vw]">
          Built on <span className="font-serif italic">Precision</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BentoCard
            title="Heritage Innovation"
            subtitle="135 Years of textile engineering mastery."
            icon={ShieldCheck}
            colSpan="md:col-span-2"
            isMobile={isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1598967990158-b12e3e9d8995?q=80&w=2070&auto=format&fit=crop"
          />
          <BentoCard
            title="Eco-Forward"
            subtitle="40% Water reduction in dyeing processes."
            icon={Leaf}
            withRipple={true}
            isMobile={isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1976&auto=format&fit=crop"
          />
          <BentoCard
            title="Global Reach"
            subtitle="Distribution centers in 12 countries."
            icon={Globe}
            isMobile={isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
          />
          <BentoCard
            title="Rapid Prototyping"
            subtitle="Concept to sample in 72 hours."
            icon={Zap}
            colSpan="md:col-span-2"
            isMobile={isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
          />
        </div>

        {/* Scrolling Ticker */}
        <div className="mt-24 w-full overflow-hidden border-black border-y py-6" aria-hidden="true">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array(10)
              .fill("GOTS CERTIFIED • OEKO-TEX STANDARD 100 • FAIR TRADE • ISO 9001 • ")
              .map((text, i) => (
                <span key={i} className="mx-4 font-mono text-xl">
                  {text}
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;
