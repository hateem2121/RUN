import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import TabbedDetails from './product-specs/TabbedDetails';
import SizeChartDisplay from './product-specs/SizeChartDisplay';
import DetailImage from './product-specs/DetailImage';
import { AsteriskIcon } from './Icons';

const ProductSpecs: React.FC<{ product: Product }> = ({ product }) => {
    
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section className="bg-white py-16 sm:py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    className="text-center mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={itemVariants}
                >
                    <h2 className="text-3xl md:text-4xl font-black-display mb-4">TECHNICAL BREAKDOWN</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Every detail is meticulously engineered for performance, durability, and customization. We provide full transparency into our materials and processes.
                    </p>
                </motion.div>

                <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.div variants={itemVariants}>
                        <TabbedDetails product={product} />
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="space-y-12">
                         <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <AsteriskIcon className="w-5 h-5 text-gray-500"/>
                                <h3 className="font-bold uppercase tracking-wider">Size & Fit</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-6">
                                Standard measurements are provided below. As a custom manufacturer, we can tailor sizing, fit, and grading to your precise specifications.
                            </p>
                            <SizeChartDisplay product={product} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {product.detailImages.map((img, index) => (
                                <DetailImage key={index} src={img.src} alt={img.alt} />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ProductSpecs;