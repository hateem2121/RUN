import type React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface ManufacturingFormWrapperProps {
	title: string;
	description: string;
	children: React.ReactNode;
	onSubmit: (e: React.FormEvent) => void;
	isLoading?: boolean;
	submitLabel: string;
	showSubmitButton?: boolean;
	className?: string;
}

/**
 * Standardized form wrapper for manufacturing management components
 * Provides consistent layout and structure across all forms
 */
export function ManufacturingFormWrapper({
	title,
	description,
	children,
	onSubmit,
	isLoading = false,
	submitLabel,
	showSubmitButton = true,
	className = "",
}: ManufacturingFormWrapperProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					{children}
					{showSubmitButton && (
						<Button type="submit" disabled={isLoading} className="w-full">
							{isLoading ? "Processing..." : submitLabel}
						</Button>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
