import type { DivIcon as DivIconType } from "leaflet";
import React from "react";
import { type AnimationType, animationCache } from "./AnimationCache";

// Lazy load leaflet only on client to prevent SSR crash
let DivIcon: typeof DivIconType | null = null;
let createRoot: typeof import("react-dom/client").createRoot | null = null;
let LottieIcon: React.ComponentType<{
  animationData: unknown;
  size: number;
  type: string;
}> | null = null;

const loadClientDependencies = async () => {
  if (typeof window !== "undefined" && !DivIcon) {
    const leaflet = await import("leaflet");
    DivIcon = leaflet.DivIcon;
    const reactDom = await import("react-dom/client");
    createRoot = reactDom.createRoot;
    const lottieModule = await import("../components/LottieIcon");
    LottieIcon = lottieModule.LottieIcon as React.ComponentType<{
      animationData: unknown;
      size: number;
      type: string;
    }>;
  }
};

/**
 * Optimized icon manager that prevents memory leaks and improves performance
 * Uses proper React patterns for Lottie integration
 */

// Extended DivIcon with React cleanup properties
interface ExtendedDivIcon extends DivIconType {
  _reactRoot?: import("react-dom/client").Root;
  _reactElement?: HTMLElement;
}

interface IconConfig {
  size: number;
  type: AnimationType;
}

class IconManagerService {
  private iconCache = new Map<string, DivIconType>();
  private fallbackIcons = new Map<string, DivIconType>();
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && typeof window !== "undefined") {
      await loadClientDependencies();
      this.initialized = true;
    }
  }

  private createIconKey(config: IconConfig): string {
    return `${config.type}-${config.size}`;
  }

  private createFallbackIcon(config: IconConfig): DivIconType | null {
    if (!DivIcon) {
      return null;
    }

    const key = this.createIconKey(config);

    if (this.fallbackIcons.has(key)) {
      return this.fallbackIcons.get(key)!;
    }

    const { size, type } = config;
    const color = type === "client" ? "var(--color-status-info)" : "var(--color-status-success)";
    const shadowColor =
      type === "client"
        ? "color-mix(in srgb, var(--color-status-info) 40%, transparent)"
        : "color-mix(in srgb, var(--color-status-success) 40%, transparent)";

    const icon = new DivIcon({
      className: `fallback-marker ${type}-fallback`,
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px ${shadowColor};
          position: relative;
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });

    this.fallbackIcons.set(key, icon);
    return icon;
  }

  private createLottieIcon(config: IconConfig, animationData: unknown): ExtendedDivIcon | null {
    if (!DivIcon || !createRoot || !LottieIcon) {
      return null;
    }

    const { size, type } = config;

    // Create a container for the React component
    const iconElement = document.createElement("div");
    iconElement.style.width = `${size}px`;
    iconElement.style.height = `${size}px`;
    iconElement.style.position = "relative";
    iconElement.style.zIndex = "999";
    iconElement.className = `lottie-marker ${type}-marker`;

    // Render React component into the element
    const root = createRoot(iconElement);
    root.render(
      React.createElement(LottieIcon, {
        animationData,
        size,
        type,
      }),
    );

    const icon = new DivIcon({
      className: `lottie-marker ${type}-marker`,
      html: iconElement.outerHTML,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });

    // Store the root for cleanup
    const extendedIcon = icon as ExtendedDivIcon;
    extendedIcon._reactRoot = root;
    extendedIcon._reactElement = iconElement;

    return extendedIcon;
  }

  async getIcon(config: IconConfig): Promise<DivIconType | undefined> {
    await this.ensureInitialized();

    const key = this.createIconKey(config);

    // Return cached icon if available
    if (this.iconCache.has(key)) {
      return this.iconCache.get(key)!;
    }

    try {
      // Try to get animation data
      const animationData = await animationCache.getAnimation(config.type);
      const icon = this.createLottieIcon(config, animationData);
      if (icon) {
        this.iconCache.set(key, icon);
        return icon;
      }
      return this.createFallbackIcon(config) || undefined;
    } catch (_error) {
      return this.createFallbackIcon(config) || undefined;
    }
  }

  getFallbackIcon(config: IconConfig): DivIconType | undefined {
    return this.createFallbackIcon(config) || undefined;
  }

  preloadIcons(configs: IconConfig[]): Promise<(DivIconType | undefined)[]> {
    return Promise.all(configs.map((config) => this.getIcon(config)));
  }

  clearCache(): void {
    // Clean up React roots to prevent memory leaks
    this.iconCache.forEach((icon) => {
      const extendedIcon = icon as ExtendedDivIcon;
      if (extendedIcon._reactRoot) {
        extendedIcon._reactRoot.unmount();
      }
    });

    this.iconCache.clear();
    this.fallbackIcons.clear();
  }
}

// Singleton instance
export const iconManager = new IconManagerService();
