import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-muted/30 text-center">
      <Card className="mx-4 w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <Typography.H1 className="font-bold text-2xl text-foreground">
              404 Page Not Found
            </Typography.H1>
          </div>

          <Typography.P className="mt-4 text-muted-foreground text-sm">
            Did you forget to add the page to the router?
          </Typography.P>
        </CardContent>
      </Card>
    </div>
  );
}
