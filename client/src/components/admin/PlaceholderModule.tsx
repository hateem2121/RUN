import { Wrench } from "lucide-react";
import { Typography } from "@/components/ui/typography";

interface PlaceholderModuleProps {
  moduleName: string;
}

export default function PlaceholderModule({ moduleName }: PlaceholderModuleProps) {
  return (
    <div className="border-border/50 bg-muted/20 h-loading-center m-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
      <div className="bg-muted mb-6 rounded-full p-4">
        <Wrench className="text-muted-foreground h-10 w-10" />
      </div>
      <Typography.H2 className="mb-2">{moduleName} Module Check</Typography.H2>
      <Typography.P className="text-muted-foreground mb-6 max-w-md">
        This administration module is currently being migrated to the new architecture. Please check
        back soon.
      </Typography.P>
      <div className="bg-muted text-muted-foreground rounded px-3 py-1 font-mono text-xs">
        Status: Migration Pending
      </div>
    </div>
  );
}
