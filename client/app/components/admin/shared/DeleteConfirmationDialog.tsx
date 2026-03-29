import { Trash2 } from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  onConfirm: () => void;
  title: string;
  description: string;
  triggerClassName?: string | undefined;
  disabled?: boolean | undefined;
  trigger?: React.ReactNode;
  asChild?: boolean | undefined;
  confirmText?: string | undefined;
  open?: boolean | undefined;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean | undefined;
  variant?: "destructive" | "default";
}

/**
 * Reusable delete confirmation dialog component
 * Eliminates duplication across manufacturing management components
 */
export const DeleteConfirmationDialog = React.memo(function DeleteConfirmationDialog({
  onConfirm,
  title,
  description,
  triggerClassName = "text-red-600 hover:text-red-700",
  disabled = false,
  trigger,
  asChild = false,
  confirmText = "Delete",
  open,
  onOpenChange,
  showTrigger = true,
  variant = "destructive",
}: DeleteConfirmationDialogProps) {
  const defaultTrigger = (
    <Button size="sm" variant="ghost" className={triggerClassName} disabled={disabled}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {showTrigger && (
        <AlertDialogTrigger asChild={trigger ? asChild : true}>
          {trigger || defaultTrigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : undefined}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
