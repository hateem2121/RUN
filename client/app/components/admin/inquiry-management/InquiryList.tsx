import { formatDistanceToNow } from "date-fns";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { Inquiry } from "./index";

interface InquiryListProps {
  inquiries: Inquiry[];
  onSelect: (id: number) => void;
  selectedId: number | null;
}

export function InquiryList({ inquiries, onSelect, selectedId }: InquiryListProps) {
  if (inquiries.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center p-8">
        <Mail className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <Typography.H4>No inquiries found</Typography.H4>
        <Typography.P className="text-muted-foreground">
          There are currently no customer inquiries matching your filters.
        </Typography.P>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      <div className="bg-muted/30 px-6 py-3 grid grid-cols-4 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
        <div className="col-span-1">Contact</div>
        <div className="col-span-1 text-center">Company / Platform</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-right">Received</div>
      </div>
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            onClick={() => onSelect(inquiry.id)}
            className={cn(
              "p-6 grid grid-cols-4 items-center gap-4 transition-colors cursor-pointer hover:bg-muted/30",
              selectedId === inquiry.id && "bg-primary/5 ring-1 ring-inset ring-primary/20",
            )}
          >
            <div className="col-span-1 overflow-hidden">
              <div className="font-bold text-sm truncate">{inquiry.name}</div>
              <div className="text-xs text-muted-foreground truncate">{inquiry.email}</div>
            </div>

            <div className="col-span-1 text-center">
              <div className="flex flex-col items-center gap-1">
                {inquiry.company ? (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full truncate max-w-full">
                    {inquiry.company}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">N/A</span>
                )}
                <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                  {inquiry.preferredPlatform || "Email"}
                </span>
              </div>
            </div>

            <div className="col-span-1 flex justify-center">
              <StatusBadge status={inquiry.status} />
            </div>

            <div className="col-span-1 text-right text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Inquiry["status"] }) {
  const configs = {
    new: { label: "New", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    read: { label: "Read", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    responded: {
      label: "Responded",
      className: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    archived: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
  };

  const config = configs[status];

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] uppercase font-bold px-2 py-0", config.className)}
    >
      {config.label}
    </Badge>
  );
}
