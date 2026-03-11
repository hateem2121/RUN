import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Archive,
  Building2,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { InquiryCRMLogs } from "./InquiryCRMLogs";
import type { Inquiry } from "./index";

interface InquiryDetailsProps {
  inquiryId: number | null;
  onUpdate: (data: Partial<Inquiry>) => void;
}

export function InquiryDetails({ inquiryId, onUpdate }: InquiryDetailsProps) {
  const { data: inquiry, isLoading } = useQuery<Inquiry>({
    queryKey: ["/api/admin/inquiries", inquiryId],
    queryFn: async () => {
      if (!inquiryId) return null;
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`);
      if (!res.ok) throw new Error("Failed to fetch inquiry details");
      return res.json();
    },
    enabled: !!inquiryId,
  });

  if (!inquiryId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-[#68869A] py-12">
        <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
        <Typography.P>Select an inquiry to view details and respond.</Typography.P>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inquiry) return null;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase font-bold",
                inquiry.priority === "urgent"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : inquiry.priority === "high"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20",
              )}
            >
              {inquiry.priority}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#68869A] bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">
              <TrendingUp className="h-2 w-2" />
              Score: {inquiry.leadScore}
            </div>
          </div>
          <Typography.H4 className="font-bold text-xl">{inquiry.name}</Typography.H4>
          <div className="flex items-center gap-2 text-xs text-[#68869A] mt-0.5">
            <Clock className="h-3 w-3" />
            {(() => {
              const date = new Date(inquiry.createdAt);
              return Number.isNaN(date.getTime())
                ? "Recently"
                : format(date, "MMM d, yyyy 'at' h:mm a");
            })()}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="details">Inquiry Details</TabsTrigger>
          <TabsTrigger value="crm">CRM / Interactions</TabsTrigger>
        </TabsList>

        <TabsContent
          value="details"
          className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-md bg-white/[0.03] text-[#68869A]">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#68869A]/60">Email</span>
                <span className="font-medium">{inquiry.email}</span>
              </div>
            </div>

            {inquiry.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-md bg-white/[0.03] text-[#68869A]">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#68869A]/60">
                    Phone / Platform
                  </span>
                  <span className="font-medium">
                    {inquiry.phone} ({inquiry.preferredPlatform})
                  </span>
                </div>
              </div>
            )}

            {inquiry.company && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-md bg-white/[0.03] text-[#68869A]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#68869A]/60">Company</span>
                  <span className="font-medium">{inquiry.company}</span>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/40" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#68869A]">
                Original Message
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#68869A]">
              Quick Controls
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#68869A] ml-1">Priority</span>
                <select
                  title="Priority"
                  className="w-full bg-[#0A0A0A] border-white/10 rounded-md text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={inquiry.priority}
                  onChange={(e) => onUpdate({ priority: e.target.value as any })}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#68869A] ml-1">Assign User</span>
                <select
                  title="Assign User"
                  className="w-full bg-[#0A0A0A] border-white/10 rounded-md text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={inquiry.assignedTo || ""}
                  onChange={(e) => onUpdate({ assignedTo: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  <option value="hateem@wear-run.com">Hateem Jamshaid</option>
                  <option value="sales@run-apparel.com">Sales Team</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="crm" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <InquiryCRMLogs inquiry={inquiry} />
        </TabsContent>
      </Tabs>

      <div className="pt-4 mt-auto border-t border-border/40 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {inquiry.status !== "responded" && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onUpdate({ status: "responded" })}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Handled
            </Button>
          )}
          {inquiry.status !== "archived" && (
            <Button size="sm" variant="outline" onClick={() => onUpdate({ status: "archived" })}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
        <Button variant="secondary" size="sm" className="w-full" asChild>
          <a href={`mailto:${inquiry.email}`}>
            <Mail className="mr-2 h-4 w-4" />
            Email Customer
          </a>
        </Button>
      </div>
    </div>
  );
}
