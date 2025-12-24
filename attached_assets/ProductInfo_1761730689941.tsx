import type React from "react";
import type { Product } from "../types";
import Breadcrumb from "./Breadcrumb";
import ClippedElement from "./ClippedElement";
import { AsteriskIcon, CubeIcon } from "./Icons";

interface ProductInfoProps {
	product: Product;
	onInquiryClick: () => void;
	onJumpTo3DClick: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
	product,
	onInquiryClick,
	onJumpTo3DClick,
}) => {
	return (
		<div className="w-full p-6 sm:p-10 lg:p-16 h-full flex flex-col justify-center lg:overflow-y-auto">
			<div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
				<Breadcrumb category={product.category} productName={product.name} />

				<h1 className="text-4xl md:text-5xl font-black-display my-4">
					{product.name}
				</h1>
				<p className="text-gray-500 mb-6">{product.sku}</p>

				<p className="text-gray-700 leading-relaxed">
					{product.longDescription}
				</p>

				<div className="my-8 text-left">
					<button
						onClick={onJumpTo3DClick}
						className="inline-flex items-center group text-sm font-semibold text-gray-600 hover:text-black transition-colors"
					>
						<CubeIcon className="w-5 h-5 mr-2 text-gray-400 group-hover:text-black transition-colors" />
						Jump to 3D View
					</button>
				</div>

				<div className="border-t border-b border-gray-200 py-6 mb-8">
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center">
							<AsteriskIcon className="w-4 h-4 mr-2 text-gray-400" />
							<span>MOQ: {product.minOrderQty} Units</span>
						</div>
						<div className="flex items-center">
							<AsteriskIcon className="w-4 h-4 mr-2 text-gray-400" />
							<span>Lead Time: {product.leadTime}</span>
						</div>
					</div>
				</div>

				<ClippedElement
					as="button"
					onClick={onInquiryClick}
					className="w-full bg-black text-white py-4 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors"
				>
					REQUEST A QUOTE
				</ClippedElement>
				<p className="text-center text-xs text-gray-500 mt-4">
					Pricing is based on volume and customization.
				</p>
			</div>
		</div>
	);
};

export default ProductInfo;
