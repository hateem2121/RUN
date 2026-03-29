import { Wrench } from "lucide-react";
import { Typography } from "@/components/ui/typography";

interface PlaceholderModuleProps {
  moduleName: string;
}

export function PlaceholderModule({ moduleName }: PlaceholderModuleProps) {
  return (
    <div className="m-4 flex h-loading-center flex-col items-center justify-center rounded-lg border-2 border-border/50 border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-6 rounded-full bg-muted p-4">
        <Wrench className="h-10 w-10 text-muted-foreground" />
      </div>
      <Typography.H2 className="mb-2">{moduleName} Module Check</Typography.H2>
      <Typography.P className="mb-6 max-w-md text-muted-foreground">
        This administration module is currently being migrated to the new architecture. Please check
        back soon.
      </Typography.P>
      <div className="rounded bg-muted px-3 py-1 font-mono text-muted-foreground text-xs">
        Status: Migration Pending
      </div>
    </div>
  );
}
