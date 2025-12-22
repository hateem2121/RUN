import { DivIcon } from 'leaflet';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LottieIcon } from '../components/LottieIcon';
import { type AnimationType, animationCache } from './AnimationCache';

/**
 * Optimized icon manager that prevents memory leaks and improves performance
 * Uses proper React patterns for Lottie integration
 */

// Extended DivIcon with React cleanup properties
interface ExtendedDivIcon extends DivIcon {
  _reactRoot?: Root;
  _reactElement?: HTMLElement;
}

interface IconConfig {
  size: number;
  type: AnimationType;
}

class IconManagerService {
  private iconCache = new Map<string, DivIcon>();
  private fallbackIcons = new Map<string, DivIcon>();

  private createIconKey(config: IconConfig): string {
    return `${config.type}-${config.size}`;
  }

  private createFallbackIcon(config: IconConfig): DivIcon {
    const key = this.createIconKey(config);
    
    if (this.fallbackIcons.has(key)) {
      return this.fallbackIcons.get(key)!;
    }

    const { size, type } = config;
    const color = type === 'client' ? '#3b82f6' : '#10b981';
    const shadowColor = type === 'client' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)';

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

  private createLottieIcon(config: IconConfig, animationData: unknown): ExtendedDivIcon {
    const { size, type } = config;
    
    // Create a container for the React component
    const iconElement = document.createElement('div');
    iconElement.style.width = `${size}px`;
    iconElement.style.height = `${size}px`;
    iconElement.style.position = 'relative';
    iconElement.style.zIndex = '999';
    iconElement.className = `lottie-marker ${type}-marker`;
    
    // Render React component into the element
    const root = createRoot(iconElement);
    root.render(React.createElement(LottieIcon, {
      animationData,
      size,
      type
    }));
    
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

  async getIcon(config: IconConfig): Promise<DivIcon> {
    const key = this.createIconKey(config);
    
    // Return cached icon if available
    if (this.iconCache.has(key)) {
      return this.iconCache.get(key)!;
    }

    try {
      // Try to get animation data
      const animationData = await animationCache.getAnimation(config.type);
      const icon = this.createLottieIcon(config, animationData);
      this.iconCache.set(key, icon);
      return icon;
    } catch (error) {
      console.warn(`Failed to create Lottie icon for ${config.type}, using fallback:`, error);
      return this.createFallbackIcon(config);
    }
  }

  getFallbackIcon(config: IconConfig): DivIcon {
    return this.createFallbackIcon(config);
  }

  preloadIcons(configs: IconConfig[]): Promise<DivIcon[]> {
    return Promise.all(configs.map(config => this.getIcon(config)));
  }

  clearCache(): void {
    // Clean up React roots to prevent memory leaks
    this.iconCache.forEach(icon => {
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