import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onStay,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="border border-white/[0.08] bg-[#111111] text-[#E3DFD6] backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="text-[#68869A]">
            You have unsaved changes. If you leave now, you will lose your work.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row items-center justify-end space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            onClick={onStay}
            className="border-white/20 text-[#E3DFD6] hover:bg-white/[0.06] hover:text-white"
          >
            Stay
          </Button>
          <Button onClick={onDiscard} className="bg-red-500 text-white hover:bg-red-600">
            Discard & Leave
          </Button>
          {/* Note: Save typically requires the active form to do the saving, so for now "Save" acts as Stay so user can hit Save. */}
          <Button onClick={onSave} className="bg-blue-500 text-white hover:bg-blue-600">
            Stay & Save
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
