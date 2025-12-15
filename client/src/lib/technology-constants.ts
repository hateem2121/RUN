/**
 * Technology Domain Constants
 * Central configuration for Technology domain themes and defaults.
 *
 * Replaces hardcoded magic numbers and colors.
 */

export const TECHNOLOGY_THEME = {
  colors: {
    gradientStart: "#FF9FFC",
    gradientEnd: "#5227FF",
    // Standard theme colors if needed later
    primary: "#5227FF",
    accent: "#FF9FFC",
  },
  gradient: {
    defaultAngle: 135, // Was 0 in some places, 135 in others. Standardizing defaults.
    defaultNoise: 0.3, // Match admin default
    blindCount: 12,
    blindMinWidth: 50,
  },
};

export const TECHNOLOGY_DEFAULTS = {
  hero: {
    // Default values if needed
  },
  gradientSettings: {
    gradientColors: [
      TECHNOLOGY_THEME.colors.gradientStart,
      TECHNOLOGY_THEME.colors.gradientEnd,
    ] as [string, string],
    angle: 0, // Admin default
    noise: 0.3,
    blindCount: 12,
    blindMinWidth: 50,
    shineDirection: "left" as "left" | "right",
    spotlightRadius: 0.5,
    mouseDampening: 0.15,
    distortAmount: 0,
    paused: false,
    spotlightSoftness: 1,
    spotlightOpacity: 1,
    mirrorGradient: false,
    mixBlendMode: "lighten" as "lighten" | "overlay" | "screen",
    isActive: true,
    adminForceSettings: false,
  },
};
