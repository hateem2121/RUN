export interface Inquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  company?: string | null;
  phone?: string | null;
  country?: string | null;
  preferredPlatform?: string | null;
  source: string;
  status: "new" | "read" | "responded" | "archived";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  // CRM Fields
  priority: "low" | "medium" | "high" | "urgent";
  crmStage: string;
  crmLogs: Array<{
    date: string;
    action: string;
    note: string;
    user?: string;
  }>;
  leadScore: number;
  tags: string[];
  assignedTo?: string | null;
}
