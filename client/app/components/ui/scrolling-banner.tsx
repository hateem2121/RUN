import { cn } from "@/lib/utils";

const AsteriskIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z"
      transform="rotate(22.5 50 50)"
    />
  </svg>
);

interface ScrollingBannerProps {
  text: string;
  className?: string | undefined;
}

export function ScrollingBanner({ text, className }: ScrollingBannerProps) {
  const bannerItems = text.split("*").map((s) => s.trim());

  const BannerContent = () => (
    <div className="flex shrink-0 items-center space-x-12 px-6">
      {bannerItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-12">
          <span className="whitespace-nowrap font-condensed text-4xl md:text-5xl lg:text-6xl">
            {item}
          </span>
          {index < bannerItems.length - 1 && <AsteriskIcon className="h-10 w-10 shrink-0" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("my-16 overflow-hidden bg-primary py-8 text-primary-foreground", className)}>
      <div className="flex animate-scroll-banner sm:[animation-duration:45s] lg:[animation-duration:30s]">
        <BannerContent />
        <BannerContent />
      </div>
    </div>
  );
}
