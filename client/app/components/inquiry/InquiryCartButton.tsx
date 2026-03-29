import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Send, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useInquiryCart } from "@/context/InquiryCartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const inquiryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type InquiryFormData = z.infer<typeof inquiryFormSchema>;

export function InquiryCartButton() {
  const { items, removeItem, itemCount, clearCart } = useInquiryCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const submitInquiry = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const productDetails = items
        .map(
          (item) =>
            `${item.product.name} (SKU: ${item.product.sku}) - MOQ: ${item.product.moq} units`,
        )
        .join("\n");

      const fullMessage = `Product Inquiry:\n\n${productDetails}\n\nAdditional Message:\n${data.message}`;

      return apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company || "",
          phone: data.phone || "",
          message: fullMessage,
          preferredPlatform: "product-inquiry",
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Submitted",
        description: "Thank you! We will get back to you shortly.",
      });
      clearCart();
      setIsOpen(false);
      setShowForm(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    submitInquiry.mutate(data);
  };

  if (itemCount === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="z-dock hover:bg-muted/80 fixed right-4 bottom-4 rounded-full bg-black p-4 text-white shadow-lg transition-all sm:right-6 sm:bottom-6 md:right-8 md:bottom-8"
        data-testid="inquiry-cart-button"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {itemCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="center-flex z-modal fixed inset-0 bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              setIsOpen(false);
            }
          }}
          tabIndex={-1}
          aria-label="Close modal"
          data-testid="inquiry-cart-modal"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col bg-white text-black shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-2xl font-bold tracking-wide uppercase">
                {showForm ? "Submit Inquiry" : "Inquiry Cart"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:text-muted-foreground text-2xl"
                data-testid="close-inquiry-modal"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!showForm ? (
                items.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    Your inquiry cart is empty
                  </p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-start gap-4 rounded border p-4"
                        data-testid={`inquiry-item-${item.product.id}`}
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-20 w-20 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-muted-foreground text-sm">SKU: {item.product.sku}</p>
                          <p className="text-muted-foreground text-sm">
                            MOQ: {item.product.moq} units
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="text-muted-foreground/70 hover:text-red-600"
                          data-testid={`remove-item-${item.product.id}`}
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="inquiry-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="inquiry-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="inquiry-company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="inquiry-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder="Tell us about your requirements..."
                              data-testid="inquiry-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitInquiry.isPending}
                        className="hover:bg-muted/80 flex-1 bg-black text-white"
                        data-testid="submit-inquiry"
                      >
                        {submitInquiry.isPending ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Inquiry
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>

            {/* Footer */}
            {!showForm && items.length > 0 && (
              <div className="border-t p-6">
                <Button
                  onClick={() => setShowForm(true)}
                  className="hover:bg-muted/80 w-full bg-black text-white"
                  data-testid="proceed-to-inquiry"
                >
                  Continue to Inquiry Form ({itemCount} item
                  {itemCount !== 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
