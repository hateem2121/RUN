import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FEATURED_PRODUCTS } from '../constants';
import { useStore } from '../store';
import { CursorVariant } from '../types';

const FeaturedProducts: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCursor = useStore((state) => state.setCursor);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Explicitly use .current
    const scope = containerRef.current;

    const ctx = gsap.context(() => {
        const cards = scope.querySelectorAll('.product-card');
        
        if (cards.length > 0) {
            gsap.fromTo(cards, 
            { y: 100, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out",
                scrollTrigger: {
                trigger: scope,
                start: "top 70%",
                }
            }
            );
        }
    }, scope);

    return () => ctx.revert();
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleCatalogueClick = () => {
    const catalogueSection = document.getElementById('catalogue');
    if (catalogueSection) {
      catalogueSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={containerRef} className="w-full py-32 px-4 md:px-8 bg-[#FAFAFA]">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end mb-16 border-b border-black/10 pb-8">
            <h2 className="text-[12vw] md:text-[5vw] leading-[0.9] uppercase font-bold">
                Archive <br/> 24/25
            </h2>
            <div className="hidden md:block text-right">
                <p className="font-mono text-xs tracking-widest text-gray-500 mb-2">SEASON: CURRENT</p>
                <p className="font-mono text-xs tracking-widest text-gray-500">STATUS: PRODUCTION READY</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {FEATURED_PRODUCTS.map((product, index) => (
                <div 
                    key={product.id} 
                    className={`product-card group relative ${index === 1 ? 'md:mt-24' : ''}`}
                    onMouseEnter={() => !isMobile && setCursor(CursorVariant.VIEW, "VIEW SPECS")}
                    onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
                >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-200 mb-8">
                        <img 
                            src={product.image} 
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 grayscale group-hover:grayscale-0"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                    </div>
                    
                    <div className="flex justify-between items-start border-t border-black/10 pt-6">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl md:text-2xl font-bold uppercase leading-tight">{product.name}</h3>
                            <p className="font-mono text-xs md:text-sm text-gray-500 tracking-widest">{product.category}</p>
                        </div>
                        <span className="font-mono text-xs border border-black/20 px-3 py-1 rounded-full whitespace-nowrap ml-4">{product.price}</span>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-24 text-center">
             <button 
                onClick={handleCatalogueClick}
                className="uppercase tracking-widest text-sm font-bold border-b border-black pb-1 hover:text-[#3300FF] hover:border-[#3300FF] transition-colors"
                onMouseEnter={() => !isMobile && setCursor(CursorVariant.BUTTON)}
                onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
             >
                View Full Catalogue
             </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;