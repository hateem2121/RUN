import { cn } from "@/lib/utils";

interface MediaSkeletonProps {
  type?: "image" | "video" | "3d-model";
  className?: string;
  aspectRatio?: string;
}

export function MediaSkeleton({
  type = "image",
  className,
  aspectRatio = "16/9",
}: MediaSkeletonProps) {
  const getIcon = () => {
    switch (type) {
      case "video":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        );
      case "3d-model":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-400">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-400">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex animate-pulse items-center justify-center bg-gray-200 dark:bg-gray-700",
        "contain-layout", // CSS containment for performance
        className,
      )}
      style={{
        aspectRatio,
        minHeight: "200px", // Prevent layout shifts
      }}
    >
      {getIcon()}
    </div>
  );
}
