import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
}

export function ImageWithSkeleton({
  className,
  containerClassName,
  alt,
  src,
  onError,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImgSrc(src);
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoading(false);
    }
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && <Skeleton className="absolute inset-0 h-full w-full animate-pulse bg-muted" />}
      <img
        ref={imgRef}
        {...props}
        src={imgSrc || "/images/placeholders/product-placeholder.webp"}
        srcSet={props.srcSet}
        sizes={props.sizes}
        alt={alt}
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          setIsLoading(false);
          setImgSrc("/images/placeholders/product-placeholder.webp");
          onError?.(e);
        }}
      />
    </div>
  );
}
