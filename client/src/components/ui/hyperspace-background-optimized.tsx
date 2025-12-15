"use client";
 
import * as React from "react";
import { cn } from "@/lib/utils";
 
interface HyperspaceBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  starTrailOpacity?: number;
  starSpeed?: number;
  starColor?: string;
  starSize?: number;
  className?: string;
}
 
interface StarState {
  alpha: number;
  angle: number;
  x: number;
  vX: number;
  y: number;
  vY: number;
  size: number;
  active: boolean;
}
 
function hexToRgb(hex: string): [number, number, number] {
  const cleanedHex = hex.replace("#", "");
  const bigint = parseInt(cleanedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}
 
function randomInRange(max: number, min: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
export function HyperspaceBackgroundOptimized({
  starTrailOpacity = 0.5,
  starSpeed = 1.01,
  starColor = "#FFFFFF",
  starSize = 0.5,
  className,
  ...props
}: HyperspaceBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animationRef = React.useRef<number>(undefined);
  const starsRef = React.useRef<Star[]>([]);
  const [r, g, b] = hexToRgb(starColor);
 
  class Star {
    state: StarState;
 
    constructor() {
      this.state = {
        alpha: 0,
        angle: 0,
        x: 0,
        vX: 0,
        y: 0,
        vY: 0,
        size: starSize,
        active: true,
      };
      this.reset();
    }
 
    reset() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const radians = Math.PI / 180;
      const angle = randomInRange(0, 360) * radians;
      const vX = Math.cos(angle);
      const vY = Math.sin(angle);
 
      const travelled =
        Math.random() > 0.5
          ? Math.random() * Math.max(canvas.width, canvas.height) +
            Math.random() * (canvas.width * 0.24)
          : Math.random() * (canvas.width * 0.25);
 
      this.state = {
        alpha: Math.random(),
        angle: randomInRange(0, 360) * radians,
        x: Math.floor(vX * travelled) + canvas.width / 2,
        vX,
        y: Math.floor(vY * travelled) + canvas.height / 2,
        vY,
        size: starSize,
        active: true,
      };
    }
  }
 
  React.useEffect(() => {
    if (typeof window === "undefined") return;
 
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
 
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };
 
    resizeCanvas();
 
    // Create fewer stars for better performance (reduced from 300 to 100)
    if (starsRef.current.length === 0) {
      starsRef.current = new Array(100).fill(null).map(() => new Star());
    }
 
    const sizeIncrement = 1.01;
    let lastTime = 0;
    const targetFPS = 30; // Limit to 30 FPS for better performance
    const frameInterval = 1000 / targetFPS;
 
    const render = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        
        const invertedOpacity = 1 - starTrailOpacity;
        context.fillStyle = `rgba(0, 0, 0, ${invertedOpacity})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
 
        for (const star of starsRef.current) {
          const { x, y, size, vX, vY } = star.state;
 
          const newX = x + vX;
          const newY = y + vY;
 
          if (
            newX < 0 ||
            newX > canvas.width ||
            newY < 0 ||
            newY > canvas.height
          ) {
            star.reset();
          } else {
            star.state = {
              ...star.state,
              x: newX,
              vX: star.state.vX * starSpeed,
              y: newY,
              vY: star.state.vY * starSpeed,
              size: size * sizeIncrement,
            };
 
            context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${star.state.alpha})`;
            context.lineWidth = size;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(star.state.x, star.state.y);
            context.stroke();
          }
        }
      }
 
      animationRef.current = requestAnimationFrame(render);
    };
 
    animationRef.current = requestAnimationFrame(render);
 
    // Use ResizeObserver instead of window resize for better performance
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
 
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []); // Remove dependencies to prevent re-initialization
 
  return (
    <div className={cn("absolute inset-0 w-full h-full", className)} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}