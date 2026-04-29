import type { UseFormReturn } from "react-hook-form";
import type { InquiryFormData } from "@/hooks/use-inquiry-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface InquiryFormProps {
  form: UseFormReturn<InquiryFormData>;
  onSubmit: (data: InquiryFormData) => void;
}

export function InquiryForm({ form, onSubmit }: InquiryFormProps) {
  return (
    <Form {...form}>
      <form id="inquiry-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="contact.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Full Name
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="h-12 bg-background/50 border-border focus:border-foreground transition-colors" 
                  placeholder="e.g. John Doe"
                />
              </FormControl>
              <FormMessage className="text-[10px] uppercase tracking-tighter" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Company Name
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="h-12 bg-background/50 border-border focus:border-foreground transition-colors" 
                  placeholder="e.g. Acme Corp"
                />
              </FormControl>
              <FormMessage className="text-[10px] uppercase tracking-tighter" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Work Email
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email"
                  className="h-12 bg-background/50 border-border focus:border-foreground transition-colors" 
                  placeholder="john@company.com"
                />
              </FormControl>
              <FormMessage className="text-[10px] uppercase tracking-tighter" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Project Requirements
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  className="resize-none bg-background/50 border-border focus:border-foreground transition-colors"
                  placeholder="Describe your production needs, fabric preferences, or specific timeline requirements..."
                />
              </FormControl>
              <FormMessage className="text-[10px] uppercase tracking-tighter" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
