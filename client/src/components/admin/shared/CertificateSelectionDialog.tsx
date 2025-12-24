/**
 * Certificate Selection Dialog
 *
 * Standard dialog for selecting certificates across admin components.
 * Follows the same pattern as StandardMediaSelectionDialog.
 */

import type { Certificate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	EnhancedDialog,
	EnhancedDialogBody,
	EnhancedDialogContent,
	EnhancedDialogFooter,
	EnhancedDialogHeader,
	EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CertificateSelectionDialogProps {
	/** Whether the dialog is open */
	isOpen: boolean;

	/** Called when dialog should close */
	onClose: () => void;

	/** Called when certificates are selected */
	onSelect: (certificates: Certificate[] | Certificate) => void;

	/** Dialog title */
	title?: string;

	/** Selection mode */
	selectionMode?: "single" | "multiple";

	/** Maximum number of certificates for multiple selection */
	maxSelection?: number;

	/** Pre-selected certificate IDs */
	initialSelectedIds?: number[];
}

export function CertificateSelectionDialog({
	isOpen,
	onClose,
	onSelect,
	title = "Select Certificates",
	selectionMode = "multiple",
	maxSelection = 10,
	initialSelectedIds = [],
}: CertificateSelectionDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);

	const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
		queryKey: ["/api/certificates"],
		enabled: isOpen,
	});

	// Filter active certificates and apply search
	const filteredCertificates = useMemo(() => {
		return certificates
			.filter((cert) => cert.isActive !== false)
			.filter((cert) => {
				if (!searchQuery) return true;
				const query = searchQuery.toLowerCase();
				return (
					cert.name.toLowerCase().includes(query) ||
					cert.type?.toLowerCase().includes(query) ||
					cert.issuingOrganization?.toLowerCase().includes(query)
				);
			});
	}, [certificates, searchQuery]);

	const handleToggleSelection = (certId: number) => {
		if (selectionMode === "single") {
			setSelectedIds([certId]);
		} else {
			setSelectedIds((prev) => {
				if (prev.includes(certId)) {
					return prev.filter((id) => id !== certId);
				}
				if (prev.length >= maxSelection) {
					return prev;
				}
				return [...prev, certId];
			});
		}
	};

	const handleConfirm = () => {
		const selected = certificates.filter((cert) =>
			selectedIds.includes(cert.id),
		);
		if (selected.length === 0) return;

		if (selectionMode === "single" && selected[0]) {
			onSelect(selected[0]);
		} else {
			onSelect(selected);
		}

		onClose();
	};

	const handleCancel = () => {
		setSelectedIds(initialSelectedIds);
		setSearchQuery("");
		onClose();
	};

	return (
		<EnhancedDialog open={isOpen} onOpenChange={handleCancel}>
			<EnhancedDialogContent
				contentType="media-library"
				preferredSize="4xl"
				className="flex flex-col"
			>
				<EnhancedDialogHeader className="shrink-0 border-b border-border pb-4">
					<EnhancedDialogTitle>{title}</EnhancedDialogTitle>
					<div className="mt-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by name, type, or organization..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
								data-testid="input-certificate-search"
							/>
						</div>
					</div>
				</EnhancedDialogHeader>

				<EnhancedDialogBody className="flex-1 min-h-0 overflow-hidden">
					<ScrollArea className="h-full">
						{isLoading ? (
							<div className="flex items-center justify-center h-64">
								<div className="text-muted-foreground">
									Loading certificates...
								</div>
							</div>
						) : filteredCertificates.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-64 text-center">
								<Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
								<div className="text-muted-foreground">
									{searchQuery
										? "No certificates found matching your search"
										: "No certificates available"}
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
								{filteredCertificates.map((cert) => {
									const isSelected = selectedIds.includes(cert.id);

									return (
										<div
											key={cert.id}
											onClick={() => handleToggleSelection(cert.id)}
											className={`
                        relative border rounded-lg p-4 cursor-pointer transition-all
                        ${
													isSelected
														? "border-primary bg-primary/5 ring-2 ring-primary/20"
														: "border-border hover:border-primary/50 hover:bg-accent/50"
												}
                      `}
											data-testid={`certificate-item-${cert.id}`}
										>
											{selectionMode === "multiple" && (
												<div className="absolute top-4 right-4">
													<Checkbox
														checked={isSelected}
														onCheckedChange={() =>
															handleToggleSelection(cert.id)
														}
														data-testid={`checkbox-certificate-${cert.id}`}
													/>
												</div>
											)}

											{isSelected && selectionMode === "single" && (
												<div className="absolute top-4 right-4">
													<CheckCircle2 className="h-5 w-5 text-primary" />
												</div>
											)}

											<div className="flex items-start gap-4">
												{/* Certificate Image/Icon */}
												<div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
													{cert.imageId ? (
														<img
															src={`/api/media/${cert.imageId}/content`}
															alt={cert.name}
															className="w-full h-full object-contain rounded"
															data-testid={`img-certificate-${cert.id}`}
														/>
													) : (
														<Award className="h-8 w-8 text-muted-foreground" />
													)}
												</div>

												<div className="flex-1 min-w-0">
													<h4
														className="font-semibold text-sm mb-1 truncate"
														data-testid={`text-certificate-name-${cert.id}`}
													>
														{cert.name}
													</h4>

													<div className="space-y-1">
														{cert.type && (
															<Badge variant="outline" className="text-xs">
																{cert.type}
															</Badge>
														)}

														{cert.issuingOrganization && (
															<p className="text-xs text-muted-foreground truncate">
																{cert.issuingOrganization}
															</p>
														)}
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</ScrollArea>
				</EnhancedDialogBody>

				<EnhancedDialogFooter className="shrink-0 border-t border-border pt-4">
					<div className="flex items-center justify-between w-full">
						<div className="text-sm text-muted-foreground">
							{selectedIds.length > 0 && (
								<span>
									{selectedIds.length}{" "}
									{selectionMode === "single" ? "certificate" : "certificates"}{" "}
									selected
									{selectionMode === "multiple" && ` (max ${maxSelection})`}
								</span>
							)}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={handleCancel}
								data-testid="button-cancel-selection"
							>
								Cancel
							</Button>
							<Button
								onClick={handleConfirm}
								disabled={selectedIds.length === 0}
								data-testid="button-confirm-selection"
							>
								Select {selectedIds.length > 0 && `(${selectedIds.length})`}
							</Button>
						</div>
					</div>
				</EnhancedDialogFooter>
			</EnhancedDialogContent>
		</EnhancedDialog>
	);
}

/**
 * USAGE EXAMPLE:
 *
 * ```tsx
 * const [isCertPickerOpen, setIsCertPickerOpen] = useState(false);
 * const [selectedCertIds, setSelectedCertIds] = useState<number[]>([]);
 *
 * <Button onClick={() => setIsCertPickerOpen(true)}>
 *   Select Certificates
 * </Button>
 *
 * <CertificateSelectionDialog
 *   isOpen={isCertPickerOpen}
 *   onClose={() => setIsCertPickerOpen(false)}
 *   onSelect={(certs) => {
 *     const ids = Array.isArray(certs) ? certs.map(c => c.id) : [certs.id];
 *     setSelectedCertIds(ids);
 *   }}
 *   title="Select Footer Certificates"
 *   selectionMode="multiple"
 *   maxSelection={6}
 *   initialSelectedIds={selectedCertIds}
 * />
 * ```
 */

export default CertificateSelectionDialog;
