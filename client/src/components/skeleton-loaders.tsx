import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const MetricCardSkeleton = React.memo(function MetricCardSkeleton() {
	return (
		<Card className="overflow-hidden border-green-200 bg-gradient-to-br from-white to-green-50">
			<CardContent className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div className="p-3 bg-green-100 rounded-full animate-pulse">
						<div className="w-6 h-6 bg-green-300 rounded" />
					</div>
					<div className="w-12 h-6 bg-green-100 rounded-full animate-pulse" />
				</div>

				<div className="space-y-2">
					<div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
					<div className="flex items-baseline gap-1">
						<div className="h-8 bg-green-200 rounded animate-pulse w-16" />
						<div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
					</div>
					<div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
				</div>
			</CardContent>
		</Card>
	);
});

export const ProcessCardSkeleton = React.memo(function ProcessCardSkeleton() {
	return (
		<Card className="border-blue-200 overflow-hidden bg-gradient-to-br from-white to-blue-50">
			<CardContent className="p-6">
				<div className="flex items-start gap-4 mb-4">
					<div className="p-3 bg-blue-100 rounded-lg animate-pulse">
						<div className="w-6 h-6 bg-blue-300 rounded" />
					</div>
					<div className="flex-1 space-y-2">
						<div className="h-5 bg-gray-200 rounded animate-pulse w-2/3" />
						<div className="h-4 bg-blue-100 rounded animate-pulse w-20" />
					</div>
				</div>

				<div className="space-y-2">
					<div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
					<div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
				</div>

				<div className="mt-4 space-y-2">
					<div className="flex justify-between">
						<div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
						<div className="h-4 bg-blue-200 rounded animate-pulse w-12" />
					</div>
					<div className="h-2 bg-gray-200 rounded-full animate-pulse" />
				</div>
			</CardContent>
		</Card>
	);
});

export const InnovationCardSkeleton = React.memo(
	function InnovationCardSkeleton() {
		return (
			<div className="relative">
				<div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg blur-xl opacity-20" />
				<Card className="relative border-purple-200 bg-gradient-to-br from-white to-purple-50">
					<CardContent className="p-6">
						<div className="flex items-start gap-4 mb-4">
							<div className="p-3 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-lg animate-pulse">
								<div className="w-6 h-6 bg-purple-300 rounded" />
							</div>
							<div className="flex-1 space-y-2">
								<div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
								<div className="h-4 bg-purple-100 rounded animate-pulse w-24" />
							</div>
						</div>

						<div className="space-y-2">
							<div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
							<div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
							<div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
						</div>

						<div className="mt-4 flex items-center gap-2">
							<div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
							<div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	},
);

export const DashboardStatSkeleton = React.memo(
	function DashboardStatSkeleton() {
		return (
			<div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
				<div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2 animate-pulse" />
				<div className="h-8 bg-gray-300 rounded animate-pulse w-16 mx-auto mb-1" />
				<div className="h-4 bg-gray-200 rounded animate-pulse w-24 mx-auto" />
			</div>
		);
	},
);

export const ChartSkeleton = React.memo(function ChartSkeleton() {
	return (
		<div className="h-96 bg-gray-100 rounded-lg animate-pulse p-8">
			<div className="h-full bg-gray-200 rounded flex items-center justify-center">
				<div className="text-gray-400">
					<div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2" />
					<div className="h-4 bg-gray-300 rounded w-32" />
				</div>
			</div>
		</div>
	);
});

export const TableRowSkeleton = React.memo(function TableRowSkeleton() {
	return (
		<tr className="border-b">
			<td className="p-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
			</td>
			<td className="p-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
			</td>
			<td className="p-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
			</td>
			<td className="p-4">
				<div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
			</td>
		</tr>
	);
});
