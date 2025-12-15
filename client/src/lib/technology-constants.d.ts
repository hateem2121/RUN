/**
 * Technology Domain Constants
 * Central configuration for Technology domain themes and defaults.
 *
 * Replaces hardcoded magic numbers and colors.
 */
export declare const TECHNOLOGY_THEME: {
    colors: {
        gradientStart: string;
        gradientEnd: string;
        primary: string;
        accent: string;
    };
    gradient: {
        defaultAngle: number;
        defaultNoise: number;
        blindCount: number;
        blindMinWidth: number;
    };
};
export declare const TECHNOLOGY_DEFAULTS: {
    hero: {};
    gradientSettings: {
        gradientColors: [string, string];
        angle: number;
        noise: number;
        blindCount: number;
        blindMinWidth: number;
        shineDirection: "left" | "right";
        spotlightRadius: number;
        mouseDampening: number;
        distortAmount: number;
        paused: boolean;
        spotlightSoftness: number;
        spotlightOpacity: number;
        mirrorGradient: boolean;
        mixBlendMode: "lighten" | "overlay" | "screen";
        isActive: boolean;
        adminForceSettings: boolean;
    };
};
//# sourceMappingURL=technology-constants.d.ts.map