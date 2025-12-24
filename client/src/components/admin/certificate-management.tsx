import type { Certificate } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	Award,
	BarChart3,
	Calendar,
	CheckCircle,
	Clock,
	Copy,
	Edit2,
	ExternalLink,
	FileText,
	Grid3X3,
	Image,
	List,
	MoreVertical,
	Plus,
	Search,
	Settings,
	Shield,
	Table,
	Trash2,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	EnhancedDialog,
	EnhancedDialogBody,
	EnhancedDialogContent,
	EnhancedDialogFooter,
	EnhancedDialogHeader,
	EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

const getCertificateTypeIcon = (type: string | undefined) => {
	if (!type) return <FileText className="w-4 h-4" />;

	switch (type.toLowerCase()) {
		case "sustainability":
			return <Award className="w-4 h-4" />;
		case "compliance":
			return <Shield className="w-4 h-4" />;
		case "quality":
			return <CheckCircle className="w-4 h-4" />;
		case "safety":
			return <Shield className="w-4 h-4" />;
		case "environmental":
			return <Award className="w-4 h-4" />;
		default:
			return <FileText className="w-4 h-4" />;
	}
};

interface CertificateListProps {
	viewMode: "grid" | "list" | "detailed";
	isLoading: boolean;
	certificates: Certificate[];
	selectedCertificates: number[];
	onSelect: (ids: number[]) => void;
	onEdit: (certificate: Certificate) => void;
	onDuplicate: (certificate: Certificate) => void;
	onDelete: (id: number) => void;
}

