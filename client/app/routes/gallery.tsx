export default function Gallery() {
  const images = [
    { id: 1, title: "Precision Knitting", category: "Manufacturing" },
    { id: 2, title: "Zero-Waste Pattern Cuts", category: "Design" },
    { id: 3, title: "Pro Performance Fitting", category: "E-Sportswear" },
    { id: 4, title: "Aerodynamic Seam Sealing", category: "Innovation" },
    { id: 5, title: "Certified Organic Cotton Blending", category: "Sustainability" },
    { id: 6, title: "High-Visibility Teamwear Printing", category: "Product" },
  ];

  return (
    <div className="w-full bg-background min-h-screen text-foreground py-24 px-4 md:px-8">
      <div className="max-w-container-2xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-foreground/10 pb-8">
          <p className="text-brand-lime font-mono text-xs tracking-widest uppercase mb-2">
            RUN PORTFOLIO
          </p>
          <h1 className="text-[10vw] leading-[0.9] font-bold uppercase md:text-[5vw] tracking-tighter">
            MEDIA GALLERY
          </h1>
        </div>

        {/* Masonry-like Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden bg-muted/20 rounded-2xl border border-foreground/5"
            >
              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-95" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 z-10">
                <span className="text-brand-lime font-mono text-xs tracking-widest uppercase">
                  {img.category}
                </span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white group-hover:text-brand-lime transition-colors">
                  {img.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
