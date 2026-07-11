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
    image: "/images/homepage/hero-1.png",
  },
  {
    id: "2",
    name: "Active Wear",
    image: "/images/homepage/hero-2.png",
  },
  {
    id: "3",
    name: "Casual Wear",
    image: "/images/homepage/values-1.png",
  },
  {
    id: "4",
    name: "Outer Wear",
    image: "/images/homepage/hero-1.png",
  },
  {
    id: "5",
    name: "Tech Accessories",
    image: "/images/homepage/hero-2.png",
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "01",
    title: "Inquiry & R&D",
    description: "Material sourcing and technical feasibility analysis.",
    image: "/images/homepage/hero-2.png",
  },
  {
    id: "02",
    title: "Prototyping",
    description: "Rapid sampling and fit testing with 3D visualization.",
    image: "/images/homepage/hero-1.png",
  },
  {
    id: "03",
    title: "Production",
    description: "Scaled manufacturing with real-time quality control.",
    image: "/images/homepage/stats-bg.png",
  },
  {
    id: "04",
    title: "Logistics",
    description: "Global distribution and supply chain management.",
    image: "/images/homepage/hero-2.png",
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
    image:
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "P02",
    name: "Carbon Knit Runner",
    category: "Footwear / Proto",
    price: "MOQ 1000",
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "P03",
    name: "Hydro-Dri Base Layer",
    category: "Active Wear",
    price: "MOQ 2000",
    image:
      "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?q=80&w=1000&auto=format&fit=crop",
  },
];