const CertificateList = ({
	viewMode,
	isLoading,
	certificates,
	selectedCertificates,
	onSelect,
	onEdit,
	onDuplicate,
	onDelete,
}: CertificateListProps) => {
	const toggleSelectAll = () => {
		if (selectedCertificates.length === (certificates?.length || 0)) {
			onSelect([]);
		} else {
			onSelect(certificates?.map((cert) => cert.id) || []);
		}
	};

	const handleCheckboxChange = (checked: boolean, id: number) => {
		if (checked) {
			onSelect([...selectedCertificates, id]);
		} else {
			onSelect(selectedCertificates.filter((certId) => certId !== id));
		}
	};

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Array.from({ length: 6 }, (_, i) => (
					<Card key={`skeleton-${i}`} className="animate-pulse">
						<CardContent className="p-6">
							<div className="h-6 bg-neutral-200 rounded mb-4"></div>
							<div className="h-4 bg-neutral-200 rounded mb-2"></div>
							<div className="h-4 bg-neutral-200 rounded w-3/4"></div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!certificates || certificates.length === 0) {
		return (
			<Card>
				<CardContent className="p-12 text-center">
					<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
						<Award className="w-8 h-8 text-neutral-400" />
					</div>
					<h3 className="text-lg font-medium text-neutral-900 mb-2">
						No certificates found
					</h3>
					<p className="text-neutral-500 mb-4">
						Try adjusting your filters or search terms.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div>
			{/* Select All Checkbox */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						checked={
							selectedCertificates.length === certificates.length &&
							certificates.length > 0
						}
						onCheckedChange={toggleSelectAll}
					/>
					<Label className="text-sm text-neutral-600">
						Select all {certificates.length} certificate
						{certificates.length === 1 ? "" : "s"}
					</Label>
				</div>
				<div className="text-sm text-neutral-500">
					Showing {certificates.length} certificates
				</div>
			</div>

			{/* Certificate Grid/List */}
			{viewMode === "grid" && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{certificates.map((certificate) => (
						<Card
							key={certificate.id}
							className={`group relative transition-all duration-200 hover:shadow-lg ${selectedCertificates.includes(certificate.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
						>
							<CardContent className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center space-x-3">
										<Checkbox
											checked={selectedCertificates.includes(certificate.id)}
											onCheckedChange={(checked) =>
												handleCheckboxChange(checked as boolean, certificate.id)
											}
										/>
										<div className="flex items-center space-x-2">
											{getCertificateTypeIcon(certificate.type || undefined)}
											<div>
												<h3 className="font-semibold text-lg text-neutral-900">
													{certificate.name}
												</h3>
												<Badge variant="outline" className="text-xs mt-1">
													{certificate.status
														? certificate.status.charAt(0).toUpperCase() +
															certificate.status.slice(1)
														: "No Type"}
												</Badge>
											</div>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => onEdit(certificate)}>
												<Edit2 className="mr-2 h-4 w-4" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onDuplicate(certificate)}
											>
												<Copy className="mr-2 h-4 w-4" />
												Duplicate
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onDelete(certificate.id)}
												className="text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Badge
											variant={certificate.isActive ? "default" : "secondary"}
										>
											{certificate.isActive ? "Active" : "Inactive"}
										</Badge>
									</div>

									{certificate.issuingOrganization && (
										<p className="text-sm text-neutral-600">
											<strong>Issued by:</strong>{" "}
											{certificate.issuingOrganization}
										</p>
									)}

									{certificate.description && (
										<p className="text-sm text-neutral-600 line-clamp-2">
											{certificate.description}
										</p>
									)}

									<div className="text-sm text-neutral-500">
										<p>
											<strong>Created:</strong>{" "}
											{certificate.createdAt
												? new Date(certificate.createdAt).toLocaleDateString()
												: "N/A"}
										</p>
									</div>

									{certificate.documentId && (
										<a
											href={`/api/media/${certificate.documentId}/content`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
										>
											<ExternalLink className="mr-1 h-3 w-3" />
											View Document
										</a>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{viewMode === "list" && (
				<div className="space-y-2">
					{certificates.map((certificate, index) => (
						<div
							key={certificate.id}
							className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 hover:bg-neutral-50 ${index % 2 === 0 ? "bg-neutral-25" : "bg-white"} ${selectedCertificates.includes(certificate.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
						>
							<Checkbox
								checked={selectedCertificates.includes(certificate.id)}
								onCheckedChange={(checked) =>
									handleCheckboxChange(checked as boolean, certificate.id)
								}
							/>

							<div className="flex items-center space-x-3 flex-1">
								{getCertificateTypeIcon(certificate.type || undefined)}
								<div className="flex-1 min-w-0">
									<div className="flex items-center space-x-2 mb-1">
										<h3 className="font-medium text-neutral-900 truncate">
											{certificate.name}
										</h3>
										<Badge variant="outline" className="text-xs">
											{certificate.status
												? certificate.status.charAt(0).toUpperCase() +
													certificate.status.slice(1)
												: "No Type"}
										</Badge>
									</div>
									<p className="text-sm text-neutral-600 truncate">
										{certificate.issuingOrganization &&
											`Issued by: ${certificate.issuingOrganization}`}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-2">
								<Badge
									variant={certificate.isActive ? "default" : "secondary"}
									className="text-xs"
								>
									{certificate.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>

							<div className="text-sm text-neutral-500 min-w-0 w-24 sm:w-28 lg:w-32 text-right">
								{certificate.createdAt
									? new Date(certificate.createdAt).toLocaleDateString()
									: "N/A"}
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => onEdit(certificate)}>
										<Edit2 className="mr-2 h-4 w-4" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onDuplicate(certificate)}>
										<Copy className="mr-2 h-4 w-4" />
										Duplicate
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => onDelete(certificate.id)}
										className="text-red-600"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					))}
				</div>
			)}

			{viewMode === "detailed" && (
				<div className="space-y-4">
					{certificates.map((certificate) => (
						<Card
							key={certificate.id}
							className={`transition-all duration-200 hover:shadow-lg ${selectedCertificates.includes(certificate.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
						>
							<CardContent className="p-6">
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									<div className="lg:col-span-2">
										<div className="flex items-start space-x-4 mb-4">
											<Checkbox
												checked={selectedCertificates.includes(certificate.id)}
												onCheckedChange={(checked) =>
													handleCheckboxChange(
														checked as boolean,
														certificate.id,
													)
												}
											/>
											<div className="flex-1">
												<div className="flex items-center space-x-3 mb-2">
													{getCertificateTypeIcon(
														certificate.type || undefined,
													)}
													<h3 className="text-xl font-semibold text-neutral-900">
														{certificate.name}
													</h3>
												</div>
												<div className="flex items-center space-x-2 mb-3">
													<Badge variant="outline">
														{certificate.status
															? certificate.status.charAt(0).toUpperCase() +
																certificate.status.slice(1)
															: "No Type"}
													</Badge>
													<Badge
														variant={
															certificate.isActive ? "default" : "secondary"
														}
													>
														{certificate.isActive ? "Active" : "Inactive"}
													</Badge>
												</div>

												{certificate.issuingOrganization && (
													<p className="text-neutral-600 mb-2">
														<strong>Issued by:</strong>{" "}
														{certificate.issuingOrganization}
													</p>
												)}

												{certificate.description && (
													<p className="text-neutral-600 mb-4">
														{certificate.description}
													</p>
												)}

												<div className="grid grid-cols-2 gap-4 text-sm">
													<div>
														<span className="font-medium text-neutral-700">
															Created:
														</span>
														<p className="text-neutral-600">
															{certificate.createdAt
																? new Date(
																		certificate.createdAt,
																	).toLocaleDateString()
																: "N/A"}
														</p>
													</div>
													<div>
														<span className="font-medium text-neutral-700">
															Type:
														</span>
														<p className="text-neutral-600">
															{certificate.status}
														</p>
													</div>
												</div>

												{certificate.documentId && (
													<div className="mt-4">
														<a
															href={`/api/media/${certificate.documentId}/content`}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center text-blue-600 hover:text-blue-800"
														>
															<ExternalLink className="mr-2 h-4 w-4" />
															View Certificate Document
														</a>
													</div>
												)}
											</div>
										</div>
									</div>

									<div className="flex flex-col space-y-2">
										<Button
											onClick={() => onEdit(certificate)}
											className="w-full"
										>
											<Edit2 className="mr-2 h-4 w-4" />
											Edit
										</Button>
										<Button
											onClick={() => onDuplicate(certificate)}
											variant="outline"
											className="w-full"
										>
											<Copy className="mr-2 h-4 w-4" />
											Duplicate
										</Button>
										<DeleteConfirmationDialog
											title="Delete Certificate"
											description={`Are you sure you want to delete "${certificate.name}"? This action cannot be undone.`}
											confirmText="Delete"
											onConfirm={() => onDelete(certificate.id)}
											triggerClassName="w-full bg-red-600 hover:bg-red-700 text-white"
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
};

interface CertificateInsightsProps {
	analytics: any;
	onCreate: () => void;
}

const CertificateInsights = ({
	analytics,
	onCreate,
}: CertificateInsightsProps) => {
	if (!analytics) return null;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Certificate Management Insights</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{analytics.expired > 0 && (
							<div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
								<div className="flex items-start space-x-3">
									<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
									<div className="flex-1">
										<h4 className="font-medium text-neutral-900 mb-1">
											Expired Certificates
										</h4>
										<p className="text-neutral-600 mb-2">
											You have {analytics.expired} expired certificate
											{analytics.expired === 1 ? "" : "s"} that need renewal.
										</p>
										<p className="text-sm font-medium text-neutral-700">
											Recommended Action: Review and renew expired certificates
										</p>
									</div>
								</div>
							</div>
						)}

						{analytics.expiringSoon > 0 && (
							<div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
								<div className="flex items-start space-x-3">
									<Clock className="w-5 h-5 text-blue-600 mt-0.5" />
									<div className="flex-1">
										<h4 className="font-medium text-neutral-900 mb-1">
											Certificates Expiring Soon
										</h4>
										<p className="text-neutral-600 mb-2">
											{analytics.expiringSoon} certificate
											{analytics.expiringSoon === 1 ? "" : "s"} will expire
											within the next 3 months.
										</p>
										<p className="text-sm font-medium text-neutral-700">
											Recommended Action: Plan renewal process for expiring
											certificates
										</p>
									</div>
								</div>
							</div>
						)}

						{analytics.total > 0 &&
							(analytics.active / analytics.total) * 100 < 80 && (
								<div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
									<div className="flex items-start space-x-3">
										<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
										<div className="flex-1">
											<h4 className="font-medium text-neutral-900 mb-1">
												Low Active Certificate Ratio
											</h4>
											<p className="text-neutral-600 mb-2">
												Only{" "}
												{Math.round((analytics.active / analytics.total) * 100)}
												% of your certificates are currently active.
											</p>
											<p className="text-sm font-medium text-neutral-700">
												Recommended Action: Review inactive certificates and
												activate if needed
											</p>
										</div>
									</div>
								</div>
							)}

						{analytics.total === 0 && (
							<div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
								<div className="flex items-start space-x-3">
									<Award className="w-5 h-5 text-blue-600 mt-0.5" />
									<div className="flex-1">
										<h4 className="font-medium text-neutral-900 mb-1">
											No Certificates Found
										</h4>
										<p className="text-neutral-600 mb-2">
											Start building your certification portfolio for better
											compliance and sustainability.
										</p>
										<p className="text-sm font-medium text-neutral-700">
											Recommended Action: Add your first certificate to begin
											tracking
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Button
							onClick={onCreate}
							className="h-auto p-4 flex-col items-start"
						>
							<Plus className="w-5 h-5 mb-2" />
							<span className="font-medium">Add New Certificate</span>
							<span className="text-xs text-neutral-500 mt-1">
								Create a new certification record
							</span>
						</Button>
						<Button
							variant="outline"
							className="h-auto p-4 flex-col items-start"
						>
							<Calendar className="w-5 h-5 mb-2" />
							<span className="font-medium">Schedule Renewals</span>
							<span className="text-xs text-neutral-500 mt-1">
								Set up automatic renewal reminders
							</span>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

const CertificateAnalytics = ({ analytics }: { analytics: any }) => {
	if (!analytics) return null;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2 mb-2">
							<Award className="w-5 h-5 text-blue-600" />
							<span className="text-sm font-medium text-neutral-600">
								Total Certificates
							</span>
						</div>
						<div className="text-2xl font-bold text-neutral-900">
							{analytics.total}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2 mb-2">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-sm font-medium text-neutral-600">
								Active
							</span>
						</div>
						<div className="text-2xl font-bold text-green-600">
							{analytics.active}
						</div>
						<div className="text-xs text-neutral-500">
							{analytics.total > 0
								? Math.round((analytics.active / analytics.total) * 100)
								: 0}
							% of total
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2 mb-2">
							<AlertTriangle className="w-5 h-5 text-yellow-600" />
							<span className="text-sm font-medium text-neutral-600">
								Expiring Soon
							</span>
						</div>
						<div className="text-2xl font-bold text-yellow-600">
							{analytics.expiringSoon}
						</div>
						<div className="text-xs text-neutral-500">Within 3 months</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2 mb-2">
							<X className="w-5 h-5 text-red-600" />
							<span className="text-sm font-medium text-neutral-600">
								Expired
							</span>
						</div>
						<div className="text-2xl font-bold text-red-600">
							{analytics.expired}
						</div>
						<div className="text-xs text-neutral-500">Require renewal</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Certificate Types Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Object.entries(analytics.typeDistribution).map(([type, count]) => (
							<div key={type} className="flex items-center justify-between">
								<span className="text-sm font-medium capitalize">{type}</span>
								<div className="flex items-center space-x-2">
									<div className="w-32 bg-neutral-200 rounded-full h-2">
										<div
											className="bg-blue-600 h-2 rounded-full"
											style={{
												width: `${((count as number) / analytics.total) * 100}%`,
											}}
										/>
									</div>
									<span className="text-sm text-neutral-600 w-8 text-right">
										{count as number}
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Top Certificate Issuers</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Object.entries(analytics.issuingBodyDistribution)
							.sort(([, a], [, b]) => (b as number) - (a as number))
							.slice(0, 5)
							.map(([issuer, count]) => (
								<div
									key={issuer}
									className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
								>
									<span className="font-medium">{issuer}</span>
									<Badge variant="outline">
										{count as number} certificate
										{(count as number) === 1 ? "" : "s"}
									</Badge>
								</div>
							))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default function CertificateManagement() {
	// Core state management
	const [formData, setFormData] = useState({
		name: "",
		type: "",
		issuingOrganization: "",
		description: "",
		documentId: null as number | null,
		imageId: null as number | null,
		documentUrl: "",
		imageUrl: "",
		isActive: true,
	});

	const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

	const [editingCertificate, setEditingCertificate] =
		useState<Certificate | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
	const [selectedCertificates, setSelectedCertificates] = useState<number[]>(
		[],
	);

	// Search and filtering state
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [sortBy, setSortBy] = useState("name");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [viewMode, setViewMode] = useState<"grid" | "list" | "detailed">(
		"grid",
	);
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [currentTab, setCurrentTab] = useState("certificates");

	const { toast } = useToast();

	const { data: certificates, isPending: isLoading } = useQuery<Certificate[]>({
		queryKey: ["/api/certificates"],
	});

	// Helper function to sanitize form data (convert empty strings to null)
	const sanitizeCertificateData = (data: any) => {
		return {
			...data,
			documentUrl: data.documentUrl?.trim() || null,
			imageUrl: data.imageUrl?.trim() || null,
			type: data.type?.trim() || null,
			issuingOrganization: data.issuingOrganization?.trim() || null,
			description: data.description?.trim() || null,
		};
	};

	// Mutations
	const createCertificateMutation = useMutation({
		mutationFn: async (data: any) => {
			const sanitizedData = sanitizeCertificateData(data);
			return await apiRequest("/api/certificates", {
				method: "POST",
				body: JSON.stringify(sanitizedData),
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
			toast({
				title: "Success",
				description: "Certificate created successfully",
			});
			resetForm();
			setIsCreateDialogOpen(false);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to create certificate",
				variant: "destructive",
			});
		},
	});

	const updateCertificateMutation = useMutation({
		mutationFn: async ({ id, data }: { id: number; data: any }) => {
			const sanitizedData = sanitizeCertificateData(data);
			return await apiRequest(`/api/certificates/${id}`, {
				method: "PUT",
				body: JSON.stringify(sanitizedData),
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
			toast({
				title: "Success",
				description: "Certificate updated successfully",
			});
			setIsEditDialogOpen(false);
			setEditingCertificate(null);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update certificate",
				variant: "destructive",
			});
		},
	});

	const deleteCertificateMutation = useMutation({
		mutationFn: async (id: number) => {
			return await apiRequest(`/api/certificates/${id}`, { method: "DELETE" });
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
			toast({
				title: "Success",
				description: "Certificate deleted successfully",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete certificate",
				variant: "destructive",
			});
		},
	});

	const bulkUpdateMutation = useMutation({
		mutationFn: async ({ ids, updates }: { ids: number[]; updates: any }) => {
			return await Promise.all(
				ids.map((id) =>
					apiRequest(`/api/certificates/${id}`, {
						method: "PUT",
						body: JSON.stringify(updates),
					}),
				),
			);
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
			toast({
				title: "Success",
				description: "Certificates updated successfully",
			});
			setSelectedCertificates([]);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update certificates",
				variant: "destructive",
			});
		},
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: number[]) => {
			return await Promise.all(
				ids.map((id) =>
					apiRequest(`/api/certificates/${id}`, { method: "DELETE" }),
				),
			);
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
			toast({
				title: "Success",
				description: "Certificates deleted successfully",
			});
			setSelectedCertificates([]);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete certificates",
				variant: "destructive",
			});
		},
	});

	// Helper functions
	const resetForm = () => {
		setFormData({
			name: "",
			type: "",
			issuingOrganization: "",
			description: "",
			documentId: null,
			imageId: null,
			documentUrl: "",
			imageUrl: "",
			isActive: true,
		});
	};

	// Form handlers
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createCertificateMutation.mutate(formData);
	};

	const handleEdit = (certificate: Certificate) => {
		setEditingCertificate(certificate);
		setFormData({
			name: certificate.name,
			type: certificate.type || "",
			issuingOrganization: certificate.issuingOrganization || "",
			description: certificate.description || "",
			documentId: certificate.documentId,
			imageId: certificate.imageId,
			documentUrl: certificate.documentUrl || "",
			imageUrl: certificate.imageUrl || "",
			isActive: certificate.isActive ?? true,
		});
		setIsEditDialogOpen(true);
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingCertificate) return;
		updateCertificateMutation.mutate({
			id: editingCertificate.id,
			data: formData,
		});
	};

	const handleDuplicate = (certificate: Certificate) => {
		setFormData({
			name: `${certificate.name} (Copy)`,
			type: certificate.type || "",
			issuingOrganization: certificate.issuingOrganization || "",
			description: certificate.description || "",
			documentId: certificate.documentId,
			imageId: certificate.imageId,
			documentUrl: certificate.documentUrl || "",
			imageUrl: certificate.imageUrl || "",
			isActive: true,
		});
		setIsCreateDialogOpen(true);
	};

	const handleBulkActivate = () => {
		bulkUpdateMutation.mutate({
			ids: selectedCertificates,
			updates: { isActive: true },
		});
	};

	const handleBulkDeactivate = () => {
		bulkUpdateMutation.mutate({
			ids: selectedCertificates,
			updates: { isActive: false },
		});
	};

	const handleBulkDelete = () => {
		bulkDeleteMutation.mutate(selectedCertificates);
	};

	const exportCertificates = () => {
		if (!certificates) return;

		const dataStr = JSON.stringify(certificates, null, 2);
		const dataUri =
			"data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

		const exportFileDefaultName = "certificates.json";

		const linkElement = document.createElement("a");
		linkElement.setAttribute("href", dataUri);
		linkElement.setAttribute("download", exportFileDefaultName);
		linkElement.click();
	};

	// Constants - removed predefined certificate types for custom input

	// Filtering and sorting logic
	const filteredAndSortedCertificates = useMemo(() => {
		if (!certificates) return [];

		const filtered = certificates.filter((cert) => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesSearch =
					cert.name.toLowerCase().includes(query) ||
					cert.type?.toLowerCase().includes(query) ||
					cert.description?.toLowerCase().includes(query) ||
					cert.issuingOrganization?.toLowerCase().includes(query);
				if (!matchesSearch) return false;
			}

			// Status filter
			if (statusFilter !== "all") {
				if (statusFilter === "active" && !cert.isActive) return false;
				if (statusFilter === "inactive" && cert.isActive) return false;
			}

			// Type filter (partial match for custom types)
			if (
				typeFilter !== "all" &&
				typeFilter !== "" &&
				!cert.type?.toLowerCase().includes(typeFilter.toLowerCase())
			)
				return false;

			return true;
		});

		// Sort
		filtered.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "type":
					comparison = (a.type || "").localeCompare(b.type || "");
					break;
				case "issuingOrganization":
					comparison = (a.issuingOrganization || "").localeCompare(
						b.issuingOrganization || "",
					);
					break;
				case "createdAt": {
					const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
					const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
					comparison = aCreated.getTime() - bCreated.getTime();
					break;
				}
			}

			return sortDirection === "asc" ? comparison : -comparison;
		});

		return filtered;
	}, [
		certificates,
		searchQuery,
		statusFilter,
		typeFilter,
		sortBy,
		sortDirection,
	]);

	// Analytics calculations
	const analytics = useMemo(() => {
		if (!certificates) return null;

		const now = new Date();
		const threeMonthsFromNow = new Date();
		threeMonthsFromNow.setMonth(now.getMonth() + 3);

		const total = certificates.length;
		const active = certificates.filter((cert) => cert.isActive).length;

		// Calculate expired and expiring soon based on expiryDate
		const expired = certificates.filter((cert) => {
			if (!cert.expiryDate) return false;
			const expiryDate = new Date(cert.expiryDate);
			return expiryDate < now;
		}).length;

		const expiringSoon = certificates.filter((cert) => {
			if (!cert.expiryDate) return false;
			const expiryDate = new Date(cert.expiryDate);
			return expiryDate >= now && expiryDate <= threeMonthsFromNow;
		}).length;

		const typeDistribution = certificates.reduce(
			(acc, cert) => {
				const certType = cert.type || "unknown";
				acc[certType] = (acc[certType] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const issuingBodyDistribution = certificates.reduce(
			(acc, cert) => {
				if (cert.issuingOrganization) {
					acc[cert.issuingOrganization] =
						(acc[cert.issuingOrganization] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			total,
			active,
			inactive: total - active,
			expired,
			expiringSoon,
			valid: total - expired,
			typeDistribution,
			issuingBodyDistribution,
			mostCommonType:
				Object.entries(typeDistribution).sort(
					([, a], [, b]) => b - a,
				)[0]?.[0] || "N/A",
			mostCommonIssuer:
				Object.entries(issuingBodyDistribution).sort(
					([, a], [, b]) => b - a,
				)[0]?.[0] || "N/A",
		};
	}, [certificates]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-neue-stance font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Certificate Management
						</h1>
						<p className="text-neutral-600 mt-2">
							Manage compliance and sustainability certifications
						</p>
					</div>
					<div className="flex items-center space-x-3">
						<Button
							onClick={() => setIsCreateDialogOpen(true)}
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Certificate
						</Button>
						<Button variant="outline" onClick={exportCertificates}>
							<BarChart3 className="w-4 h-4 mr-2" />
							Export
						</Button>
					</div>
				</div>

				<Tabs
					value={currentTab}
					onValueChange={setCurrentTab}
					className="space-y-6"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="certificates">Certificates</TabsTrigger>
						<TabsTrigger value="analytics">Analytics</TabsTrigger>
						<TabsTrigger value="insights">Insights</TabsTrigger>
					</TabsList>

					{/* Certificates Tab */}
					<TabsContent value="certificates" className="space-y-6">
						{/* Search and Filter Bar */}
						<Card>
							<CardContent className="p-6">
								<div className="flex flex-col lg:flex-row gap-4">
									{/* Search */}
									<div className="relative flex-1">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
										<Input
											placeholder="Search certificates..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-10"
										/>
										{searchQuery && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSearchQuery("")}
												className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
											>
												<X className="w-3 h-3" />
											</Button>
										)}
									</div>

									{/* Quick Filters */}
									<div className="flex items-center space-x-2">
										<Select
											value={statusFilter}
											onValueChange={setStatusFilter}
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Status</SelectItem>
												<SelectItem value="active">Active</SelectItem>
												<SelectItem value="inactive">Inactive</SelectItem>
											</SelectContent>
										</Select>

										<Input
											placeholder="Filter by type..."
											value={typeFilter === "all" ? "" : typeFilter}
											onChange={(e) => setTypeFilter(e.target.value || "all")}
											className="w-40"
										/>

										<Button
											variant="outline"
											onClick={() =>
												setShowAdvancedFilters(!showAdvancedFilters)
											}
											className={
												showAdvancedFilters ? "bg-blue-50 border-blue-200" : ""
											}
										>
											<Settings className="w-4 h-4 mr-2" />
											Filters
										</Button>
									</div>

									{/* View Mode Selector */}
									<div className="flex items-center border rounded-lg p-1">
										<Button
											variant={viewMode === "grid" ? "default" : "ghost"}
											size="sm"
											onClick={() => setViewMode("grid")}
											className="h-8 px-3"
										>
											<Grid3X3 className="w-4 h-4" />
										</Button>
										<Button
											variant={viewMode === "list" ? "default" : "ghost"}
											size="sm"
											onClick={() => setViewMode("list")}
											className="h-8 px-3"
										>
											<List className="w-4 h-4" />
										</Button>
										<Button
											variant={viewMode === "detailed" ? "default" : "ghost"}
											size="sm"
											onClick={() => setViewMode("detailed")}
											className="h-8 px-3"
										>
											<Table className="w-4 h-4" />
										</Button>
									</div>
								</div>

								{/* Advanced Filters */}
								{showAdvancedFilters && (
									<div className="mt-4 p-4 bg-neutral-50 rounded-lg border-t">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div>
												<Label>Sort by</Label>
												<Select value={sortBy} onValueChange={setSortBy}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="name">Name</SelectItem>
														<SelectItem value="type">Type</SelectItem>
														<SelectItem value="issuingOrganization">
															Issuing Organization
														</SelectItem>
														<SelectItem value="createdAt">
															Created Date
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label>Direction</Label>
												<Select
													value={sortDirection}
													onValueChange={(value: "asc" | "desc") =>
														setSortDirection(value)
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="asc">Ascending</SelectItem>
														<SelectItem value="desc">Descending</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="flex items-end">
												<Button
													variant="outline"
													onClick={() => {
														setSearchQuery("");
														setStatusFilter("all");
														setTypeFilter("all");
														setSortBy("name");
														setSortDirection("asc");
													}}
													className="w-full"
												>
													Clear All Filters
												</Button>
											</div>
										</div>
									</div>
								)}

								{/* Bulk Actions */}
								{selectedCertificates.length > 0 && (
									<div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
										<span className="text-sm font-medium text-blue-700">
											{selectedCertificates.length} certificate
											{selectedCertificates.length === 1 ? "" : "s"} selected
										</span>
										<div className="flex items-center space-x-2">
											<Button
												size="sm"
												variant="outline"
												onClick={handleBulkActivate}
											>
												<CheckCircle className="w-4 h-4 mr-1" />
												Activate
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={handleBulkDeactivate}
											>
												<Clock className="w-4 h-4 mr-1" />
												Deactivate
											</Button>
											<EnhancedDialog
												open={showBulkDeleteDialog}
												onOpenChange={setShowBulkDeleteDialog}
											>
												<EnhancedDialogContent contentType="form">
													<EnhancedDialogHeader>
														<EnhancedDialogTitle>
															Delete Certificates
														</EnhancedDialogTitle>
													</EnhancedDialogHeader>
													<EnhancedDialogBody>
														<p className="text-sm text-neutral-600">
															Are you sure you want to delete{" "}
															{selectedCertificates.length} certificate
															{selectedCertificates.length === 1 ? "" : "s"}?
															This action cannot be undone.
														</p>
													</EnhancedDialogBody>
													<EnhancedDialogFooter>
														<Button
															type="button"
															variant="outline"
															onClick={() => setShowBulkDeleteDialog(false)}
														>
															Cancel
														</Button>
														<Button
															onClick={() => {
																handleBulkDelete();
																setShowBulkDeleteDialog(false);
															}}
															className="bg-red-600 hover:bg-red-700 text-white"
														>
															Delete
														</Button>
													</EnhancedDialogFooter>
												</EnhancedDialogContent>
											</EnhancedDialog>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => setShowBulkDeleteDialog(true)}
											>
												<Trash2 className="w-4 h-4 mr-1" />
												Delete
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Certificates Display */}
						<CertificateList
							viewMode={viewMode}
							isLoading={isLoading}
							certificates={filteredAndSortedCertificates}
							selectedCertificates={selectedCertificates}
							onSelect={setSelectedCertificates}
							onEdit={handleEdit}
							onDuplicate={handleDuplicate}
							onDelete={(id) => deleteCertificateMutation.mutate(id)}
						/>
					</TabsContent>

					{/* Analytics Tab */}
					<TabsContent value="analytics" className="space-y-6">
						<CertificateAnalytics analytics={analytics} />
					</TabsContent>

					{/* Insights Tab */}
					<TabsContent value="insights" className="space-y-6">
						<CertificateInsights
							analytics={analytics}
							onCreate={() => setIsCreateDialogOpen(true)}
						/>
					</TabsContent>
				</Tabs>

				{/* Create Certificate Dialog */}
				<EnhancedDialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
				>
					<EnhancedDialogContent contentType="form">
						<EnhancedDialogHeader>
							<EnhancedDialogTitle className="font-neue-stance">
								Create New Certificate
							</EnhancedDialogTitle>
						</EnhancedDialogHeader>
						<EnhancedDialogBody>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<Label htmlFor="name">Certificate Name</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder="Enter certificate name"
										required
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="type">Certificate Type</Label>
										<Input
											id="type"
											value={formData.type}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													type: e.target.value,
												}))
											}
											placeholder="Enter certificate type (e.g., Sustainability, Compliance, Quality)"
										/>
									</div>
									<div>
										<Label htmlFor="issuingOrganization">
											Issuing Organization
										</Label>
										<Input
											id="issuingOrganization"
											value={formData.issuingOrganization}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													issuingOrganization: e.target.value,
												}))
											}
											placeholder="Organization that issued the certificate"
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
										placeholder="Describe what this certificate covers"
										className="h-20"
									/>
								</div>

								<div>
									<Label>Certificate Logo</Label>
									<div className="space-y-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsMediaPickerOpen(true)}
											className="w-full"
										>
											<Image className="mr-2 h-4 w-4" />
											{formData.imageId
												? "Change Image"
												: "Select Image from Library"}
										</Button>
										{formData.imageId && (
											<div className="mt-2 flex items-center gap-2">
												<img
													src={`/api/media/${formData.imageId}/content`}
													alt="Certificate logo preview"
													className="w-16 h-16 object-contain border rounded"
												/>
												<span className="text-sm text-muted-foreground">
													Image ID: {formData.imageId}
												</span>
											</div>
										)}
										<div className="text-sm text-muted-foreground">
											Or use URL instead:
										</div>
										<Input
											type="url"
											value={formData.imageUrl}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													imageUrl: e.target.value,
												}))
											}
											placeholder="https://example.com/certificate-logo.png"
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="documentUrl">Document URL</Label>
									<Input
										id="documentUrl"
										type="url"
										value={formData.documentUrl}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												documentUrl: e.target.value,
											}))
										}
										placeholder="https://example.com/certificate.pdf"
									/>
									<p className="text-sm text-muted-foreground mt-1">
										Link to the certificate document (PDF, etc.)
									</p>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="isActive"
										checked={formData.isActive}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												isActive: checked as boolean,
											}))
										}
									/>
									<Label htmlFor="isActive">Active</Label>
								</div>
							</form>
						</EnhancedDialogBody>
						<EnhancedDialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={(e) => {
									e.preventDefault();
									handleSubmit(e as any);
								}}
								disabled={createCertificateMutation.isPending}
							>
								{createCertificateMutation.isPending
									? "Creating..."
									: "Create Certificate"}
							</Button>
						</EnhancedDialogFooter>
					</EnhancedDialogContent>
				</EnhancedDialog>

				{/* Edit Certificate Dialog */}
				<EnhancedDialog
					open={isEditDialogOpen}
					onOpenChange={setIsEditDialogOpen}
				>
					<EnhancedDialogContent contentType="form">
						<EnhancedDialogHeader>
							<EnhancedDialogTitle className="font-neue-stance">
								Edit Certificate
							</EnhancedDialogTitle>
						</EnhancedDialogHeader>
						<EnhancedDialogBody>
							<form onSubmit={handleEditSubmit} className="space-y-4">
								<div>
									<Label htmlFor="edit-name">Certificate Name</Label>
									<Input
										id="edit-name"
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder="Enter certificate name"
										required
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="edit-type">Certificate Type</Label>
										<Input
											id="edit-type"
											value={formData.type}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													type: e.target.value,
												}))
											}
											placeholder="Enter certificate type (e.g., Sustainability, Compliance, Quality)"
										/>
									</div>
									<div>
										<Label htmlFor="edit-issuingBody">Issuing Body</Label>
										<Input
											id="edit-issuingBody"
											value={formData.issuingOrganization}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													issuingOrganization: e.target.value,
												}))
											}
											placeholder="Organization that issued the certificate"
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="edit-description">Description</Label>
									<Textarea
										id="edit-description"
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
										placeholder="Describe what this certificate covers"
										className="h-20"
									/>
								</div>

								<div>
									<Label>Certificate Logo</Label>
									<div className="space-y-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsMediaPickerOpen(true)}
											className="w-full"
										>
											<Image className="mr-2 h-4 w-4" />
											{formData.imageId
												? "Change Image"
												: "Select Image from Library"}
										</Button>
										{formData.imageId && (
											<div className="mt-2 flex items-center gap-2">
												<img
													src={`/api/media/${formData.imageId}/content`}
													alt="Certificate logo preview"
													className="w-16 h-16 object-contain border rounded"
												/>
												<span className="text-sm text-muted-foreground">
													Image ID: {formData.imageId}
												</span>
											</div>
										)}
										<div className="text-sm text-muted-foreground">
											Or use URL instead:
										</div>
										<Input
											type="url"
											value={formData.imageUrl}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													imageUrl: e.target.value,
												}))
											}
											placeholder="https://example.com/certificate-logo.png"
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="edit-documentUrl">Document URL</Label>
									<Input
										id="edit-documentUrl"
										type="url"
										value={formData.documentUrl}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												documentUrl: e.target.value,
											}))
										}
										placeholder="https://example.com/certificate.pdf"
									/>
									<p className="text-sm text-muted-foreground mt-1">
										Link to the certificate document (PDF, etc.)
									</p>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="edit-isActive"
										checked={formData.isActive}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												isActive: checked as boolean,
											}))
										}
									/>
									<Label htmlFor="edit-isActive">Active</Label>
								</div>
							</form>
						</EnhancedDialogBody>
						<EnhancedDialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={(e) => {
									e.preventDefault();
									handleEditSubmit(e as any);
								}}
								disabled={updateCertificateMutation.isPending}
							>
								{updateCertificateMutation.isPending
									? "Updating..."
									: "Update Certificate"}
							</Button>
						</EnhancedDialogFooter>
					</EnhancedDialogContent>
				</EnhancedDialog>

				{/* Media Picker Modal - STANDARDIZED */}
				<StandardMediaSelectionDialog
					isOpen={isMediaPickerOpen}
					onClose={() => setIsMediaPickerOpen(false)}
					onSelect={(asset) => {
						// Fix: Use proper asset data structure with proper typing
						const imageId = (asset as any).id || null;
						setFormData((prev) => ({ ...prev, imageId }));
					}}
					title="Select Certificate Image"
					mediaPickerTarget="certificate-image"
					selectionMode="single"
				/>
			</div>
		</div>
	);
}
