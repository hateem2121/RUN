import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ResourceSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  showDescription?: boolean;
}

export function ResourceSkeleton({ 
  count = 6, 
  columns = 3,
  showDescription = true 
}: ResourceSkeletonProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showDescription && (
              <div className="space-y-2 mb-3">
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
              </div>
            )}
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}