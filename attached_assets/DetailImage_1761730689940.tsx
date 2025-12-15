import React from 'react';

interface DetailImageProps {
    src: string;
    alt: string;
    className?: string;
}

const DetailImage: React.FC<DetailImageProps> = ({ src, alt, className }) => {
    return (
        <img 
            src={src} 
            alt={alt} 
            className={`w-full object-cover ${className}`} 
        />
    );
};

export default DetailImage;
