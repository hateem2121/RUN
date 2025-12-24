import { motion } from "framer-motion";
import type React from "react";
import { useRef, useState } from "react";
import EthicalManufacturing from "./components/EthicalManufacturing";
import Footer from "./components/Footer";
import InquiryModal from "./components/InquiryModal";
import type { ProductGalleryHandle } from "./components/ProductGallery";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductSpecs from "./components/ProductSpecs";
import Recommendations from "./components/Recommendations";
import { mockProduct } from "./data/products";

const App: React.FC = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const galleryContainerRef = useRef<HTMLDivElement>(null);
	const galleryRef = useRef<ProductGalleryHandle>(null);

	const handleJumpTo3D = () => {
		galleryContainerRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
		galleryRef.current?.switchTo3DView();
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
	};

	return (
		<div>
			<main>
				<motion.div
					className="flex flex-col lg:flex-row"
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					<motion.div
						ref={galleryContainerRef}
						variants={itemVariants}
						className="w-full lg:w-3/5"
					>
						<ProductGallery
							ref={galleryRef}
							media={mockProduct.media}
							hotspots={mockProduct.hotspots}
						/>
					</motion.div>
					<motion.div
						variants={itemVariants}
						className="w-full lg:w-2/5 lg:sticky lg:top-0 lg:h-screen"
					>
						<ProductInfo
							product={mockProduct}
							onInquiryClick={() => setIsModalOpen(true)}
							onJumpTo3DClick={handleJumpTo3D}
						/>
					</motion.div>
				</motion.div>
				<ProductSpecs product={mockProduct} />
				<EthicalManufacturing />
				<Recommendations products={mockProduct.compatibleAccessories} />
			</main>
			<InquiryModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				productName={mockProduct.name}
			/>
			<Footer />
		</div>
	);
};

export default App;
