import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const InputOTP = ({
  className,
  containerClassName,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof OTPInput> & {
  ref?: React.Ref<React.ElementRef<typeof OTPInput>>;
}) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<React.ElementRef<"div">>;
}) => <div ref={ref} className={cn("flex items-center", className)} {...props} />;
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = ({
  index,
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  index: number;
  ref?: React.Ref<React.ElementRef<"div">>;
}) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  if (!inputOTPContext.slots[index]) return null;
  // biome-ignore lint/suspicious/noExplicitAny: OTP slot type cast
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] as any;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-input border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-elevated ring-2 ring-ring ring-offset-background",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="center-flex pointer-events-none absolute inset-0">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
};
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<React.ElementRef<"div">>;
}) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
