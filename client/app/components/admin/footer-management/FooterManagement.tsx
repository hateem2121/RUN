import type { FooterConfiguration } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building2,
  Link,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Settings2,
  Share2,
  ShieldCheck,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export default function FooterManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: footerConfig, isLoading } = useQuery<FooterConfiguration>({
    queryKey: ["/api/footer"],
    select: (data) => (Array.isArray(data) ? data[0] : (data as any)?.data?.[0] || data),
  });

  const { register, control, handleSubmit, reset, watch } = useForm<FooterConfiguration>({
    defaultValues: {
      contactFormHeading: "GET IN TOUCH WITH RUN APPAREL",
      contactFormEnabled: true,
      navigationColumns: [],
      socialLinks: [],
      legalLinks: [],
      certificateIds: [],
      companyName: "RUN APPAREL (PVT) LTD",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      brandText: "RUN APPAREL",
      brandTagline: "",
      brandSubtext: "",
    },
  });

  // Field Arrays for Dynamic Lists
  const {
    fields: navColumns,
    append: appendNav,
    remove: removeNav,
  } = useFieldArray({
    control,
    name: "navigationColumns",
  });

  const {
    fields: socialLinks,
    append: appendSocial,
    remove: removeSocial,
  } = useFieldArray({
    control,
    name: "socialLinks",
  });

  const {
    fields: legalLinks,
    append: appendLegal,
    remove: removeLegal,
  } = useFieldArray({
    control,
    name: "legalLinks",
  });

  useEffect(() => {
    if (footerConfig) {
      reset(footerConfig);
    }
  }, [footerConfig, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FooterConfiguration>) =>
      apiRequest("/api/admin/footer", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/footer"] });
      toast({ title: "Footer configuration updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update footer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FooterConfiguration) => {
    // Clean up IDs before saving to avoid primary key issues
    const { id, createdAt, updatedAt, ...payload } = data as any;
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading footer configuration...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Footer Management</h2>
          <p className="text-muted-foreground">
            Configure public footer content, links, and branding.
          </p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center gap-2">
            <Link className="h-4 w-4" /> Links
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Social
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Type className="h-4 w-4" /> Branding
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* General Tab */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Company Information
                </CardTitle>
                <CardDescription>Main contact details displayed in the footer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Legal Entity Name</Label>
                    <Input id="companyName" {...register("companyName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                      <Input id="companyEmail" className="pl-10" {...register("companyEmail")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                      <Input id="companyPhone" className="pl-10" {...register("companyPhone")} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Physical Address</Label>
                  <div className="relative">
                    <MapPin className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="companyAddress"
                      className="min-h-[100px] pl-10"
                      {...register("companyAddress")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Lead Generation Form
                </CardTitle>
                <CardDescription>Configure the "Start Your Order" section.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="contactFormEnabled" className="flex flex-col gap-1">
                    <span>Show Order Form</span>
                    <span className="font-normal text-muted-foreground text-sm">
                      Enable/disable the global lead generation form in footer.
                    </span>
                  </Label>
                  <Switch
                    id="contactFormEnabled"
                    checked={watch("contactFormEnabled")}
                    onCheckedChange={(val) => reset({ ...watch(), contactFormEnabled: val })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactFormHeading">Form Heading</Label>
                  <Input id="contactFormHeading" {...register("contactFormHeading")} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendNav({ title: "New Column", links: [] })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Column
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {navColumns.map((field, index) => (
                <Card key={field.id} className="relative overflow-visible">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full border bg-background text-destructive hover:bg-destructive/10"
                    onClick={() => removeNav(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-4">
                    <Input
                      className="font-bold text-lg"
                      placeholder="Column Title"
                      {...register(`navigationColumns.${index}.title` as const)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <NavigationLinksEditor control={control} index={index} register={register} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Legal & Policy Links
                </CardTitle>
                <CardDescription>
                  Small links appearing at the very bottom (Privacy, Terms).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {legalLinks.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Label"
                      {...register(`legalLinks.${index}.label` as const)}
                    />
                    <Input placeholder="URL" {...register(`legalLinks.${index}.href` as const)} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLegal(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => appendLegal({ label: "", href: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Legal Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Social Media Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {socialLinks.map((field, index) => (
                  <div
                    key={field.id}
                    className="items-end grid grid-cols-1 gap-4 border-b pb-6 md:grid-cols-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-2">
                      <Label>Platform Name</Label>
                      <Input
                        placeholder="e.g. Instagram"
                        {...register(`socialLinks.${index}.name` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon Name (Lucide/Tabler)</Label>
                      <Input
                        placeholder="e.g. Instagram"
                        {...register(`socialLinks.${index}.icon` as const)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label>Profile URL</Label>
                      <Input
                        placeholder="https://..."
                        {...register(`socialLinks.${index}.href` as const)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label>Hover Color (Tailwind/Hex)</Label>
                        <Input
                          placeholder="e.g. text-pink-500"
                          {...register(`socialLinks.${index}.hoverColor` as const)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-0.5 text-destructive"
                        onClick={() => removeSocial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => appendSocial({ name: "", icon: "", href: "", hoverColor: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Social Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" /> Branding & Decorative Text
                </CardTitle>
                <CardDescription>
                  Control the massive logotype and decorative elements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brandText">Main Decorative Logotype</Label>
                  <Input id="brandText" {...register("brandText")} placeholder="RUN APPAREL" />
                  <p className="text-muted-foreground text-xs italic">
                    This is the massive parallax text behind the footer.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brandTagline">Footer Tagline</Label>
                    <Input id="brandTagline" {...register("brandTagline")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandSubtext">Copyright / Small Subtext</Label>
                    <Input id="brandSubtext" {...register("brandSubtext")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}

// Sub-component for dynamic links within a column
function NavigationLinksEditor({ control, index, register }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `navigationColumns.${index}.links`,
  });

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Links</Label>
      {fields.map((linkField, linkIndex) => (
        <div key={linkField.id} className="flex gap-2">
          <Input
            className="h-8 text-sm"
            placeholder="Label"
            {...register(`navigationColumns.${index}.links.${linkIndex}.label` as const)}
          />
          <Input
            className="h-8 text-sm"
            placeholder="HREF/ID"
            {...register(`navigationColumns.${index}.links.${linkIndex}.href` as const)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => remove(linkIndex)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1 h-7 w-full border border-dashed text-xs"
        onClick={() => append({ label: "", href: "" })}
      >
        <Plus className="mr-1 h-3 w-3" /> Add Link
      </Button>
    </div>
  );
}
