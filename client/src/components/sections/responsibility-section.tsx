export const ResponsibilitySection = () => (
  <section className="bg-background py-20 text-foreground lg:py-32">
    <div className="container-wide mx-auto px-6">
      <div className="mb-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-0">
        <span className="text-sm uppercase tracking-widest">Ethical</span>
        <span className="text-sm uppercase tracking-widest">Manufacturing</span>
      </div>
      <div className="border-border border-y-2 py-8 text-center">
        <h2 className="text-center font-condensed font-medium text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
          TRANSPARENT
        </h2>
        <h2 className="-mt-4 py-4 text-center font-condensed font-medium text-4xl sm:text-6xl md:-mt-8 md:text-7xl lg:text-8xl xl:text-9xl">
          PARTNERSHIPS
        </h2>
      </div>
      <div className="mt-12 flex justify-center">
        <p className="max-w-3xl text-center text-muted-foreground">
          We are committed to ethical manufacturing and sustainable sourcing. Our partnerships with
          certified suppliers ensure that every product we create not only meets the highest
          performance standards but also contributes to a better future for our planet and its
          people.
        </p>
      </div>
    </div>
  </section>
);
