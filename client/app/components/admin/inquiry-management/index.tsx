import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle, Inbox, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { InquiryDetails } from "./InquiryDetails";
import { InquiryList } from "./InquiryList";

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

export function InquiryManagement() {
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery<{
    data: Inquiry[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["/api/admin/inquiries", statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === "all"
          ? "/api/admin/inquiries"
          : `/api/admin/inquiries?status=${statusFilter}`;
      return apiRequest(url);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Inquiry>) => {
      return apiRequest(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast.success("Updated", { description: "Inquiry updated successfully." });
    },
  });

  const inquiries = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H2>Inquiry Management</Typography.H2>
          <Typography.P className="text-muted-foreground text-sm">
            Manage and respond to B2B customer inquiries.
          </Typography.P>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-1 rounded-lg w-fit">
        {[
          { id: "all", label: "All", icon: Inbox },
          { id: "new", label: "New", icon: Package },
          { id: "responded", label: "Active", icon: CheckCircle },
          { id: "archived", label: "Archived", icon: Archive },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "flex items-center px-4 py-2 rounded-md text-xs font-bold transition-all duration-200",
              statusFilter === tab.id
                ? "bg-primary/20 text-primary border border-primary/20 shadow-custom-misc-46"
                : "text-admin-muted hover:text-white hover:bg-white/5 border border-transparent",
            )}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2 overflow-hidden border-border/40 bg-background/50 backdrop-blur-sm">
          {isLoading ? (
            <div className="flex h-custom-space-35 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <InquiryList
              inquiries={inquiries}
              onSelect={setSelectedInquiryId}
              selectedId={selectedInquiryId}
            />
          )}
        </Card>

        <Card className="col-span-1 border-border/40 bg-background/50 backdrop-blur-sm p-6">
          <InquiryDetails
            inquiryId={selectedInquiryId}
            onUpdate={(data: Partial<Inquiry>) => {
              if (selectedInquiryId) {
                updateStatusMutation.mutate({ id: selectedInquiryId, ...data });
              }
            }}
          />
        </Card>
      </div>
    </div>
  );
}
