import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Package } from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProductContext } from "../state/ProductFormContext";

export function ProductFormHeader() {
  const { isEditing } = useProductContext();

  return (
    <>
      <VisuallyHidden.Root>
        <DialogTitle>Product Management Form</DialogTitle>
      </VisuallyHidden.Root>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2" id="product-form-title">
          <Package className="h-5 w-5" />
          {isEditing ? "Edit Product" : "Create New Product"}
        </DialogTitle>
        <DialogDescription id="product-form-description">
          {isEditing
            ? "Update product information and media assets"
            : "Add a new product to your catalog with category, fabric, and media selections"}
        </DialogDescription>
      </DialogHeader>
    </>
  );
}
