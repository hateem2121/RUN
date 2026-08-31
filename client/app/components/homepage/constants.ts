import type { CategoryItem, Partner, ProcessStep, ProductItem, StatItem } from "./types";

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

export const CATEGORIES: CategoryItem[] = [
  {
    id: "1",
    name: "Team Wear",
    image: "/images/homepage/hero-1.webp",
  },
  {
    id: "2",
    name: "Active Wear",
    image: "/images/homepage/hero-2.webp",
  },
  {
    id: "3",
    name: "Casual Wear",
    image: "/images/homepage/values-1.webp",
  },
  {
    id: "4",
    name: "Outer Wear",
    image: "/images/homepage/hero-1.webp",
  },
  {
    id: "5",
    name: "Tech Accessories",
    image: "/images/homepage/hero-2.webp",
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "01",
    title: "Inquiry & R&D",
    description: "Material sourcing and technical feasibility analysis.",
    image: "/images/homepage/hero-2.webp",
  },
  {
    id: "02",
    title: "Prototyping",
    description: "Rapid sampling and fit testing with 3D visualization.",
    image: "/images/homepage/hero-1.webp",
  },
  {
    id: "03",
    title: "Production",
    description: "Scaled manufacturing with real-time quality control.",
    image: "/images/homepage/stats-bg.webp",
  },
  {
    id: "04",
    title: "Logistics",
    description: "Global distribution and supply chain management.",
    image: "/images/homepage/hero-2.webp",
  },
];

/** @public */ export const PARTNERS: Partner[] = [
  { name: "Global Sports Inc", tag: "Sportswear" },
  { name: "Urban Tech", tag: "Streetwear" },
  { name: "EcoMove", tag: "Sustainability" },
  { name: "Nordic Fit", tag: "Outerwear" },
];

export const FEATURED_PRODUCTS: ProductItem[] = [
  {
    id: "P01",
    name: "Aero-Tech Shell",
    category: "Performance Outerwear",
    price: "MOQ 500",
    image: "/images/products/aero-tech-shell.webp",
  },
  {
    id: "P02",
    name: "Seamless Compression Tight",
    category: "Active Wear",
    price: "MOQ 1000",
    image: "/images/products/seamless-compression-tight.webp",
  },
  {
    id: "P03",
    name: "Hydro-Dri Base Layer",
    category: "Active Wear",
    price: "MOQ 2000",
    image: "/images/products/hydro-dri-base.webp",
  },
];
