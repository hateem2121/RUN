import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface ContactSuccessProps {
  heading?: string;
  successHeading?: string;
  message?: string;
  successMessage?: string;
  onReset?: () => void;
  onSendAnother?: () => void;
}

export function ContactSuccess({
  heading,
  successHeading,
  message,
  successMessage,
  onReset,
  onSendAnother,
}: ContactSuccessProps) {
  const handleReset = onReset || onSendAnother || (() => {});
  const displayHeading = heading || successHeading || "Thank you!";
  const displayMessage =
    message || successMessage || "We've received your message and will be in touch shortly.";

  return (
    <div className="py-12 text-center" data-testid="contact-success-state">
      <div className="mb-6 inline-block rounded-full bg-status-success-muted p-4">
        <CheckCircle2 className="h-12 w-12 text-status-success" />
      </div>
      <Typography.H2 className="mb-3 font-bold text-3xl text-foreground/90">
        {displayHeading}
      </Typography.H2>
      <Typography.P className="mb-8 text-muted-foreground">{displayMessage}</Typography.P>
      <Button
        onClick={handleReset}
        className="focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
        data-testid="button-send-another"
      >
        Send Another Message
      </Button>
    </div>
  );
}
