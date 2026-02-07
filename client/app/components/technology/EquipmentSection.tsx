import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export interface Equipment {
  id: number;
  name: string;
  brand: string;
  model: string;
  category?: string | undefined;
  quantity?: number | undefined;
  capacity?: string | undefined;
  certifications?: string[];
  imageId?: number | undefined;
}

interface EquipmentSectionProps {
  equipment: Equipment[];
}

export function EquipmentSection({ equipment }: EquipmentSectionProps) {
  if (!equipment?.length) return null;

  return (
    <section className="py-24 bg-white/5 relative">
      <div className="container mx-auto px-4 z-10 relative">
        <Typography.H2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
          Advanced Manufacturing Infrastructure
        </Typography.H2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {equipment.map((item) => (
            <Card
              key={item.id}
              className="bg-black/60 border-white/5 hover:bg-black/80 transition-all duration-300 group"
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-primary/80 uppercase tracking-wider">
                    {item.brand}
                  </span>
                  {item.quantity && item.quantity > 1 && (
                    <Badge variant="outline" className="text-xs border-white/10 text-white/70">
                      x{item.quantity}
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-sm text-white/50 mb-4 font-mono">{item.model}</p>

                <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                  {item.capacity && (
                    <div>
                      <span className="block text-white/30 mb-0.5">Capacity</span>
                      <span className="text-white/80">{item.capacity}</span>
                    </div>
                  )}
                  {item.category && (
                    <div>
                      <span className="block text-white/30 mb-0.5">Type</span>
                      <span className="text-white/80">{item.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
