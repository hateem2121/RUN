import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface CtaFormData {
  headline: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  benefits: string[];
  isActive: boolean;
}

interface TechnologyCta {
  id: number;
  headline: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  benefits: string[];
  isActive?: boolean;
}

interface TechnologyCtaManagementProps {
  isLoading?: boolean;
}

export function TechnologyCtaManagement({ isLoading: externalLoading }: TechnologyCtaManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [ctaForm, setCtaForm] = useState<CtaFormData>({
    headline: "",
    content: "",
    buttonText: "",
    buttonLink: "",
    benefits: [],
    isActive: true,
  });

  const [newBenefit, setNewBenefit] = useState("");

  // Queries and Mutations
  const { data: ctaData, isPending: ctaLoading } = useQuery<TechnologyCta>({
    queryKey: ["/api/technology-cta"],
  });

  const updateCtaMutation = useMutation({
    mutationFn: (data: CtaFormData) =>
      apiRequest("/api/technology-cta", {
        method: "PATCH",
        body: {
          title: data.headline,
          content: data.content,
          ctaText: data.buttonText,
          ctaLink: data.buttonLink,
          benefits: data.benefits,
          isActive: data.isActive,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-cta"] });
      toast({
        title: "Success",
        description: "CTA section updated successfully",
      });
    },
  });

  // Set initial data when CTA loads
  React.useEffect(() => {
    if (ctaData) {
      setCtaForm({
        headline: (ctaData as any).title || ctaData.headline || "",
        content: ctaData.content || "",
        buttonText: (ctaData as any).ctaText || ctaData.buttonText || "",
        buttonLink: (ctaData as any).ctaLink || ctaData.buttonLink || "",
        benefits: ctaData.benefits || [],
        isActive: ctaData.isActive ?? true,
      });
    }
  }, [ctaData]);

  // Event Handlers
  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCtaMutation.mutate(ctaForm);
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setCtaForm(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setCtaForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const loading = externalLoading || ctaLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call-to-Action Section</CardTitle>
        <CardDescription>
          Configure the main CTA section that replaces the Technology Solution area
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 h-10 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleCtaSubmit} className="space-y-6">
            {/* Headline */}
            <div>
              <Label htmlFor="cta-headline">Headline</Label>
              <Input
                id="cta-headline"
                type="text"
                value={ctaForm.headline}
                onChange={(e) => setCtaForm(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="Get Started Today"
                required
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="cta-content">Content</Label>
              <Textarea
                id="cta-content"
                value={ctaForm.content}
                onChange={(e) => setCtaForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe your call-to-action message..."
                rows={4}
                required
              />
            </div>

            {/* Button Configuration */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="cta-button-text">Button Text</Label>
                <Input
                  id="cta-button-text"
                  type="text"
                  value={ctaForm.buttonText}
                  onChange={(e) => setCtaForm(prev => ({ ...prev, buttonText: e.target.value }))}
                  placeholder="Contact Us"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cta-button-link">Button Link</Label>
                <Input
                  id="cta-button-link"
                  type="text"
                  value={ctaForm.buttonLink}
                  onChange={(e) => setCtaForm(prev => ({ ...prev, buttonLink: e.target.value }))}
                  placeholder="/contact or https://..."
                  required
                />
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-4">
              <Label>Key Benefits</Label>

              {/* Existing Benefits */}
              {ctaForm.benefits.length > 0 && (
                <div className="space-y-2">
                  {ctaForm.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBenefit(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Benefit */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a key benefit..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddBenefit}
                  disabled={!newBenefit.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="cta-active"
                checked={ctaForm.isActive}
                onCheckedChange={(checked) => setCtaForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="cta-active">Show CTA Section</Label>
            </div>

            {/* Save Button */}
            <Button type="submit" disabled={updateCtaMutation.isPending}>
              {updateCtaMutation.isPending ? "Saving..." : "Save CTA Settings"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}