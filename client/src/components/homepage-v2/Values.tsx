import { Canvas, useFrame } from "@react-three/fiber";
import { Globe, Leaf, ShieldCheck, Zap } from "lucide-react";
import type React from "react";
import { useMemo, useRef } from "react";
import { Color, type Mesh, type ShaderMaterial } from "three";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useStore } from "./store";
import { CursorVariant } from "./types";

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
      const material = mesh.current.material as ShaderMaterial;
      if (material && material.uniforms?.uTime) {
        material.uniforms.uTime.value = state.clock.getElapsedTime();
      }
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
  setCursor: (variant: CursorVariant, text?: string, image?: string) => void;
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
}) => {
  const IconComponent = Icon as any;

  return (
    <div
      className={`
        relative group overflow-hidden rounded-3xl bg-[#0A0A0A] border border-white/10 ${colSpan}
        min-h-[300px] md:min-h-[360px] lg:min-h-[400px]
        transition-all duration-500 hover:border-white/20
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
      `}
      role="article"
      tabIndex={0}
      onMouseEnter={() => {
        setCursor(CursorVariant.VIEW, "EXPLORE", image);
      }}
      onMouseLeave={() => {
        setCursor(CursorVariant.DEFAULT);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          // In a real app, this would trigger navigation or a modal
          console.log(`Activate ${title}`);
        }
      }}
    >
      {" "}
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        {/* Ripple Effect - Desktop Only */}
        {withRipple && !isMobile && (
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 2] }} gl={{ alpha: true }}>
              <WaterRipple />
            </Canvas>
          </div>
        )}
        <img
          src={image}
          alt={title}
          decoding="async"
          className="w-full h-full object-cover opacity-50 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-70 grayscale group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>
      {/* Ripple Layer - Only rendered on desktop for performance */}
      {withRipple && !isMobile && (
        <div className="absolute inset-0 z-[1] opacity-60 mix-blend-soft-light pointer-events-none">
          <Canvas camera={{ position: [0, 0, 2] }} gl={{ alpha: true }}>
            <WaterRipple />
          </Canvas>
        </div>
      )}
      <div className="w-full flex justify-end relative z-10">
        <IconComponent
          className={`w-12 h-12 stroke-[1] transition-colors duration-300 ${
            withRipple ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
          }`}
        />
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl font-bold uppercase mb-2 text-white">{title}</h3>
        <p className="text-gray-400 group-hover:text-gray-200 transition-colors">{subtitle}</p>
      </div>
    </div>
  );
};

const Values: React.FC = () => {
  const setCursor = useStore((state) => state.setCursor);
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <section className="w-full py-16 md:py-32 px-4 md:px-8 bg-[#FAFAFA]">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-[12vw] md:text-[6vw] uppercase font-bold leading-none mb-16 text-center">
          Built on <span className="italic font-serif">Precision</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BentoCard
            title="Heritage Innovation"
            subtitle="135 Years of textile engineering mastery."
            icon={ShieldCheck}
            colSpan="sm:col-span-2 lg:col-span-2"
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
            colSpan="sm:col-span-2 lg:col-span-2"
            isMobile={isMobile}
            setCursor={setCursor}
            image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
          />
        </div>

        {/* Scrolling Ticker */}
        <div className="w-full border-y border-black mt-24 py-6 overflow-hidden" aria-hidden="true">
          <div className="flex whitespace-nowrap animate-marquee">
            {Array(10)
              .fill("GOTS CERTIFIED • OEKO-TEX STANDARD 100 • FAIR TRADE • ISO 9001 • ")
              .map((text, i) => (
                <span key={i} className="text-xl font-mono mx-4">
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
