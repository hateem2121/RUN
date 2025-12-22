import type { Certificate, FooterConfiguration } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Award, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { CertificateSelectionDialog } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

// Helper types inferred from the JSON structure in schema or defined explicitly
// Since schema uses jsonb.$type, we can rely on FooterConfiguration for the main structure,
// but might need to assert inner types if Drizzle inference is generic.

// We define the specific shape of the populated config here for the frontend
interface PopulatedFooterConfiguration extends FooterConfiguration {
  certifications?: Certificate[];
}

// Extracting inner types from the defined valid shape in the code logic
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  icon: string;
  href: string;
  hoverColor: string;
}

// Certification type is imported from schema

export default function FooterManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isCertPickerOpen, setIsCertPickerOpen] = useState(false);

  const { data: config, isLoading } = useQuery<PopulatedFooterConfiguration>({
    queryKey: ["/api/admin/footer"],
    staleTime: 0,
  });

  const [formData, setFormData] = useState<PopulatedFooterConfiguration | null>(null);

  if (!formData && config) {
    setFormData(config);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PopulatedFooterConfiguration>) => {
      return await apiRequest("/api/admin/footer", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/admin/footer"] });
      toast({
        title: "Success",
        description: "Footer configuration updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update footer configuration",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (formData) {
      // Extract only the fields needed for the API (certificateIds, not certifications array)
      const { certifications, ...dataToSave } = formData;
      updateMutation.mutate(dataToSave);
    }
  };

  const addNavigationColumn = () => {
    if (formData) {
      setFormData({
        ...formData,
        navigationColumns: [...formData.navigationColumns, { title: "New Column", links: [] }],
      });
    }
  };

  const updateNavigationColumn = (index: number, column: FooterColumn) => {
    if (formData) {
      const columns = [...formData.navigationColumns];
      columns[index] = column;
      setFormData({ ...formData, navigationColumns: columns });
    }
  };

  const removeNavigationColumn = (index: number) => {
    if (formData) {
      const columns = formData.navigationColumns.filter((_, i) => i !== index);
      setFormData({ ...formData, navigationColumns: columns });
    }
  };

  const addColumnLink = (columnIndex: number) => {
    if (formData) {
      const columns = [...formData.navigationColumns];
      columns[columnIndex] = {
        ...columns[columnIndex]!,
        links: [...columns[columnIndex]!.links, { label: "New Link", href: "/", external: false }],
      };
      setFormData({ ...formData, navigationColumns: columns });
    }
  };

  const updateColumnLink = (columnIndex: number, linkIndex: number, link: FooterLink) => {
    if (formData) {
      const columns = [...formData.navigationColumns];
      columns[columnIndex]!.links[linkIndex] = link;
      setFormData({ ...formData, navigationColumns: columns });
    }
  };

  const removeColumnLink = (columnIndex: number, linkIndex: number) => {
    if (formData) {
      const columns = [...formData.navigationColumns];
      columns[columnIndex]!.links = columns[columnIndex]!.links.filter((_, i) => i !== linkIndex);
      setFormData({ ...formData, navigationColumns: columns });
    }
  };

  const addSocialLink = () => {
    if (formData) {
      setFormData({
        ...formData,
        socialLinks: [
          ...formData.socialLinks,
          { name: "New Social", icon: "Mail", href: "", hoverColor: "hover:text-gray-600" },
        ],
      });
    }
  };

  const updateSocialLink = (index: number, link: SocialLink) => {
    if (formData) {
      const links = [...formData.socialLinks];
      links[index] = link;
      setFormData({ ...formData, socialLinks: links });
    }
  };

  const removeSocialLink = (index: number) => {
    if (formData) {
      const links = formData.socialLinks.filter((_, i) => i !== index);
      setFormData({ ...formData, socialLinks: links });
    }
  };

  const handleCertificateSelection = (selectedCerts: Certificate[] | Certificate) => {
    if (formData) {
      const certArray = Array.isArray(selectedCerts) ? selectedCerts : [selectedCerts];
      const certIds = certArray.map((cert) => cert.id);

      setFormData({
        ...formData,
        certificateIds: certIds,
        certifications: certArray,
      });
    }
  };

  const removeCertificate = (certId: number) => {
    if (formData) {
      const updatedCertIds = (formData.certificateIds || []).filter((id) => id !== certId);
      const updatedCerts = (formData.certifications || []).filter((cert) => cert.id !== certId);

      setFormData({
        ...formData,
        certificateIds: updatedCertIds,
        certifications: updatedCerts,
      });
    }
  };

  const addLegalLink = () => {
    if (formData) {
      setFormData({
        ...formData,
        legalLinks: [...formData.legalLinks, { label: "New Legal Link", href: "/" }],
      });
    }
  };

  const updateLegalLink = (index: number, link: FooterLink) => {
    if (formData) {
      const links = [...formData.legalLinks];
      links[index] = link;
      setFormData({ ...formData, legalLinks: links });
    }
  };

  const removeLegalLink = (index: number) => {
    if (formData) {
      const links = formData.legalLinks.filter((_, i) => i !== index);
      setFormData({ ...formData, legalLinks: links });
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading footer configuration...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="footer-management-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">
            Footer Configuration
          </h1>
          <p className="text-gray-500 mt-1">Manage all footer content and settings</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="save-button">
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" data-testid="tab-general">
            General
          </TabsTrigger>
          <TabsTrigger value="navigation" data-testid="tab-navigation">
            Navigation
          </TabsTrigger>
          <TabsTrigger value="social" data-testid="tab-social">
            Social Links
          </TabsTrigger>
          <TabsTrigger value="company" data-testid="tab-company">
            Company Info
          </TabsTrigger>
          <TabsTrigger value="branding" data-testid="tab-branding">
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Form Settings</CardTitle>
              <CardDescription>Configure the footer contact form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="contact-form-enabled"
                  checked={formData.contactFormEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, contactFormEnabled: checked })
                  }
                  data-testid="contact-form-toggle"
                />
                <Label htmlFor="contact-form-enabled">Enable Contact Form</Label>
              </div>

              <div>
                <Label htmlFor="contact-form-heading">Contact Form Heading</Label>
                <Input
                  id="contact-form-heading"
                  value={formData.contactFormHeading}
                  onChange={(e) => setFormData({ ...formData, contactFormHeading: e.target.value })}
                  placeholder="GET IN TOUCH WITH RUN APPAREL"
                  data-testid="contact-form-heading-input"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Select certificates to display in footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.certifications && formData.certifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      data-testid={`certificate-preview-${cert.id}`}
                    >
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        {cert.imageUrl ? (
                          <img
                            src={cert.imageUrl}
                            alt={cert.name}
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <Award className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cert.name}</p>
                        {cert.type && (
                          <p className="text-xs text-muted-foreground truncate">{cert.type}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertificate(cert.id)}
                        data-testid={`certificate-remove-${cert.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No certificates selected
                </p>
              )}
              <Button
                onClick={() => setIsCertPickerOpen(true)}
                variant="outline"
                className="w-full"
                data-testid="certificate-select-button"
              >
                <Award className="w-4 h-4 mr-2" />
                Select Certificates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal Links</CardTitle>
              <CardDescription>Privacy, terms, and other legal links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.legalLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLegalLink(index, { ...link, label: e.target.value })}
                    placeholder="Label"
                    data-testid={`legal-link-label-${index}`}
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => updateLegalLink(index, { ...link, href: e.target.value })}
                    placeholder="URL"
                    data-testid={`legal-link-href-${index}`}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeLegalLink(index)}
                    data-testid={`legal-link-remove-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={addLegalLink}
                variant="outline"
                className="w-full"
                data-testid="legal-link-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Legal Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          {formData.navigationColumns.map((column, columnIndex) => (
            <Card key={columnIndex}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center flex-1">
                    <Input
                      value={column.title}
                      onChange={(e) =>
                        updateNavigationColumn(columnIndex, { ...column, title: e.target.value })
                      }
                      placeholder="Column Title"
                      className="max-w-xs"
                      data-testid={`nav-column-title-${columnIndex}`}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeNavigationColumn(columnIndex)}
                    data-testid={`nav-column-remove-${columnIndex}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateColumnLink(columnIndex, linkIndex, { ...link, label: e.target.value })
                      }
                      placeholder="Link label"
                      data-testid={`nav-link-label-${columnIndex}-${linkIndex}`}
                    />
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateColumnLink(columnIndex, linkIndex, { ...link, href: e.target.value })
                      }
                      placeholder="URL"
                      data-testid={`nav-link-href-${columnIndex}-${linkIndex}`}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.external || false}
                        onCheckedChange={(checked) =>
                          updateColumnLink(columnIndex, linkIndex, { ...link, external: checked })
                        }
                        data-testid={`nav-link-external-${columnIndex}-${linkIndex}`}
                      />
                      <Label className="text-xs">External</Label>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeColumnLink(columnIndex, linkIndex)}
                      data-testid={`nav-link-remove-${columnIndex}-${linkIndex}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => addColumnLink(columnIndex)}
                  variant="outline"
                  className="w-full"
                  data-testid={`nav-link-add-${columnIndex}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button
            onClick={addNavigationColumn}
            variant="outline"
            className="w-full"
            data-testid="nav-column-add"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Navigation Column
          </Button>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Configure social media icons and links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.socialLinks.map((link, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <Input
                    value={link.name}
                    onChange={(e) => updateSocialLink(index, { ...link, name: e.target.value })}
                    placeholder="Name"
                    data-testid={`social-link-name-${index}`}
                  />
                  <Input
                    value={link.icon}
                    onChange={(e) => updateSocialLink(index, { ...link, icon: e.target.value })}
                    placeholder="Icon (Linkedin, Instagram, etc.)"
                    data-testid={`social-link-icon-${index}`}
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => updateSocialLink(index, { ...link, href: e.target.value })}
                    placeholder="URL"
                    data-testid={`social-link-href-${index}`}
                  />
                  <div className="flex gap-2">
                    <Input
                      value={link.hoverColor}
                      onChange={(e) =>
                        updateSocialLink(index, { ...link, hoverColor: e.target.value })
                      }
                      placeholder="hover:text-blue-700"
                      className="flex-1"
                      data-testid={`social-link-color-${index}`}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      data-testid={`social-link-remove-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                onClick={addSocialLink}
                variant="outline"
                className="w-full"
                data-testid="social-link-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Social Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Contact details displayed in the footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  data-testid="company-name-input"
                />
              </div>
              <div>
                <Label htmlFor="company-address">Address</Label>
                <Textarea
                  id="company-address"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  rows={2}
                  data-testid="company-address-input"
                />
              </div>
              <div>
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  data-testid="company-phone-input"
                />
              </div>
              <div>
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  data-testid="company-email-input"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Typography</CardTitle>
              <CardDescription>
                Large brand text displayed at the bottom of the footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand-text">Brand Text</Label>
                <Input
                  id="brand-text"
                  value={formData.brandText}
                  onChange={(e) => setFormData({ ...formData, brandText: e.target.value })}
                  placeholder="RUN APPAREL"
                  data-testid="brand-text-input"
                />
              </div>
              <div>
                <Label htmlFor="brand-tagline">Brand Tagline</Label>
                <Input
                  id="brand-tagline"
                  value={formData.brandTagline}
                  onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
                  placeholder="Ethically Engineered • Sustainably Crafted"
                  data-testid="brand-tagline-input"
                />
              </div>
              <div>
                <Label htmlFor="brand-subtext">Brand Subtext</Label>
                <Input
                  id="brand-subtext"
                  value={formData.brandSubtext}
                  onChange={(e) => setFormData({ ...formData, brandSubtext: e.target.value })}
                  placeholder="A subsidiary of Durus Industries"
                  data-testid="brand-subtext-input"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Certificate Selection Dialog */}
      <CertificateSelectionDialog
        isOpen={isCertPickerOpen}
        onClose={() => setIsCertPickerOpen(false)}
        onSelect={handleCertificateSelection}
        title="Select Footer Certificates"
        selectionMode="multiple"
        maxSelection={8}
        initialSelectedIds={formData?.certificateIds || []}
      />
    </div>
  );
}
