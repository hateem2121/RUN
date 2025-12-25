import { MediaType, type Product } from "../../types";

export const mockProduct: Product = {
  id: "RA-ACTIVE-001",
  name: "RUNFLEX™ Performance Quarter-Zip",
  sku: "RA-AQZ-24",
  category: "ACTIVE RUN",
  longDescription:
    "The RUNFLEX™ Performance Quarter-Zip is the cornerstone of our ACTIVE RUN collection. Developed with our proprietary 4-way stretch fabric, it offers exceptional breathability and thermal regulation. The garment is designed using 3D body mapping to ensure a perfect, non-restrictive fit during high-intensity activities. Ideal for team kits, corporate wellness programs, and athletic organizations seeking premium, customizable performance wear.",
  media: [
    {
      type: MediaType.Image,
      src: "https://images.pexels.com/photos/8636605/pexels-photo-8636605.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      thumbnail:
        "https://images.pexels.com/photos/8636605/pexels-photo-8636605.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2",
    },
    {
      type: MediaType.Image,
      src: "https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      thumbnail:
        "https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2",
    },
    {
      type: MediaType.Model3D,
      // Placeholder 3D model from Google. Replace with an actual product model.
      src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
      thumbnail:
        "https://images.pexels.com/photos/2085739/pexels-photo-2085739.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2",
    },
    {
      type: MediaType.Video,
      src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnail:
        "https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2",
    },
    {
      type: MediaType.Image,
      src: "https://images.pexels.com/photos/270085/pexels-photo-270085.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      thumbnail:
        "https://images.pexels.com/photos/270085/pexels-photo-270085.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2",
    },
  ],
  availableColors: [
    { name: "Onyx Black", hex: "#000000", rgb: [0, 0, 0] },
    { name: "Graphite Gray", hex: "#343434", rgb: [52, 52, 52] },
    { name: "Arctic White", hex: "#FFFFFF", rgb: [255, 255, 255] },
    { name: "Cobalt Blue", hex: "#0047AB", rgb: [0, 71, 171] },
  ],
  hotspots: [
    {
      id: "hotspot-1",
      position: "0.5m 0.5m 0.5m",
      normal: "0m 0m 1m",
      text: "YKK Zipper: Premium, lockable zipper for secure closure and ventilation control.",
    },
    {
      id: "hotspot-2",
      position: "-0.3m 0.8m 0.2m",
      normal: "-1m 0m 0m",
      text: "RUNFLEX™ Fabric: 92% Polyester, 8% Spandex blend. Moisture-wicking and quick-drying.",
    },
    {
      id: "hotspot-3",
      position: "0.2m -0.5m 0.4m",
      normal: "0m -1m 0m",
      text: "Reflective Detailing: Strategically placed for visibility in low-light conditions.",
    },
  ],
  sizeChart: {
    S: { Chest: '36-38"', Waist: '29-31"', Sleeve: '33"' },
    M: { Chest: '39-41"', Waist: '32-34"', Sleeve: '34"' },
    L: { Chest: '42-44"', Waist: '35-37"', Sleeve: '35"' },
    XL: { Chest: '45-47"', Waist: '38-40"', Sleeve: '36"' },
  },
  productSpecs: [
    "Fabric Composition: 92% Recycled Polyester, 8% Elastane",
    "Fabric Weight: 180 GSM (Grams per Square Meter)",
    "Construction: Flatlock seams to prevent chafing",
    "Features: UPF 50+ sun protection, anti-odor technology",
    "Customization: Sublimation, screen printing, embroidery available",
  ],
  minOrderQty: 100,
  leadTime: "4-6 Weeks",
  customFit: "Athletic Taper",
  customWeight: "180 GSM",
  certifications: [
    "SMETA 4-Pillar Audited Facility",
    "Supplier Fabric: OEKO-TEX STANDARD 100",
    "Supplier Fabric: Global Recycled Standard (GRS)",
  ],
  productTags: ["Performance", "Moisture-Wicking", "Teamwear", "Corporate", "Athletic Fit"],
  compatibleAccessories: [
    {
      id: "RA-GEAR-005",
      name: "RUNVENT™ Performance Cap",
      category: "RUN GEAR",
      imageUrl:
        "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?q=80&w=2670&auto=format&fit=crop",
    },
    {
      id: "RA-EVERYDAY-012",
      name: "RUNKNIT™ Training Jogger",
      category: "EVERYDAY RUN",
      imageUrl:
        "https://images.unsplash.com/photo-1594499468122-8118c7346857?q=80&w=2670&auto=format&fit=crop",
    },
    {
      id: "RA-GEAR-002",
      name: "RUNGRIP™ All-Weather Gloves",
      category: "RUN GEAR",
      imageUrl:
        "https://images.unsplash.com/photo-1590431313623-02425666e537?q=80&w=2574&auto=format&fit=crop",
    },
    {
      id: "RA-AS-ONE-003",
      name: "RUNMESH™ Team Shorts",
      category: "RUN AS ONE",
      imageUrl:
        "https://images.unsplash.com/photo-1591104838614-25535b71a04a?q=80&w=2670&auto=format&fit=crop",
    },
    {
      id: "RA-GEAR-010",
      name: "Custom Soccer Ball",
      category: "RUN GEAR",
      imageUrl:
        "https://images.unsplash.com/photo-1551958214-2d5e204a2c5a?q=80&w=2670&auto=format&fit=crop",
    },
  ],
  detailImages: [
    {
      src: "https://images.unsplash.com/photo-1604176354204-9268737828e4?q=80&w=2574&auto=format&fit=crop",
      alt: "Close-up of a high-performance fabric weave",
    },
    {
      src: "https://images.unsplash.com/photo-1576053139418-dd53a1a1f0a2?q=80&w=2574&auto=format&fit=crop",
      alt: "Detailed view of durable flatlock stitching",
    },
  ],
};
