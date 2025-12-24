"use client";
import { useCallback, useEffect, useRef } from "react";
// import { motion } from "framer-motion";

export function BackgroundRippleEffect() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(undefined);
	const ripples = useRef<
		Array<{
			x: number;
			y: number;
			radius: number;
			alpha: number;
			maxRadius: number;
		}>
	>([]);

	const createRipple = useCallback((x: number, y: number) => {
		ripples.current.push({
			x,
			y,
			radius: 0,
			alpha: 0.6,
			maxRadius: Math.random() * 100 + 50,
		});
	}, []);

	const animate = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update and draw ripples
		ripples.current = ripples.current.filter((ripple) => {
			ripple.radius += 2;
			ripple.alpha -= 0.02;

			if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
				return false;
			}

			ctx.beginPath();
			ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(168, 162, 158, ${ripple.alpha})`; // stone-400 color - more visible
			ctx.lineWidth = 3;
			ctx.stroke();

			return true;
		});

		animationRef.current = requestAnimationFrame(animate);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = Math.max(
				window.innerHeight,
				document.documentElement.scrollHeight,
			);
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		const handleClick = (e: MouseEvent) => {
			createRipple(e.pageX, e.pageY);
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (Math.random() > 0.98) {
				// Occasional ripples on mouse move
				createRipple(e.pageX, e.pageY);
			}
		};

		document.addEventListener("click", handleClick);
		document.addEventListener("mousemove", handleMouseMove);

		// Create automatic ripples
		const interval = setInterval(() => {
			createRipple(Math.random() * canvas.width, Math.random() * canvas.height);
		}, 2000);

		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			document.removeEventListener("click", handleClick);
			document.removeEventListener("mousemove", handleMouseMove);
			clearInterval(interval);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [createRipple, animate]);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 pointer-events-none"
			style={{ zIndex: 10, minHeight: "100vh" }}
		/>
	);
}
