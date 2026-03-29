import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// import { Button } from "@/components/ui/button";
// import { Activity } from "lucide-react";
// import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
  unit: string;
  change?: number | undefined;
}

interface DataComparisonToolProps {
  data: DataPoint[];
  title?: string | undefined;
}

export function DataComparisonTool({ data, title = "Data Overview" }: DataComparisonToolProps) {
  // const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded bg-background p-2"
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">
                {item.value} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
