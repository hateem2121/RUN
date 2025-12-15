import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface CircularNavButtonProps {
  href: string;
  text?: string;
}

export function CircularNavButton({
  href,
  text = "VIEW PRODUCTS • LEARN MORE",
}: CircularNavButtonProps) {
  const textChars = text.split("");

  return (
    <Link href={href}>
      <button className="circular-nav-button">
        {/* Rotating Text */}
        <div className="circular-nav-button__text">
          {textChars.map((char, index) => (
            <span
              key={index}
              className="circular-nav-button__char"
              style={{ "--index": index } as React.CSSProperties}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Center Circle with Arrow */}
        <div className="circular-nav-button__circle">
          <ArrowRight className="circular-nav-button__icon w-4 h-4" />
          <ArrowRight className="circular-nav-button__icon--copy w-4 h-4" />
        </div>
      </button>
    </Link>
  );
}
