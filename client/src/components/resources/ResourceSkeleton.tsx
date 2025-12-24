import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ResourceSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  showDescription?: boolean;
}

export function ResourceSkeleton({
  count = 6,
  columns = 3,
  showDescription = true,
}: ResourceSkeletonProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showDescription && (
              <div className="mb-3 space-y-2">
                <div className="h-3 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-gray-200" />
              </div>
            )}
            <div className="flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
