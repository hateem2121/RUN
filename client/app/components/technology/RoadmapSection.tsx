import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export interface RoadmapItem {
  id: number;
  name: string;
  description: string;
  timeline: string;
  imageId?: number | undefined;
}

interface RoadmapSectionProps {
  roadmap: RoadmapItem[];
}

export function RoadmapSection({ roadmap }: RoadmapSectionProps) {
  if (!roadmap?.length) return null;

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 z-10 relative">
        <Typography.H2 className="text-3xl md:text-4xl font-bold mb-16 text-center text-white">
          Technology Roadmap
        </Typography.H2>

        <div className="relative max-w-4xl mx-auto">
          {/* Timeline Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 md:-ml-px pl-8 md:pl-0"></div>

          <div className="space-y-12">
            {roadmap.map((item, index) => (
              <div
                key={item.id}
                className={`flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Timeline Content */}
                <div className="md:w-1/2 pl-12 md:pl-0 md:pr-12 md:text-right relative">
                  {/* Dot on line */}
                  <div
                    className={`absolute left-0 top-1 w-3 h-3 rounded-full bg-primary border-4 border-black box-content 
                       md:left-auto md:right-auto md:transform md:translate-x-1/2
                       ${index % 2 === 0 ? "md:left-0 md:-translate-x-1/2" : "md:right-0 md:translate-x-1/2"}
                    `}
                  ></div>

                  {index % 2 !== 0 && (
                    <Card className="bg-black/50 border-white/10 p-6 backdrop-blur-sm hover:border-primary/30 transition-colors inline-block text-left w-full">
                      <span className="text-primary font-mono text-sm mb-2 block">
                        {item.timeline}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-3">{item.name}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </Card>
                  )}
                </div>

                {/* Spacer (or opposite side content) */}
                <div className="md:w-1/2 pl-12 md:pl-12">
                  {index % 2 === 0 && (
                    <Card className="bg-black/50 border-white/10 p-6 backdrop-blur-sm hover:border-primary/30 transition-colors w-full">
                      <span className="text-primary font-mono text-sm mb-2 block">
                        {item.timeline}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-3">{item.name}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
