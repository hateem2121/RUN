/// <reference types="vite/client" />

declare module "gsap";
declare module "gsap/ScrollTrigger";
declare module "lucide-react";
declare module "@tanstack/react-query";

// Declare model-viewer web component for TypeScript
declare global {
	namespace JSX {
		interface IntrinsicElements {
			"model-viewer": {
				src?: string;
				alt?: string;
				poster?: string;
				loading?: "auto" | "lazy" | "eager";
				reveal?: "auto" | "interaction" | "manual";
				"auto-rotate"?: boolean;
				"camera-controls"?: boolean;
				"shadow-intensity"?: string | number;
				"shadow-sm-softness"?: string | number;
				ar?: boolean;
				"ar-modes"?: string;
				"ios-src"?: string;
				exposure?: string | number;
				"environment-image"?: string;
				skybox?: string;
				seamlessPoster?: boolean;
				"min-camera-orbit"?: string;
				"max-camera-orbit"?: string;
				"camera-orbit"?: string;
				"field-of-view"?: string;
				"min-field-of-view"?: string;
				"max-field-of-view"?: string;
				"interaction-prompt"?: "auto" | "none";
				"interaction-prompt-style"?: "basic" | "wiggle";
				"interaction-prompt-threshold"?: string | number;
				bounds?: "tight" | "legacy";
				"interpolation-decay"?: string | number;
				className?: string;
				style?: React.CSSProperties;
				ref?: React.Ref<HTMLElement>;
			};
		}
	}
}

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
	// Add other env vars your app uses
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export {};
