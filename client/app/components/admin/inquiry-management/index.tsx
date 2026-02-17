import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle, Inbox, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useToast } from "@/hooks/use-toast";
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
}

export function InquiryManagement() {
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
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
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Inquiry["status"] }) => {
      const res = await fetch(`/api/admin/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Updated", description: "Inquiry status updated successfully." });
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

      <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="all">
            <Inbox className="mr-2 h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="new">
            <Package className="mr-2 h-4 w-4" />
            New
          </TabsTrigger>
          <TabsTrigger value="responded">
            <CheckCircle className="mr-2 h-4 w-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="mr-2 h-4 w-4" />
            Archived
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 overflow-hidden border-border/40 bg-background/50 backdrop-blur-sm">
            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center">
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
              onStatusChange={(status: Inquiry["status"]) => {
                if (selectedInquiryId) {
                  updateStatusMutation.mutate({ id: selectedInquiryId, status });
                }
              }}
            />
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
