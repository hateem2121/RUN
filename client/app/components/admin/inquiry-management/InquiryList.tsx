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
        <Mail className="h-12 w-12 text-admin-muted/30 mb-4" />
        <Typography.H4>No inquiries found</Typography.H4>
        <Typography.P className="text-admin-muted">
          There are currently no customer inquiries matching your filters.
        </Typography.P>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      <div className="bg-white/[0.03] px-6 py-3 grid grid-cols-4 text-xs font-semibold text-admin-muted tracking-wider uppercase">
        <div className="col-span-1">Contact</div>
        <div className="col-span-1 text-center">Company / Platform</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-right">Received</div>
      </div>
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {inquiries.map((inquiry) => (
          <button
            aria-label="Action button"
            type="button"
            key={inquiry.id}
            onClick={() => onSelect(inquiry.id)}
            className={cn(
              "p-6 grid grid-cols-4 items-center gap-4 transition-colors cursor-pointer hover:bg-white/[0.03] w-full text-left border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30",
              selectedId === inquiry.id && "bg-primary/5 ring-1 ring-inset ring-primary/20",
            )}
            aria-pressed={selectedId === inquiry.id}
          >
            <div className="col-span-1 overflow-hidden">
              <div className="font-bold text-sm truncate">{inquiry.name}</div>
              <div className="text-xs text-admin-muted truncate">{inquiry.email}</div>
            </div>

            <div className="col-span-1 text-center">
              <div className="flex flex-col items-center gap-1">
                {inquiry.company ? (
                  <span className="text-xs bg-white/[0.05] px-2 py-0.5 rounded-full truncate max-w-full">
                    {inquiry.company}
                  </span>
                ) : (
                  <span className="text-xs text-admin-muted italic">N/A</span>
                )}
                <span className="text-xxs text-admin-muted/70 flex items-center gap-1">
                  {inquiry.preferredPlatform || "Email"}
                </span>
              </div>
            </div>

            <div className="col-span-1 flex justify-center">
              <StatusBadge status={inquiry.status} />
            </div>

            <div className="col-span-1 text-right text-xs text-admin-muted whitespace-nowrap">
              {(() => {
                const date = new Date(inquiry.createdAt);
                return Number.isNaN(date.getTime())
                  ? "Recently"
                  : formatDistanceToNow(date, { addSuffix: true });
              })()}
            </div>
          </button>
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
    archived: { label: "Archived", className: "bg-white/[0.05] text-admin-muted border-white/10" },
  };

  const config = configs[status.toLowerCase() as keyof typeof configs] || configs.new;

  return (
    <Badge
      variant="outline"
      className={cn("text-xxs uppercase font-bold px-2 py-0", config.className)}
    >
      {config.label}
    </Badge>
  );
}
