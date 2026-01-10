interface StatItem {
  value: string;
  label: string;
  description: string;
}

export const StatsSection = () => {
  const stats: StatItem[] = [
    {
      value: "74",
      label: "Permanent Employees",
      description:
        "Our skilled workforce boasts a 94.6% retention rate, ensuring consistent quality.",
    },
    {
      value: "40+",
      label: "Years of Heritage",
      description: "Four decades of manufacturing expertise, now powered by 3D design technology.",
    },
    {
      value: "100%",
      label: "SMETA Audited",
      description:
        "Fully compliant with SMETA 4-Pillar standards for ethical and responsible production.",
    },
  ];

  return (
    <section className="bg-primary py-16 text-primary-foreground md:py-20 lg:py-32">
      <div className="container-wide mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="border-primary-foreground/20 border-t pt-6 md:pt-8">
              <p className="font-condensed text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                {stat.value}
              </p>
              <h3 className="mt-3 font-semibold text-base uppercase tracking-widest md:mt-4 md:text-lg">
                {stat.label}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-primary-foreground/70 text-xs sm:text-sm">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
