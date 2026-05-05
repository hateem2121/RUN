import type { FooterConfiguration } from "@shared/index";
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
import {
  type Control,
  Controller,
  type UseFormRegister,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function FooterManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: footerConfig, isLoading } = useQuery<
    FooterConfiguration,
    Error,
    FooterConfiguration | undefined
  >({
    queryKey: ["/api/footer"],
    select: (data: unknown) => {
      // Handle different API response structures with a discriminated type approach
      type FooterApiResponse =
        | FooterConfiguration
        | FooterConfiguration[]
        | { data: FooterConfiguration[] };
      const response = data as FooterApiResponse;

      if (Array.isArray(response)) {
        return response[0];
      }
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return response.data[0];
      }
      return response as FooterConfiguration;
    },
  });

  const { register, control, handleSubmit, reset } = useForm<FooterConfiguration>({
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
    const { id, createdAt, updatedAt, ...payload } = data;
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-admin-muted">Loading footer configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight text-white">Footer Management</h2>
          <p className="text-admin-muted">Configure public footer content, links, and branding.</p>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] font-bold uppercase tracking-widest text-xxs h-11 px-6 transition-all active:scale-95 border-0"
        >
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger
            value="general"
            className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all h-9"
          >
            <Settings2 className="h-4 w-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger
            value="navigation"
            className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all h-9"
          >
            <Link className="h-4 w-4 mr-2" /> Links
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all h-9"
          >
            <Share2 className="h-4 w-4 mr-2" /> Social
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all h-9"
          >
            <Type className="h-4 w-4 mr-2" /> Branding
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* General Tab */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="h-5 w-5 text-blue-400" /> Company Information
                </CardTitle>
                <CardDescription className="text-admin-muted">
                  Main contact details displayed in the footer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-white/90">
                      Legal Entity Name
                    </Label>
                    <Input
                      id="companyName"
                      {...register("companyName")}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail" className="text-white/90">
                      Contact Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-5 w-5 text-admin-muted" />
                      <Input
                        id="companyEmail"
                        className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                        {...register("companyEmail")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone" className="text-white/90">
                      Contact Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute top-3 left-3 h-5 w-5 text-admin-muted" />
                      <Input
                        id="companyPhone"
                        className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                        {...register("companyPhone")}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress" className="text-white/90">
                    Physical Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute top-3 left-3 h-5 w-5 text-admin-muted" />
                    <Textarea
                      id="companyAddress"
                      className="min-h-[100px] pl-10 pt-3 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50"
                      {...register("companyAddress")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-blue-400" /> Lead Generation Form
                </CardTitle>
                <CardDescription className="text-admin-muted">
                  Configure the "Start Your Order" section.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between space-x-2 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <Label
                    htmlFor="contactFormEnabled"
                    className="flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-white font-medium">Show Order Form</span>
                    <span className="font-normal text-admin-muted text-sm">
                      Enable/disable the global lead generation form in footer.
                    </span>
                  </Label>
                  <Controller
                    control={control}
                    name="contactFormEnabled"
                    render={({ field }) => (
                      <Switch
                        id="contactFormEnabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    )}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="contactFormHeading" className="text-white/90">
                    Form Heading
                  </Label>
                  <Input
                    id="contactFormHeading"
                    {...register("contactFormHeading")}
                    className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                  />
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
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-4 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Column
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {navColumns.map((field, index) => (
                <Card
                  key={field.id}
                  className="relative overflow-visible border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full border border-red-500/20 bg-black/60 text-red-500 hover:bg-red-500/20 hover:text-red-400 z-10"
                    onClick={() => removeNav(index)}
                    aria-label={`Remove ${field.title || "navigation column"}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-4 border-b border-white/5">
                    <Input
                      className="font-bold text-lg bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
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

            <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-blue-400" /> Legal & Policy Links
                </CardTitle>
                <CardDescription className="text-admin-muted">
                  Small links appearing at the very bottom (Privacy, Terms).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {legalLinks.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Label"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                      {...register(`legalLinks.${index}.label` as const)}
                    />
                    <Input
                      placeholder="URL"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                      {...register(`legalLinks.${index}.href` as const)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-xl"
                      onClick={() => removeLegal(index)}
                      aria-label="Remove legal link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 transition-colors"
                  onClick={() => appendLegal({ label: "", href: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Legal Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-6 space-y-4">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Share2 className="h-5 w-5 text-blue-400" /> Social Media Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {socialLinks.map((field, index) => (
                  <div
                    key={field.id}
                    className="items-end grid grid-cols-1 gap-4 border-b border-white/10 pb-6 md:grid-cols-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-2">
                      <Label className="text-white/90">Platform Name</Label>
                      <Input
                        placeholder="e.g. Instagram"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                        {...register(`socialLinks.${index}.name` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">Icon Name (Lucide/Tabler)</Label>
                      <Input
                        placeholder="e.g. Instagram"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                        {...register(`socialLinks.${index}.icon` as const)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-white/90">Profile URL</Label>
                      <Input
                        placeholder="https://..."
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                        {...register(`socialLinks.${index}.href` as const)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label className="text-white/90">Hover Color</Label>
                        <Input
                          placeholder="text-pink-500"
                          className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                          {...register(`socialLinks.${index}.hoverColor` as const)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 mb-0.5 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-xl"
                        onClick={() => removeSocial(index)}
                        aria-label={`Remove ${field.name || "social profile"}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 transition-colors"
                  onClick={() => appendSocial({ name: "", icon: "", href: "", hoverColor: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Social Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="mt-6 space-y-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Type className="h-5 w-5 text-blue-400" /> Branding & Decorative Text
                </CardTitle>
                <CardDescription className="text-admin-muted">
                  Control the massive logotype and decorative elements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="brandText" className="text-white/90">
                    Main Decorative Logotype
                  </Label>
                  <Input
                    id="brandText"
                    {...register("brandText")}
                    placeholder="RUN APPAREL"
                    className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                  />
                  <p className="text-admin-muted text-xs italic">
                    This is the massive parallax text behind the footer.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brandTagline" className="text-white/90">
                      Footer Tagline
                    </Label>
                    <Input
                      id="brandTagline"
                      {...register("brandTagline")}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandSubtext" className="text-white/90">
                      Copyright / Small Subtext
                    </Label>
                    <Input
                      id="brandSubtext"
                      {...register("brandSubtext")}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
                    />
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
interface NavigationLinksEditorProps {
  control: Control<FooterConfiguration>;
  index: number;
  register: UseFormRegister<FooterConfiguration>;
}

function NavigationLinksEditor({ control, index, register }: NavigationLinksEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `navigationColumns.${index}.links`,
  });

  return (
    <div className="space-y-2 mt-4">
      <Label className="text-admin-muted text-xs uppercase tracking-wider">Links</Label>
      {fields.map((linkField, linkIndex) => (
        <div key={linkField.id} className="flex gap-2">
          <Input
            className="h-9 text-sm bg-white/5 border-white/10 text-white rounded-lg focus:ring-blue-500/50"
            placeholder="Label"
            {...register(`navigationColumns.${index}.links.${linkIndex}.label` as const)}
          />
          <Input
            className="h-9 text-sm bg-white/5 border-white/10 text-white rounded-lg focus:ring-blue-500/50"
            placeholder="HREF/ID"
            {...register(`navigationColumns.${index}.links.${linkIndex}.href` as const)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
            onClick={() => remove(linkIndex)}
            aria-label="Remove link"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-9 w-full border border-dashed border-white/20 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/40 text-xs rounded-lg transition-all"
        onClick={() => append({ label: "", href: "" })}
      >
        <Plus className="mr-1 h-3 w-3" /> Add Link
      </Button>
    </div>
  );
}
