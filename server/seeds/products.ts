export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  minOrderQuantity: number;
  specifications: Record<string, string>;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Industrial CNC Milling Machine X500",
    description:
      "High-precision 5-axis CNC milling center for complex aerospace and automotive components.",
    category: "Machinery",
    imageUrl:
      "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 1,
    specifications: {
      "Axis Travel": "500mm x 500mm x 400mm",
      "Spindle Speed": "12,000 RPM",
      Power: "15kW",
      Weight: "4,500 kg",
    },
  },
  {
    id: 2,
    name: "Heavy Duty Hydraulic Press 200T",
    description: "200-ton capacity hydraulic press for metal forming and stamping operations.",
    category: "Machinery",
    imageUrl:
      "https://images.unsplash.com/photo-1531297461137-75c91d4263b4?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 1,
    specifications: {
      Force: "2000 kN",
      Stroke: "400mm",
      Daylight: "800mm",
      Control: "PLC Automatic",
    },
  },
  {
    id: 3,
    name: "Precision Laser Cutter Fiber 3kW",
    description: "Fiber laser cutting machine for efficient processing of sheet metal.",
    category: "Laser Systems",
    imageUrl:
      "https://images.unsplash.com/photo-1616423695507-6b0dc4375330?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 1,
    specifications: {
      "Source Power": "3000W",
      "Working Area": "1500mm x 3000mm",
      "Max Speed": "120m/min",
      "Cutting Thickness (Steel)": "20mm",
    },
  },
  {
    id: 4,
    name: "Custom Steel Flange ANSI B16.5",
    description: "Certified forged steel flanges for high-pressure industrial piping applications.",
    category: "Components",
    imageUrl:
      "https://images.unsplash.com/photo-1535293233878-8cf9eb8488e3?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 50,
    specifications: {
      Material: "ASTM A105",
      Class: "150/300/600",
      Type: "Weld Neck / Slip On",
      "Size Range": '1/2" - 24"',
    },
  },
  {
    id: 5,
    name: "Robotic Welding Arm Series-K",
    description: "6-axis industrial robot arm optimized for MIG/TIG welding applications.",
    category: "Automation",
    imageUrl:
      "https://images.unsplash.com/photo-1555982105-d25af4182e4e?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 1,
    specifications: {
      Payload: "10kg",
      Reach: "1400mm",
      Repeatability: "±0.05mm",
      Mounting: "Floor/Ceiling/Wall",
    },
  },
  {
    id: 6,
    name: "Industrial Conveyor Belt System",
    description: "Modular belt conveyor system for assembly lines and material handling.",
    category: "Logistics",
    imageUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 10, // Meters? Units? Assuming custom system unit
    specifications: {
      "Belt Width": "300mm - 1200mm",
      Speed: "Variable (0-60m/min)",
      "Load Capacity": "50kg/m",
      Material: "Aluminum Extrusion Profile",
    },
  },
  {
    id: 7,
    name: "Injection Molding Machine 150T",
    description: "Energy-efficient servo-driven plastic injection molding machine.",
    category: "Plastics",
    imageUrl:
      "https://images.unsplash.com/photo-1622329235076-2e11894a4c5a?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 1,
    specifications: {
      "Clamping Force": "1500 kN",
      "Shot Weight": "250g (PS)",
      "Tie Bar Spacing": "460mm x 460mm",
      "System Pressure": "17.5 MPa",
    },
  },
  {
    id: 8,
    name: "High-Grade Titanium Sheet Grade 5",
    description: "Aerospace-grade titanium alloy sheets for high component strength.",
    category: "Raw Materials",
    imageUrl:
      "https://images.unsplash.com/photo-1517592965492-c0e865d6c8e3?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 100, // Kg
    specifications: {
      Alloy: "Ti-6Al-4V",
      Thickness: "0.5mm - 50mm",
      Finish: "Annealed / Mill Finish",
      Standard: "AMS 4911",
    },
  },
  // Adding more items to simulate scale for pagination tests
  ...Array.from({ length: 42 }, (_, i) => ({
    id: 9 + i,
    name: `Industrial Component Series-${1000 + i}`,
    description: "Generic industrial component for automated assembly lines.",
    category: "Components",
    imageUrl:
      "https://images.unsplash.com/photo-1580983561371-7f4b242d8ec0?auto=format&fit=crop&q=80&w=1000",
    minOrderQuantity: 100,
    specifications: {
      Material: "Steel/Aluminum",
      Grade: "Industrial Standard",
      Certification: "ISO 9001",
    },
  })),
];
