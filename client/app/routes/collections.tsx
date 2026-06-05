import { Link } from "react-router";

export default function Component() {
  const collections = [
    {
      id: 1,
      name: "Apex Performance 24/25",
      description:
        "Ultra-lightweight fabrics with aerodynamic mesh zones, engineered for elite high-impact running.",
      count: 14,
      status: "Available now",
    },
    {
      id: 2,
      name: "Eco-Active Sustainable Blend",
      description:
        "Recycled ocean polyester and organic bamboo cotton activewear, providing optimal thermal regulation.",
      count: 8,
      status: "Production phase",
    },
    {
      id: 3,
      name: "Heritage Fieldwear Series",
      description:
        "Garment lines honoring over a century of sportswear manufacturing history, featuring reinforced double-knits.",
      count: 12,
      status: "Pre-order available",
    },
  ];

  return (
    <div className="w-full bg-background min-h-screen text-foreground py-24 px-4 md:px-8">
      <div className="max-w-container-2xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-foreground/10 pb-8">
          <p className="text-brand-lime font-mono text-xs tracking-widest uppercase mb-2">
            RUN CATALOGUE
          </p>
          <h1 className="text-[10vw] leading-[0.9] font-bold uppercase md:text-[5vw] tracking-tighter">
            SEASONAL COLLECTIONS
          </h1>
        </div>

        {/* List Layout */}
        <div className="flex flex-col gap-12">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group grid grid-cols-1 lg:grid-cols-3 gap-6 border-b border-foreground/10 pb-12 items-start"
            >
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight group-hover:text-brand-lime transition-colors">
                    {col.name}
                  </h2>
                  <span className="bg-muted px-3 py-1 text-xs font-mono rounded-full text-muted-foreground">
                    {col.count} ITEMS
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {col.description}
                </p>
              </div>
              <div className="flex flex-col gap-4 items-start lg:items-end justify-between h-full">
                <span className="font-mono text-xs text-brand-lime tracking-widest uppercase">
                  STATUS: {col.status}
                </span>
                <Link
                  to="/products"
                  className="rounded-full border border-foreground/20 px-6 py-2 hover:bg-foreground hover:text-background text-sm font-bold uppercase tracking-wider transition-colors mt-4"
                >
                  Explore Products
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
