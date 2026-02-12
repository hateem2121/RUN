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
      <form id="inquiry-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contact.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                Full Name
              </FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                Company Name
              </FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                Work Email
              </FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact.projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-1 block font-medium text-slate-700 text-sm">
                Project Description (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  className="resize-none bg-white"
                  placeholder="Tell us about your project requirements..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
