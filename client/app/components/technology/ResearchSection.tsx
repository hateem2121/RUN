import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export interface Research {
  id: number;
  name: string;
  description: string;
  researchArea?: string | undefined;
  status?: string | undefined;
  startDate?: string | undefined;
  expectedCompletion?: string | undefined;
  funding?: number | undefined;
  teamMembers?: string[];
  objectives?: string[];
  partners?: string[];
}

interface ResearchSectionProps {
  research: Research[];
}

export function ResearchSection({ research }: ResearchSectionProps) {
  if (!research?.length) {
    return null;
  }

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 z-10 relative">
        <Typography.H2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
          R&D Initiatives
        </Typography.H2>

        <div className="space-y-8 max-w-5xl mx-auto">
          {research.map((item) => (
            <Card key={item.id} className="bg-black/30 border-white/10 overflow-hidden">
              <div className="p-8 md:flex gap-8">
                <div className="md:w-2/3">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      {item.researchArea || "General Research"}
                    </Badge>
                    <Badge
                      className={`
                           ${item.status === "Ongoing" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}
                        `}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">{item.name}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{item.description}</p>

                  {item.objectives && item.objectives.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
                        Objectives
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.objectives.map((obj, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-primary mt-1">→</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="md:w-1/3 mt-8 md:mt-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                  <div className="space-y-6">
                    {item.startDate && (
                      <div>
                        <span className="block text-xs uppercase text-white/40 mb-1">
                          Start Date
                        </span>
                        <span className="text-white font-mono">{item.startDate}</span>
                      </div>
                    )}
                    {item.expectedCompletion && (
                      <div>
                        <span className="block text-xs uppercase text-white/40 mb-1">
                          Target Completion
                        </span>
                        <span className="text-white font-mono">{item.expectedCompletion}</span>
                      </div>
                    )}
                    {item.partners && item.partners.length > 0 && (
                      <div>
                        <span className="block text-xs uppercase text-white/40 mb-1">Partners</span>
                        <div className="flex flex-wrap gap-2">
                          {item.partners.map((p, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white/5 px-2 py-1 rounded text-white/70"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
