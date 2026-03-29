export interface CertificateFormData {
  name: string;
  type: string;
  issuingOrganization: string;
  description: string;
  documentId: number | null;
  imageId: number | null;
  documentUrl: string;
  imageUrl: string;
  isActive: boolean;
  status?: string;
}

export const initialCertificateFormData: CertificateFormData = {
  name: "",
  type: "",
  issuingOrganization: "",
  description: "",
  documentId: null,
  imageId: null,
  documentUrl: "",
  imageUrl: "",
  isActive: true,
};

export interface CertificateAnalyticsData {
  total: number;
  active: number;
  expired: number;
  expiringSoon: number;
  typeDistribution: Record<string, number>;
  issuingBodyDistribution: Record<string, number>;
}
