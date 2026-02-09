import gsap from "gsap";
import { useEffect, useRef } from "react";

// Mechanical gear animation component
export function MechanicalGears() {
  const gear1Ref = useRef<SVGSVGElement>(null);
  const gear2Ref = useRef<SVGSVGElement>(null);
  const gear3Ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (gear1Ref.current && gear2Ref.current && gear3Ref.current) {
      gsap.to(gear1Ref.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
      });

      gsap.to(gear2Ref.current, {
        rotation: -360,
        duration: 15,
        repeat: -1,
        ease: "none",
      });

      gsap.to(gear3Ref.current, {
        rotation: 360,
        duration: 25,
        repeat: -1,
        ease: "none",
      });
    }
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-10">
      <svg
        ref={gear1Ref}
        className="absolute top-20 right-20 h-32 w-32 text-blue-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      <svg
        ref={gear2Ref}
        className="absolute bottom-40 left-32 h-48 w-48 text-blue-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m4.22-10.22l4.24 4.24m-4.24 4.24l4.24 4.24M20 12h-6m-6 0H1m4.22 10.22l4.24-4.24m-4.24-4.24L1 9.5" />
      </svg>

      <svg
        ref={gear3Ref}
        className="absolute top-1/2 left-1/2 h-24 w-24 text-blue-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
  );
}

// Conveyor belt animation component
export function ConveyorBelt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = 100;

    let offset = 0;
    let animationId: number;

    function drawBelt() {
      if (!ctx || !canvas) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "hsl(217 91% 60%)"; // matches --color-status-info
      ctx.lineWidth = 2;

      // Draw moving belt segments
      for (let x = -50; x < canvas.width + 50; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 50);
        ctx.lineTo(x + offset + 30, 50);
        ctx.stroke();
      }

      offset += 2;
      if (offset > 50) {
        offset = 0;
      }

      animationId = requestAnimationFrame(drawBelt);
    }

    drawBelt();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute bottom-0 left-0 h-24 w-full opacity-20" />;
}
