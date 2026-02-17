import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Archive,
  Building2,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import type { Inquiry } from "./index";

interface InquiryDetailsProps {
  inquiryId: number | null;
  onStatusChange: (status: Inquiry["status"]) => void;
}

export function InquiryDetails({ inquiryId, onStatusChange }: InquiryDetailsProps) {
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
      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground py-12">
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between">
        <div>
          <Typography.H4 className="font-bold text-xl">{inquiry.name}</Typography.H4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            {format(new Date(inquiry.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="p-2 rounded-md bg-muted/50 text-muted-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Email</span>
            <span className="font-medium">{inquiry.email}</span>
          </div>
        </div>

        {inquiry.phone && (
          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 rounded-md bg-muted/50 text-muted-foreground">
              <Phone className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/60">
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
            <div className="p-2 rounded-md bg-muted/50 text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/60">
                Company
              </span>
              <span className="font-medium">{inquiry.company}</span>
            </div>
          </div>
        )}

        {inquiry.country && (
          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 rounded-md bg-muted/50 text-muted-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/60">
                Region
              </span>
              <span className="font-medium">{inquiry.country}</span>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-border/40" />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Message
          </span>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-sm leading-relaxed whitespace-pre-wrap">
          {inquiry.message}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 italic px-1">
          <ShieldCheck className="h-3 w-3" />
          Securely Decrypted (AES-256-GCM)
        </div>
      </div>

      <div className="pt-6 space-y-3">
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          Actions
        </span>
        <div className="grid grid-cols-2 gap-3">
          {inquiry.status !== "responded" && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onStatusChange("responded")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Handled
            </Button>
          )}
          {inquiry.status !== "archived" && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange("archived")}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
        <Button variant="secondary" size="sm" className="w-full" asChild>
          <a href={`mailto:${inquiry.email}`}>
            <Mail className="mr-2 h-4 w-4" />
            Compose Reply
          </a>
        </Button>
      </div>
    </div>
  );
}
