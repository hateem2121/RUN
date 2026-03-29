import { useBlocker } from "react-router";
import { useAdminContext } from "@/context/AdminContext";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

export function UnsavedChangesGuard() {
  const { hasUnsavedChanges, setHasUnsavedChanges } = useAdminContext();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  return (
    <UnsavedChangesDialog
      isOpen={blocker.state === "blocked"}
      onStay={() => {
        if (blocker.state === "blocked") {
          blocker.reset();
        }
      }}
      onDiscard={() => {
        setHasUnsavedChanges(false);
        if (blocker.state === "blocked") {
          blocker.proceed();
        }
      }}
      onSave={() => {
        if (blocker.state === "blocked") {
          blocker.reset();
        }
        // Additional trigger for global save could be fired here
      }}
    />
  );
}
