import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
	apiRequest,
	getOptimizedQueryOptions,
	getQueryClient,
	queryKeys,
} from "@/lib/queryClient";

interface Inquiry {
	id: number;
	name: string;
	email: string;
	company: string | null;
	phone: string | null;
	country: string | null;
	preferredPlatform: string | null;
	message: string;
	source: string;
	status: string;
	submittedAt: string;
	respondedAt: string | null;
	adminNotes: string | null;
	assignedTo: string | null;
}

interface InquiryStats {
	byStatus: Record<string, number>;
	bySource: Record<string, number>;
	recentCount: number;
}

const statusColors: Record<string, string> = {
	new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	read: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
	responded:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	archived: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export default function InquiryManagement() {
	const { toast } = useToast();
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
	const [deleteInquiryId, setDeleteInquiryId] = useState<number | null>(null);
	const [editingStatus, setEditingStatus] = useState<{
		id: number;
		status: string;
		notes: string;
	} | null>(null);

	// URL Synchronization
	const [location, setLocation] = useLocation();
	const [isInitialized, setIsInitialized] = useState(false);

	// Initialize state from URL on mount
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		if (params.has("page")) setPage(Number(params.get("page")));
		if (params.has("status")) setStatusFilter(params.get("status") || "all");
		if (params.has("search")) setSearchQuery(params.get("search") || "");

		setIsInitialized(true);
	}, []);

	// Sync state to URL
	useEffect(() => {
		if (!isInitialized) return;

		const params = new URLSearchParams();

		if (page > 1) params.set("page", page.toString());
		if (statusFilter !== "all") params.set("status", statusFilter);
		if (searchQuery) params.set("search", searchQuery);

		const newSearch = params.toString();
		const currentSearch = window.location.search.substring(1);

		if (newSearch !== currentSearch) {
			setLocation(location + (newSearch ? "?" + newSearch : ""));
		}
	}, [page, statusFilter, searchQuery, isInitialized, location, setLocation]);

	const { data: stats } = useQuery<InquiryStats>({
		queryKey: queryKeys.inquiries.stats(),
		queryFn: async () => await apiRequest("/api/admin/inquiries/stats"),
		...getOptimizedQueryOptions("live"),
	});

	const { data: inquiriesData, isLoading } = useQuery({
		queryKey: queryKeys.inquiries.list(page, statusFilter, searchQuery),
		queryFn: async () => {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "20",
				...(statusFilter !== "all" && { status: statusFilter }),
				...(searchQuery && { search: searchQuery }),
			});
			const url = `/api/admin/inquiries?${params}`;
			return await apiRequest(url);
		},
		...getOptimizedQueryOptions("live"),
	});

	const updateStatusMutation = useMutation({
		mutationFn: async ({
			id,
			status,
			adminNotes,
		}: {
			id: number;
			status: string;
			adminNotes?: string;
		}) => {
			return await apiRequest(`/api/admin/inquiries/${id}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status, adminNotes }),
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey[0];
					return (
						typeof key === "string" && key.startsWith("/api/admin/inquiries")
					);
				},
			});
			setEditingStatus(null);
			toast({
				title: "Status Updated",
				description: "Inquiry status has been updated successfully.",
			});
		},
		onError: (error: Error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update inquiry status.",
				variant: "destructive",
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			return await apiRequest(`/api/admin/inquiries/${id}`, {
				method: "DELETE",
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey[0];
					return (
						typeof key === "string" && key.startsWith("/api/admin/inquiries")
					);
				},
			});
			setDeleteInquiryId(null);
			toast({
				title: "Inquiry Deleted",
				description: "The inquiry has been permanently deleted.",
			});
		},
		onError: (error: Error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete inquiry.",
				variant: "destructive",
			});
		},
	});

	const inquiries = inquiriesData?.inquiries || [];
	const totalPages = inquiriesData?.totalPages || 1;

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
	};

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Inquiry Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-2">
						Manage contact form submissions and inquiries
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card data-testid="card-stats-new">
						<CardHeader className="pb-2">
							<CardDescription>New Inquiries</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.byStatus?.new || 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card data-testid="card-stats-read">
						<CardHeader className="pb-2">
							<CardDescription>Read</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.byStatus?.read || 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card data-testid="card-stats-responded">
						<CardHeader className="pb-2">
							<CardDescription>Responded</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.byStatus?.responded || 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card data-testid="card-stats-recent">
						<CardHeader className="pb-2">
							<CardDescription>Last 7 Days</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.recentCount || 0}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle>Filters</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSearch}
							className="flex flex-col md:flex-row gap-4"
						>
							<div className="flex-1">
								<Input
									data-testid="input-search"
									placeholder="Search by name, email, or message..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Select
								value={statusFilter}
								onValueChange={(value) => {
									setStatusFilter(value);
									setPage(1);
								}}
							>
								<SelectTrigger
									className="w-full md:w-48"
									data-testid="select-status-filter"
								>
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="new">New</SelectItem>
									<SelectItem value="read">Read</SelectItem>
									<SelectItem value="responded">Responded</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>
							<Button type="submit" data-testid="button-search">
								<Search className="w-4 h-4 mr-2" />
								Search
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Inquiries Table */}
				<Card>
					<CardHeader>
						<CardTitle>Inquiries ({inquiriesData?.total || 0})</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
								<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
									Loading inquiries...
								</p>
							</div>
						) : inquiries.length === 0 ? (
							<div
								className="text-center py-8 text-gray-500"
								data-testid="text-empty-state"
							>
								No inquiries found
							</div>
						) : (
							<>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>ID</TableHead>
												<TableHead>Name</TableHead>
												<TableHead>Email</TableHead>
												<TableHead>Company</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Submitted</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{inquiries.map((inquiry: Inquiry) => (
												<TableRow
													key={inquiry.id}
													data-testid={`row-inquiry-${inquiry.id}`}
												>
													<TableCell className="font-mono text-sm">
														{inquiry.id}
													</TableCell>
													<TableCell>{inquiry.name}</TableCell>
													<TableCell>{inquiry.email}</TableCell>
													<TableCell>{inquiry.company || "-"}</TableCell>
													<TableCell>
														<button
															onClick={() =>
																setEditingStatus({
																	id: inquiry.id,
																	status: inquiry.status,
																	notes: inquiry.adminNotes || "",
																})
															}
															data-testid={`button-status-${inquiry.id}`}
														>
															<Badge
																className={statusColors[inquiry.status] || ""}
															>
																{inquiry.status}
															</Badge>
														</button>
													</TableCell>
													<TableCell>
														{new Date(inquiry.submittedAt).toLocaleDateString()}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																size="sm"
																variant="ghost"
																onClick={() => setSelectedInquiry(inquiry)}
																data-testid={`button-view-${inquiry.id}`}
															>
																<Eye className="w-4 h-4" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => setDeleteInquiryId(inquiry.id)}
																data-testid={`button-delete-${inquiry.id}`}
															>
																<Trash2 className="w-4 h-4 text-red-600" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								{/* Pagination */}
								<div className="flex items-center justify-between mt-4">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Page {page} of {totalPages}
									</p>
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
											data-testid="button-prev-page"
										>
											<ChevronLeft className="w-4 h-4" />
											Previous
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												setPage((p) => Math.min(totalPages, p + 1))
											}
											disabled={page >= totalPages}
											data-testid="button-next-page"
										>
											Next
											<ChevronRight className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Detail Dialog */}
				<Dialog
					open={!!selectedInquiry}
					onOpenChange={() => setSelectedInquiry(null)}
				>
					<DialogContent
						className="max-w-2xl"
						data-testid="dialog-inquiry-detail"
					>
						<DialogHeader>
							<DialogTitle>Inquiry Details</DialogTitle>
							<DialogDescription>
								Submitted on{" "}
								{selectedInquiry &&
									new Date(selectedInquiry.submittedAt).toLocaleString()}
							</DialogDescription>
						</DialogHeader>
						{selectedInquiry && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Name</Label>
										<p className="font-medium" data-testid="text-detail-name">
											{selectedInquiry.name}
										</p>
									</div>
									<div>
										<Label>Email</Label>
										<p className="font-medium" data-testid="text-detail-email">
											{selectedInquiry.email}
										</p>
									</div>
									<div>
										<Label>Company</Label>
										<p className="font-medium">
											{selectedInquiry.company || "-"}
										</p>
									</div>
									<div>
										<Label>Phone</Label>
										<p className="font-medium">
											{selectedInquiry.phone || "-"}
										</p>
									</div>
									<div>
										<Label>Country</Label>
										<p
											className="font-medium"
											data-testid="text-detail-country"
										>
											{selectedInquiry.country || "-"}
										</p>
									</div>
									<div>
										<Label>Preferred Platform</Label>
										<p className="font-medium">
											{selectedInquiry.preferredPlatform || "-"}
										</p>
									</div>
									<div>
										<Label>Status</Label>
										<Badge
											className={statusColors[selectedInquiry.status] || ""}
										>
											{selectedInquiry.status}
										</Badge>
									</div>
								</div>
								<div>
									<Label>Message</Label>
									<p
										className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-wrap"
										data-testid="text-detail-message"
									>
										{selectedInquiry.message}
									</p>
								</div>
								{selectedInquiry.adminNotes && (
									<div>
										<Label>Admin Notes</Label>
										<p className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md whitespace-pre-wrap">
											{selectedInquiry.adminNotes}
										</p>
									</div>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Status Edit Dialog */}
				<Dialog
					open={!!editingStatus}
					onOpenChange={() => setEditingStatus(null)}
				>
					<DialogContent data-testid="dialog-edit-status">
						<DialogHeader>
							<DialogTitle>Update Inquiry Status</DialogTitle>
						</DialogHeader>
						{editingStatus && (
							<div className="space-y-4">
								<div>
									<Label>Status</Label>
									<Select
										value={editingStatus.status}
										onValueChange={(value) =>
											setEditingStatus({ ...editingStatus, status: value })
										}
									>
										<SelectTrigger data-testid="select-edit-status">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="new">New</SelectItem>
											<SelectItem value="read">Read</SelectItem>
											<SelectItem value="responded">Responded</SelectItem>
											<SelectItem value="archived">Archived</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Admin Notes (Optional)</Label>
									<Textarea
										data-testid="textarea-admin-notes"
										placeholder="Add notes about this inquiry..."
										value={editingStatus.notes}
										onChange={(e) =>
											setEditingStatus({
												...editingStatus,
												notes: e.target.value,
											})
										}
										rows={4}
									/>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() => setEditingStatus(null)}
										data-testid="button-cancel-edit"
									>
										Cancel
									</Button>
									<Button
										onClick={() =>
											updateStatusMutation.mutate({
												id: editingStatus.id,
												status: editingStatus.status,
												adminNotes: editingStatus.notes || undefined,
											})
										}
										disabled={updateStatusMutation.isPending}
										data-testid="button-save-status"
									>
										{updateStatusMutation.isPending ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Delete Confirmation */}
				<AlertDialog
					open={!!deleteInquiryId}
					onOpenChange={() => setDeleteInquiryId(null)}
				>
					<AlertDialogContent data-testid="dialog-delete-confirm">
						<AlertDialogHeader>
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This will permanently delete this inquiry. This action cannot be
								undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel data-testid="button-cancel-delete">
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() =>
									deleteInquiryId && deleteMutation.mutate(deleteInquiryId)
								}
								className="bg-red-600 hover:bg-red-700"
								data-testid="button-confirm-delete"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
