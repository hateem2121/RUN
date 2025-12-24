import type { Certificate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

interface CertificateSelectionProps {
	selectedIds: number[];
	onChange: (ids: number[]) => void;
}

export function CertificateSelection({
	selectedIds,
	onChange,
}: CertificateSelectionProps) {
	const { data: certificates = [] } = useQuery<Certificate[]>({
		queryKey: ["/api/certificates"],
	});

	const activeCertificates = certificates.filter((cert) => cert.isActive);

	const toggleCertificate = (certId: number) => {
		if (selectedIds.includes(certId)) {
			onChange(selectedIds.filter((id) => id !== certId));
		} else {
			onChange([...selectedIds, certId]);
		}
	};

	return (
		<div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
			{activeCertificates.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No active certificates available. Add certificates in the Certificates
					management page.
				</p>
			) : (
				activeCertificates.map((cert) => (
					<div
						key={cert.id}
						className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
						onClick={() => toggleCertificate(cert.id)}
					>
						<div
							className={`w-4 h-4 border rounded ${selectedIds.includes(cert.id) ? "bg-primary border-primary" : "border-input"}`}
						>
							{selectedIds.includes(cert.id) && (
								<Check className="w-3 h-3 text-primary-foreground" />
							)}
						</div>
						<div className="flex-1">
							<div className="font-medium text-sm">{cert.name}</div>
							<div className="text-xs text-muted-foreground">
								{cert.issuingBody}
							</div>
						</div>
					</div>
				))
			)}
		</div>
	);
}
