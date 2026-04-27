import { AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductContext } from "../state/ProductFormContext";

export function ProductFormFooter() {
  const { validationSummary, isSubmitting, isEditing, onClose } = useProductContext();

  return (
    <div className="space-y-3 border-t border-white/5 pt-4">
      {/* Validation Status Summary */}
      {!validationSummary.isValid && validationSummary.errorCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-400">
            Fix {validationSummary.errorCount} error
            {validationSummary.errorCount !== 1 ? "s" : ""}
            {validationSummary.warningCount > 0 &&
              ` and ${validationSummary.warningCount} warning${validationSummary.warningCount !== 1 ? "s" : ""}`}{" "}
            before submitting
          </span>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          data-testid="product-form-cancel-button"
          type="button"
          variant="outline"
          onClick={onClose}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          data-testid="product-form-submit-button"
          type="submit"
          className={`${
            validationSummary.isValid
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
          disabled={isSubmitting || !validationSummary.isValid}
        >
          {validationSummary.isValid ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : (
            <AlertCircle className="mr-2 h-4 w-4" />
          )}
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Product"
              : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
