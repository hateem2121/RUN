/**
 * Premium Inquiry Modal Component
 * Styled with ClippedElement for geometric angular cuts and smooth animations
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { ClippedElement } from "./PremiumProductComponents";

interface InquiryModalProps {
	isOpen: boolean;
	onClose: () => void;
	productName: string;
	productId?: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export const InquiryModal: React.FC<InquiryModalProps> = ({
	isOpen,
	onClose,
	productName,
	productId,
}) => {
	const [formState, setFormState] = useState<FormState>("idle");
	const [errorMessage, setErrorMessage] = useState<string>("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormState("submitting");
		setErrorMessage("");

		const formData = new FormData(e.currentTarget);

		try {
			// apiRequest already throws on non-OK responses and returns parsed JSON
			await apiRequest("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.get("companyName"),
					email: formData.get("contactEmail"),
					company: formData.get("companyName"),
					message: `Product Inquiry: ${productName} (ID: ${productId || "N/A"})\n\nEstimated Order Quantity: ${formData.get("moq")}\n\n${formData.get("message") || "No additional message provided"}`,
					source: "product-page",
				}),
			});

			// If we reach here, the request succeeded
			setFormState("success");
		} catch (error: any) {
			setErrorMessage(
				error?.message || "Failed to submit inquiry. Please try again.",
			);
			setFormState("error");
		}
	};

	const handleClose = () => {
		setFormState("idle");
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/70 z-modal flex items-center justify-center p-4 sm:p-6"
					onClick={handleClose}
					aria-modal="true"
					role="dialog"
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
						className="w-full max-w-lg relative"
					>
						<ClippedElement
							className="bg-white p-6 sm:p-8 md:p-12"
							clipAmount={30}
						>
							<button
								onClick={handleClose}
								className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10"
								aria-label="Close"
								data-testid="button-close-modal"
							>
								<X className="w-6 h-6" />
							</button>

							<AnimatePresence mode="wait">
								{formState !== "success" ? (
									<motion.div
										key="form"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
									>
										<h2
											className="text-3xl font-black-display mb-2"
											data-testid="text-inquiry-title"
										>
											Inquiry For:
										</h2>
										<p
											className="text-gray-600 mb-8"
											data-testid="text-product-name"
										>
											{productName}
										</p>

										{formState === "error" && errorMessage && (
											<div
												className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm"
												data-testid="text-error-message"
											>
												{errorMessage}
											</div>
										)}

										<form onSubmit={handleSubmit} className="space-y-6">
											<div>
												<label
													htmlFor="companyName"
													className="block text-xs font-semibold uppercase tracking-widest mb-2"
												>
													Company Name
												</label>
												<input
													type="text"
													id="companyName"
													name="companyName"
													required
													className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white transition-colors"
													data-testid="input-company-name"
												/>
											</div>

											<div>
												<label
													htmlFor="contactEmail"
													className="block text-xs font-semibold uppercase tracking-widest mb-2"
												>
													Contact Email
												</label>
												<input
													type="email"
													id="contactEmail"
													name="contactEmail"
													required
													className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white transition-colors"
													data-testid="input-contact-email"
												/>
											</div>

											<div>
												<label
													htmlFor="moq"
													className="block text-xs font-semibold uppercase tracking-widest mb-2"
												>
													Estimated Order Quantity (MOQ)
												</label>
												<input
													type="number"
													id="moq"
													name="moq"
													min="100"
													placeholder="100"
													required
													className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white transition-colors"
													data-testid="input-moq"
												/>
											</div>

											<div>
												<label
													htmlFor="message"
													className="block text-xs font-semibold uppercase tracking-widest mb-2"
												>
													Message
												</label>
												<textarea
													id="message"
													name="message"
													rows={4}
													placeholder="Describe your customization needs (e.g., branding, material changes, etc.)"
													className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white transition-colors resize-none"
													data-testid="input-message"
												/>
											</div>

											<ClippedElement
												as="button"
												type="submit"
												disabled={formState === "submitting"}
												className="w-full mt-4 bg-black text-white py-4 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:bg-gray-400"
												data-testid="button-submit-inquiry"
											>
												{formState === "submitting"
													? "SENDING..."
													: "SUBMIT INQUIRY"}
											</ClippedElement>
										</form>
									</motion.div>
								) : (
									<motion.div
										key="success"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="text-center py-12"
									>
										<h2
											className="text-3xl font-black-display mb-4"
											data-testid="text-success-title"
										>
											INQUIRY SENT
										</h2>
										<p
											className="text-gray-700 max-w-sm mx-auto mb-8"
											data-testid="text-success-message"
										>
											Thank you for your interest. Our partnership team will
											review your request and be in touch within 24-48 hours.
										</p>
										<ClippedElement
											as="button"
											onClick={handleClose}
											className="bg-black text-white px-10 py-3 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors"
											data-testid="button-close-success"
										>
											CLOSE
										</ClippedElement>
									</motion.div>
								)}
							</AnimatePresence>
						</ClippedElement>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
