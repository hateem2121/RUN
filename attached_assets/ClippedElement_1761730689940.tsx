import React from 'react';

interface ClippedElementProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  clipAmount?: number;
  style?: React.CSSProperties;
  [x: string]: any; 
}

const ClippedElement: React.FC<ClippedElementProps> = ({ as: Tag = 'div', children, className, clipAmount = 20, style = {}, ...props }) => {
  const clipPathStyle = {
    clipPath: `polygon(0 0, 100% 0, calc(100% - ${clipAmount}px) 100%, 0 100%)`
  };

  const finalStyle = { ...style, ...clipPathStyle };

  return (
    <Tag
      className={className}
      style={finalStyle}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default ClippedElement;
