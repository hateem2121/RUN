# RUN Remix Design System

**Version:** 1.0.0
**Last Updated:** February 2026

## 1. Core Principles

- **Luxury & Performance:** Merging high-end fashion aesthetics with athletic performance.
- **Dark Mode First:** The primary experience is dark, sleek, and premium (`luxury-charcoal`).
- **Motion-Rich:** Micro-interactions and smooth transitions define the user experience.
- **Accessibility:** WCAG 2.1 AA+ compliance for contrast and navigation.

---

## 2. Typography

### Primary Font: **Neue Stance**

Used for headings, display text, and brand moments.

- **Bold (700):** Hero titles, section headers, primary CTAs.
- **Regular (400):** Subheadings, large body text.

### Secondary Font: **Inter**

Used for UI elements, long-form text, and data visualization.

- **Variable Weights:** UI labels, inputs, tables, dense information.

### Monospace: **JetBrains Mono**

Used for code blocks, technical data, and "micro" aesthetics.

### Type Scale (Responsive)

| Token | CSS Variable | Screen | Size |
|-------|--------------|--------|------|
| Display XL | `--font-size-display-xl` | Desktop | `10rem` |
| Display LG | `--font-size-display-lg` | Desktop | `7rem` |
| Display MD | `--font-size-display-md` | Desktop | `5rem` |
| Display SM | `--font-size-display-sm` | Mobile | `3rem` |
| Micro | `--text-micro` | All | `10px` (uppercase, tracked) |

---

## 3. Color Palette

### Brand Colors

| Name | Value | Token | Usage |
|------|-------|-------|-------|
| **Luxury Charcoal** | `#1a1a2e` | `--color-luxury-charcoal` | Primary background, deep surfaces |
| **Luxury Heading** | `#16213e` | `--color-luxury-heading` | Secondary background, cards |
| **Brand Lime** | `#ccff00` | `--color-brand-lime` | **Primary Action**, Success, Highlights |
| **Brand Purple** | `#ff9ffc` | `--color-brand-purple-light` | Secondary accents, gradients |
| **Luxury Gold** | `#b8860b` | `--color-luxury-gold` | Premium tiers, awards |

### Semantic Colors

| Role | Light Mode (`oklch`) | Dark Mode (`oklch`) | Usage |
|------|----------------------|---------------------|-------|
| **Background** | `100% white` | `Luxury Charcoal` | Page background |
| **Foreground** | `Black` | `98% White` | Primary text |
| **Primary** | `0.65 0.25 285` (Purple) | `0.7 0.25 285` (Purple) | Main buttons (Brand) |
| **Destructive** | `0.6 0.2 25` (Red) | `0.4 0.15 25` (Red) | Delete, Error |
| **Muted** | `96% Gray` | `25% Gray` | Secondary backgrounds |

### Glass Effects

- **Premium Glass:** `backdrop-filter: blur(12px) saturate(180%)`
- **Border:** `1px solid rgba(255, 255, 255, 0.1)`

---

## 4. Spacing & Layout

### Grid System

- **Container:** `max-width: 1280px` (`--spacing-container`)
- **Container 2XL:** `max-width: 1600px` (`--container-2xl`)
- **Padding:** Responsive (`1rem` -> `2rem`)

### Z-Index Layers

| Layer | Value | Token |
|-------|-------|-------|
| Base | `0` | `--z-index-base` |
| Dropdown | `1000` | `--z-index-dropdown` |
| Sticky | `1050` | `--z-index-sticky` |
| Dock | `1100` | `--z-index-dock` |
| Modal | `1300` | `--z-index-modal` |
| Toast | `1500` | `--z-index-toast` |
| Cursor | `1600` | `--z-index-cursor` |

---

## 5. UI Components

### Buttons

- **Primary:** Brand Lime background, Black text. Rounded corners (`--radius-button`).
- **Secondary:** Transparent background, White border (Glass effect).
- **Ghost:** Transparent background, hover effect only.

### Cards

- **Stacking Card:** `linear-gradient(135deg)` background, 3D transform capabilities.
- **Glass Card:** Premium glass effect with subtle border.

### Inputs

- **Style:** Minimalist, bottom border or subtle pill shape.
- **Focus:** Brand Lime ring/glow (`--ring`).

---

## 6. Icons & Imagery

- **Library:** `lucide-react`
- **Style:** Stroke width `1.5px` or `2px`.
- **Size:** Responsive icons (`size-icon-sm`).

---

## 7. Motion (Framer Motion)

- **Reduced Motion:** Respects user preference (`prefers-reduced-motion`).
- **Standard Config:**

```javascript
transition: { type: "spring", stiffness: 300, damping: 30 }
```

- **Micro-interactions:** Hover lifts, scale effects, glow intensification.
