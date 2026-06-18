import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, Plus, Send, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { apiRequest } from "@/lib/api";
import type { Inquiry } from "./index";

interface InquiryCRMLogsProps {
  inquiry: Inquiry;
}

export function InquiryCRMLogs({ inquiry }: InquiryCRMLogsProps) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState("call");
  const [isAdding, setIsAdding] = useState(false);

  const queryClient = useQueryClient();

  const addLogMutation = useMutation({
    mutationFn: async (newLog: { action: string; note: string }) => {
      return apiRequest(`/api/admin/inquiries/${inquiry.id}/logs`, {
        method: "POST",
        body: JSON.stringify(newLog),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries", inquiry.id] });
      setNote("");
      setIsAdding(false);
      toast.success("Log Added", { description: "Interaction has been logged successfully." });
    },
  });

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    addLogMutation.mutate({ action, note });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography.H5 className="flex items-center gap-2 font-bold">
          <History className="h-4 w-4 text-primary" />
          Interaction History
        </Typography.H5>
        <Button variant="outline" size="sm" className="h-8" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-2 h-3 w-3" />
              Add Activity
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddLog}
          className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="grid grid-cols-2 gap-3">
            <select
              title="Action Type"
              className="bg-surface-black border-white/10 rounded-md text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-primary h-9"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="call">Phone Call</option>
              <option value="email">Email Sent</option>
              <option value="whatsapp">WhatsApp Message</option>
              <option value="meeting">Meeting Held</option>
              <option value="note">Internal Note</option>
            </select>
            <Button
              type="submit"
              size="sm"
              className="h-9"
              disabled={!note.trim() || addLogMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Save Activity
            </Button>
          </div>
          <Textarea
            placeholder="What happened during this interaction?"
            className="min-h-custom-space-30 text-sm bg-transparent border-white/10"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </form>
      )}

      <div className="space-y-4 max-h-custom-space-31 overflow-y-auto pr-2 custom-scrollbar">
        {inquiry.crmLogs && inquiry.crmLogs.length > 0 ? (
          inquiry.crmLogs.map((log, index) => (
            <div key={index} className="relative pl-6 pb-6 last:pb-0 border-l border-white/10">
              <div className="absolute left-custom-space-32 top-0 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xxs text-admin-muted font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase tracking-widest text-primary/80">{log.action}</span>
                    <span>•</span>
                    <span>{format(new Date(log.date), "MMM d, h:mm a")}</span>
                  </div>
                  {log.user && (
                    <div className="flex items-center gap-1">
                      <User className="h-2 w-2" />
                      {log.user}
                    </div>
                  )}
                </div>
                <div className="text-sm p-3 rounded-lg bg-white/[0.03] border border-white/5 mt-1">
                  {log.note}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-admin-muted text-sm opacity-50 italic">
            No interactions logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
