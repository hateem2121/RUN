import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
// import { getMediaSrc } from "@/lib/technology-constants"; // Unused for now

// Re-using types from the route or defining compatible ones
export interface Innovation {
  id: number;
  name: string;
  description: string;
  shortDescription?: string | undefined;
  category: string;
  status?: string | undefined;
  technicalDetails?: any;
  benefits: string[];
  imageId?: number | undefined;
  // Allow extra properties from VM
  [key: string]: any;
}

interface InnovationsSectionProps {
  innovations: Innovation[] | any[];
}

export function InnovationsSection({ innovations }: InnovationsSectionProps) {
  if (!innovations?.length) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 z-10 relative">
        <Typography.H2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
          Breakthrough Innovations
        </Typography.H2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {innovations.map((item) => (
            <Card
              key={item.id}
              className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden hover:border-primary/50 transition-colors duration-300"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {item.category}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                    {item.status}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                <p className="text-muted-foreground mb-6 flex-grow">
                  {item.shortDescription || item.description}
                </p>

                {item.benefits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                      Key Benefits
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {item.benefits.slice(0, 3).map((benefit: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
