import type React from "react";

interface ButtonHoverMultipleProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export const ButtonHoverMultiple: React.FC<ButtonHoverMultipleProps> = ({
  children,
  onClick,
  className = "",
  type = "button",
}) => {
  return (
    <button type={type} onClick={onClick} className={`group relative ${className}`}>
      <div className="relative z-elevated inline-flex h-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#263381] bg-gradient-to-r bg-transparent from-[#f6f7ff] to-[#f5f6ff] px-6 font-medium text-black transition-all duration-300 group-hover:-translate-x-3 group-hover:-translate-y-3 dark:border-[rgb(76_100_255)] dark:from-[#070e41] dark:to-[#263381] dark:text-white">
        {children}
      </div>
      <div className="absolute inset-0 z-base h-full w-full rounded-full transition-all duration-300 group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:[box-shadow:5px_5px_#394481,10px_10px_#5766be,15px_15px_#8898f3]"></div>
    </button>
  );
};
