/* eslint-disable react/no-unknown-property */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  DirectionalLight,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  type Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";

type Mode = "lens" | "bar" | "cube";

interface FluidGlassProps {
  mode?: Mode;
  lensProps?: any;
  barProps?: any;
  cubeProps?: any;
}

const FluidGlass = memo(function FluidGlass({
  mode = "lens",
  lensProps = {},
  barProps = {},
  cubeProps = {},
}: FluidGlassProps) {
  const mountRef = useRef<HTMLDivElement>(null!);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const glassRef = useRef<Mesh | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationIdRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  // const _componentId = useId(); // P1 FIX: SSR-stable ID

  const modeProps = mode === "lens" ? lensProps : mode === "bar" ? barProps : cubeProps;

  // Memoized initialization to prevent unnecessary re-renders
  const initializeThreeJS = useCallback(() => {
    if (!mountRef.current) return;

    // Prevent multiple Three.js instances - CRITICAL FIX
    if (sceneRef.current || rendererRef.current) {
      return;
    }

    // Scene setup with memory management
    const scene = new Scene();
    scene.background = null; // Allow media background to show through
    sceneRef.current = scene;

    // Camera setup
    const camera = new PerspectiveCamera(
      15,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 20;
    cameraRef.current = camera;

    // Renderer setup - Enable transparency to show media background
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(ambientLight, directionalLight);

    // Create glass sphere lens
    const createGlassSphere = () => {
      const geometry = new SphereGeometry(2, 32, 32);
      const material = new MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 2,
        ior: 1.15,
        clearcoat: 1,
        clearcoatRoughness: 0,
        transparent: true,
        opacity: 0.95,
        reflectivity: 0.5,
        envMapIntensity: 1,
      });
      const sphere = new Mesh(geometry, material);
      sphere.scale.setScalar(modeProps.scale || 0.25);
      glassRef.current = sphere;
      scene.add(sphere);
      setIsLoading(false);
    };

    // Use sphere lens immediately
    createGlassSphere();

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (glassRef.current) {
        // Smooth mouse follow
        glassRef.current.position.x += (mouseRef.current.x * 5 - glassRef.current.position.x) * 0.1;
        glassRef.current.position.y += (mouseRef.current.y * 5 - glassRef.current.position.y) * 0.1;

        // Rotation
        glassRef.current.rotation.x += 0.01;
        glassRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Enhanced cleanup to prevent memory leaks
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = 0;
      }

      // Cleanup Three.js resources
      if (glassRef.current) {
        if (glassRef.current.geometry) {
          glassRef.current.geometry.dispose();
        }
        if (glassRef.current.material) {
          if (Array.isArray(glassRef.current.material)) {
            glassRef.current.material.forEach((mat: Material) => mat.dispose());
          } else {
            (glassRef.current.material as Material).dispose();
          }
        }
      }

      if (renderer) {
        if (
          mountRef.current &&
          renderer.domElement &&
          mountRef.current.contains(renderer.domElement)
        ) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }

      if (scene) {
        scene.traverse((object: Object3D) => {
          if (object instanceof Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((mat: Material) => mat.dispose());
            } else {
              (object.material as Material)?.dispose();
            }
          }
        });
        scene.clear();
      }

      // Reset refs to allow future re-initialization
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      glassRef.current = null;
    };
  }, [modeProps.scale]);

  // Initialize Three.js with memoized initialization
  useEffect(() => {
    const cleanup = initializeThreeJS();
    return cleanup;
  }, [initializeThreeJS]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: "400px" }}>
      {isLoading && (
        <div className="center-flex absolute inset-0 bg-linear-to-br from-purple-50 to-blue-50">
          <div className="h-12 w-12 animate-spin rounded-full border-purple-600 border-b-2"></div>
        </div>
      )}
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
});

export default FluidGlass;
