import { useState } from "react";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

  if (itemCount === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 bg-black text-white rounded-full p-4 shadow-lg hover:bg-gray-800 transition-all z-40"
        data-testid="inquiry-cart-button"
      >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {itemCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          data-testid="inquiry-cart-modal"
        >
          <div
            className="bg-white text-black w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold uppercase tracking-wide">
                {showForm ? "Submit Inquiry" : "Inquiry Cart"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl hover:text-gray-600"
                data-testid="close-inquiry-modal"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 flex-1">
              {!showForm ? (
                <>
                  {items.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Your inquiry cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-start gap-4 p-4 border rounded"
                          data-testid={`inquiry-item-${item.product.id}`}
                        >
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                            <p className="text-sm text-gray-500">MOQ: {item.product.moq} units</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-gray-400 hover:text-red-600"
                            data-testid={`remove-item-${item.product.id}`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
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
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        data-testid="submit-inquiry"
                      >
                        {submitInquiry.isPending ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
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
              <div className="p-6 border-t">
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  data-testid="proceed-to-inquiry"
                >
                  Continue to Inquiry Form ({itemCount} item{itemCount !== 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
