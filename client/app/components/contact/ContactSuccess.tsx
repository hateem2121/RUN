import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface ContactSuccessProps {
  heading?: string;
  message?: string;
  onReset: () => void;
}

export function ContactSuccess({ heading, message, onReset }: ContactSuccessProps) {
  return (
    <div className="py-12 text-center">
      <div className="mb-6 inline-block rounded-full bg-status-success-muted p-4">
        <CheckCircle2 className="h-12 w-12 text-status-success" />
      </div>
      <Typography.H2 className="mb-3 font-bold text-3xl text-foreground/90">
        {heading || "Thank you!"}
      </Typography.H2>
      <Typography.P className="mb-8 text-muted-foreground">
        {message || "We've received your message and will be in touch shortly."}
      </Typography.P>
      <Button
        onClick={onReset}
        className="focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
        data-testid="button-send-another"
      >
        Send Another Message
      </Button>
    </div>
  );
}
