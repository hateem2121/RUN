/**
 * Animation Utilities for Framer Motion Compatibility
 * Converts CSS easing strings to Framer Motion compatible formats
 */

// Type definitions for animation settings
export interface AnimationSettings {
  transitionDuration?: number;
  easing?: string;
}

export interface ValidatedAnimationSettings {
  transitionDuration: number;
  easing: string;
}

export interface LiquidGlassSettings {
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
  cardHoverScale?: number;
}

export interface ValidatedLiquidGlassSettings {
  blur: number;
  opacity: number;
  borderOpacity: number;
  cardHoverScale: number;
}

export interface ComponentAnimationSettings {
  swipeAnimation?: AnimationSettings;
  liquidGlass?: LiquidGlassSettings;
}

export const easingMap: Record<string, string> = {
  'ease-in-out': 'easeInOut',
  'ease-in': 'easeIn',
  'ease-out': 'easeOut',
  'ease': 'easeInOut',
  'linear': 'linear'
};

/**
 * Convert CSS easing strings to Framer Motion compatible formats
 * @param cssEasing - CSS easing string (e.g., 'ease-in-out')
 * @returns Framer Motion compatible easing string
 */
export function convertEasingToFramerMotion(cssEasing: string): string {
  return easingMap[cssEasing] || 'easeInOut';
}

/**
 * Validate and sanitize animation settings with safe defaults
 * @param settings - Animation settings object
 * @returns Sanitized animation settings
 */
export function validateAnimationSettings(settings?: AnimationSettings): ValidatedAnimationSettings {
  return {
    transitionDuration: typeof settings?.transitionDuration === 'number' 
      ? Math.max(0.1, Math.min(5, settings.transitionDuration))
      : 0.3,
    easing: convertEasingToFramerMotion(settings?.easing || 'ease-out')
  };
}

/**
 * Validate liquid glass settings with safe defaults
 * @param settings - Liquid glass settings object
 * @returns Sanitized liquid glass settings
 */
export function validateLiquidGlassSettings(settings?: LiquidGlassSettings): ValidatedLiquidGlassSettings {
  return {
    blur: typeof settings?.blur === 'number' 
      ? Math.max(0, Math.min(20, settings.blur))
      : 5,
    opacity: typeof settings?.opacity === 'number' 
      ? Math.max(0, Math.min(100, settings.opacity))
      : 10,
    borderOpacity: typeof settings?.borderOpacity === 'number' 
      ? Math.max(0, Math.min(100, settings.borderOpacity))
      : 20,
    cardHoverScale: typeof settings?.cardHoverScale === 'number' 
      ? Math.max(1, Math.min(1.5, settings.cardHoverScale))
      : 1.05
  };
}

/**
 * Log animation configuration for debugging (development only)
 * @param component - Component name
 * @param settings - Animation settings
 */
export function logAnimationConfig(component: string, settings?: ComponentAnimationSettings): void {
  // Animation debugging disabled in production for performance
  // Enable by changing false to true when needed for debugging
  const DEBUG_ENABLED = false;
  
  if (!DEBUG_ENABLED || process.env.NODE_ENV !== 'development' || !settings) {
    return;
  }
  
  console.log(`[Animation Debug] ${component}:`);
  if (settings.swipeAnimation) {
    console.log(`  Swipe Duration: ${settings.swipeAnimation.transitionDuration}, Easing: ${settings.swipeAnimation.easing}`);
  }
  if (settings.liquidGlass) {
    console.log(`  Glass Blur: ${settings.liquidGlass.blur}, Opacity: ${settings.liquidGlass.opacity}, Scale: ${settings.liquidGlass.cardHoverScale}`);
  }
}