import type { Partner, ProcessStep, StatItem } from "./types";

export const HERO_TEXT = ["YOUR STRATEGIC", "B2B MANUFACTURING", "PARTNER"];

export const KEY_STATS: StatItem[] = [
  {
    value: "135",
    label: "Years of Heritage",
    description: "Legacy defining craftsmanship since 1889.",
  },
  {
    value: "200+",
    label: "Master Artisans",
    description: "Dedicated specialists in technical apparel.",
  },
  {
    value: "100K",
    label: "Monthly Capacity",
    description: "Units produced with precision engineering.",
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "01",
    title: "Inquiry & R&D",
    description: "Material sourcing and technical feasibility analysis.",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1f164133a0?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "02",
    title: "Prototyping",
    description: "Rapid sampling and fit testing with 3D visualization.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "03",
    title: "Production",
    description: "Scaled manufacturing with real-time quality control.",
    image:
      "https://images.unsplash.com/photo-1605218427306-afa54388cf05?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "04",
    title: "Logistics",
    description: "Global distribution and supply chain management.",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop",
  },
];

export const PARTNERS: Partner[] = [
  { name: "Global Sports Inc", tag: "Sportswear" },
  { name: "Urban Tech", tag: "Streetwear" },
  { name: "EcoMove", tag: "Sustainability" },
  { name: "Nordic Fit", tag: "Outerwear" },
];
