// Type declarations for @google/model-viewer web component

/**
 * ModelViewerElement interface for instance methods and properties
 * Used when interacting with the model-viewer element via refs
 */
export interface ModelViewerElement extends HTMLElement {
  // Source and loading
  src: string;
  alt: string;
  poster: string;
  loading: "auto" | "lazy" | "eager";
  reveal: "auto" | "interaction" | "manual";

  // Camera and interaction
  cameraControls: boolean;
  autoRotate: boolean;
  cameraOrbit: string;
  fieldOfView: string;
  minCameraOrbit: string;
  maxCameraOrbit: string;
  minFieldOfView: string;
  maxFieldOfView: string;
  interactionPrompt: "auto" | "none";
  interpolationDecay: number;

  // AR
  ar: boolean;
  arModes: string;
  iosSrc: string;

  // Lighting
  exposure: number;
  shadowIntensity: number;
  shadowSoftness: number;
  environmentImage: string;

  // Methods
  dismissPoster(): void;
  showPoster(): void;
  getCameraOrbit(): { theta: number; phi: number; radius: number };
  getCameraTarget(): { x: number; y: number; z: number };
  getFieldOfView(): number;
  jumpCameraToGoal(): void;
  resetTurntableRotation(): void;
  updateFraming(): Promise<void>;

  // Shadow DOM access
  readonly shadowRoot: ShadowRoot | null;
}

/**
 * ModelViewer event types
 */
export interface ModelViewerProgressEvent extends Event {
  detail: {
    totalProgress: number;
  };
}

export interface ModelViewerLoadEvent extends Event {
  detail: Record<string, unknown>;
}

export interface ModelViewerErrorEvent extends Event {
  detail: {
    type?: string;
    message?: string;
  };
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSX & React.HTMLAttributes<HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
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
}

export {};
