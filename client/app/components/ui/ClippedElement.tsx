import type React from "react";

interface ClippedElementProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string | undefined;
  clipAmount?: number | undefined;
  style?: React.CSSProperties;
  [x: string]: unknown;
}

/**
 * ClippedElement - Geometric Angular Cut Component
 * Applies a polygon clip path to create an angular edge.
 */
export const ClippedElement: React.FC<ClippedElementProps> = ({
  as: Tag = "div",
  children,
  className = "",
  clipAmount = 20,
  style = {},
  ...props
}) => {
  const clipPathStyle = {
    clipPath: `polygon(0 0, 100% 0, calc(100% - ${clipAmount}px) 100%, 0 100%)`,
  };
  const finalStyle = { ...style, ...clipPathStyle };
  const Element = Tag as React.ElementType;

  return (
    <Element className={className} style={finalStyle} {...props}>
      {children}
    </Element>
  );
};
