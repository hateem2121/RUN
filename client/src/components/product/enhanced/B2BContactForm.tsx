/**
 * Enhanced B2B Contact Form - Style 1 Integration
 * Features: Professional inquiry forms, validation, B2B workflows
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Building,
	Download,
	Loader2,
	Mail,
	MessageSquare,
	Package,
	Phone,
	User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const b2bContactSchema = z.object({
	companyName: z.string().min(2, "Company name is required"),
	contactName: z.string().min(2, "Contact name is required"),
	email: z.string().email("Valid email address is required"),
	phone: z.string().optional(),
	inquiryType: z.enum([
		"wholesale",
		"customization",
		"samples",
		"bulk",
		"partnership",
	]),
	message: z.string().min(10, "Please provide more details about your inquiry"),
	volume: z.string().optional(),
	timeline: z.string().optional(),
});

type B2BContactFormData = z.infer<typeof b2bContactSchema>;

interface B2BContactFormProps {
	productName?: string;
	productId?: string;
	className?: string;
	onSubmit?: (data: B2BContactFormData) => Promise<void>;
	prefilledType?: "samples" | "wholesale" | "customization";
}

const inquiryOptions = [
	{
		value: "wholesale",
		label: "Wholesale Pricing",
		description: "Get bulk pricing information",
	},
	{
		value: "customization",
		label: "Custom Branding",
		description: "Private label and customization",
	},
	{
		value: "samples",
		label: "Sample Request",
		description: "Request product samples",
	},
	{ value: "bulk", label: "Bulk Orders", description: "Large quantity orders" },
	{
		value: "partnership",
		label: "Partnership",
		description: "Distribution partnership",
	},
];

const volumeOptions = [
	"50-100 units",
	"100-500 units",
	"500-1000 units",
	"1000-5000 units",
	"5000+ units",
];

const timelineOptions = [
	"Immediate (1-2 weeks)",
	"Short term (1 month)",
	"Medium term (2-3 months)",
	"Long term (3+ months)",
	"Ongoing relationship",
];

export function B2BContactForm({
	productName,
	productId,
	className,
	onSubmit,
	prefilledType,
}: B2BContactFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	const form = useForm<B2BContactFormData>({
		resolver: zodResolver(b2bContactSchema),
		defaultValues: {
			companyName: "",
			contactName: "",
			email: "",
			phone: "",
			inquiryType: prefilledType || undefined,
			message:
				prefilledType === "samples" && productName
					? `I would like to request samples of the ${productName} for evaluation.`
					: "",
			volume: "",
			timeline: "",
		},
	});

	const handleSubmit = useCallback(
		async (data: B2BContactFormData) => {
			setIsSubmitting(true);

			try {
				// Add product context if available
				const submitData = {
					...data,
					...(productName && { productName }),
					...(productId && { productId }),
					timestamp: new Date().toISOString(),
				};

				if (onSubmit) {
					await onSubmit(submitData);
				} else {
					// Default submission to API
					const response = await fetch("/api/contact", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(submitData),
					});

					if (!response.ok) {
						throw new Error("Failed to submit inquiry");
					}
				}

				toast({
					title: "Inquiry Submitted",
					description:
						"Thank you for your inquiry. Our B2B team will contact you within 24 hours.",
				});

				form.reset();
			} catch (error) {
				toast({
					title: "Submission Failed",
					description: "Please try again or contact us directly.",
					variant: "destructive",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[onSubmit, productName, productId, toast, form],
	);

	const handleRequestSamples = useCallback(() => {
		form.setValue("inquiryType", "samples");
		if (productName) {
			form.setValue(
				"message",
				`I would like to request samples of the ${productName} for evaluation.`,
			);
		}

		// Focus on first empty field
		const companyName = form.getValues("companyName");
		if (!companyName) {
			setTimeout(() => {
				document.getElementById("companyName")?.focus();
			}, 100);
		}
	}, [form, productName]);

	const handleDownloadSpecs = useCallback(() => {
		toast({
			title: "Coming Soon",
			description:
				"Technical specifications download will be available soon. Please contact our sales team for detailed specs.",
		});
	}, [toast]);

	return (
		<div className={cn("space-y-8", className)}>
			{/* Header */}
			<div className="text-center space-y-4">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Ready to Order?
				</h2>
				<p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
					Connect with our B2B team for wholesale pricing, customization
					options, and bulk orders.
					{productName && ` Get detailed information about ${productName}.`}
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-8">
				{/* Contact Information */}
				<div className="space-y-6">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Get in Touch
					</h3>

					<div className="space-y-4">
						<div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100">
									Phone
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									+1 (555) 123-4567
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100">
									Email
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									wholesale@runapparel.com
								</p>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3">
						<Button
							onClick={handleRequestSamples}
							className="w-full"
							variant="default"
						>
							<Package className="w-4 h-4 mr-2" />
							Request Samples
						</Button>

						<Button
							onClick={handleDownloadSpecs}
							className="w-full"
							variant="outline"
						>
							<Download className="w-4 h-4 mr-2" />
							Download Tech Specs
						</Button>
					</div>
				</div>

				{/* Contact Form */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						{/* Company & Contact Name */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<label
									htmlFor="companyName"
									className="text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Company Name *
								</label>
								<div className="relative">
									<Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										id="companyName"
										{...form.register("companyName")}
										className="pl-10"
										placeholder="Your Company"
										disabled={isSubmitting}
									/>
								</div>
								{form.formState.errors.companyName && (
									<p className="text-xs text-red-600 dark:text-red-400">
										{form.formState.errors.companyName.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="contactName"
									className="text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Contact Name *
								</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										id="contactName"
										{...form.register("contactName")}
										className="pl-10"
										placeholder="Your Name"
										disabled={isSubmitting}
									/>
								</div>
								{form.formState.errors.contactName && (
									<p className="text-xs text-red-600 dark:text-red-400">
										{form.formState.errors.contactName.message}
									</p>
								)}
							</div>
						</div>

						{/* Email & Phone */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<label
									htmlFor="email"
									className="text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Email Address *
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										id="email"
										type="email"
										{...form.register("email")}
										className="pl-10"
										placeholder="contact@company.com"
										disabled={isSubmitting}
									/>
								</div>
								{form.formState.errors.email && (
									<p className="text-xs text-red-600 dark:text-red-400">
										{form.formState.errors.email.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="phone"
									className="text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Phone Number
								</label>
								<div className="relative">
									<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										id="phone"
										type="tel"
										{...form.register("phone")}
										className="pl-10"
										placeholder="+1 (555) 123-4567"
										disabled={isSubmitting}
									/>
								</div>
							</div>
						</div>

						{/* Inquiry Type */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Inquiry Type *
							</label>
							<Select
								onValueChange={(value) =>
									form.setValue("inquiryType", value as any)
								}
								defaultValue={form.getValues("inquiryType")}
								disabled={isSubmitting}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select inquiry type" />
								</SelectTrigger>
								<SelectContent>
									{inquiryOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div>
												<div className="font-medium">{option.label}</div>
												<div className="text-xs text-gray-500">
													{option.description}
												</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{form.formState.errors.inquiryType && (
								<p className="text-xs text-red-600 dark:text-red-400">
									{form.formState.errors.inquiryType.message}
								</p>
							)}
						</div>

						{/* Volume & Timeline */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Expected Volume
								</label>
								<Select
									onValueChange={(value) => form.setValue("volume", value)}
									disabled={isSubmitting}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select volume" />
									</SelectTrigger>
									<SelectContent>
										{volumeOptions.map((volume) => (
											<SelectItem key={volume} value={volume}>
												{volume}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Timeline
								</label>
								<Select
									onValueChange={(value) => form.setValue("timeline", value)}
									disabled={isSubmitting}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select timeline" />
									</SelectTrigger>
									<SelectContent>
										{timelineOptions.map((timeline) => (
											<SelectItem key={timeline} value={timeline}>
												{timeline}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Message */}
						<div className="space-y-2">
							<label
								htmlFor="message"
								className="text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Message *
							</label>
							<div className="relative">
								<MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
								<Textarea
									id="message"
									{...form.register("message")}
									className="pl-10 min-h-[100px]"
									placeholder="Please provide details about your requirements..."
									disabled={isSubmitting}
								/>
							</div>
							{form.formState.errors.message && (
								<p className="text-xs text-red-600 dark:text-red-400">
									{form.formState.errors.message.message}
								</p>
							)}
						</div>

						{/* Submit Button */}
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							)}
							Send Inquiry
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}

export default B2BContactForm;
