import type { Category, InsertCategory, MediaAsset } from "@shared/schema";
import { FileText, Search, Star } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { MediaUrlBuilder } from "@/lib/media-url-builder";

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InsertCategory) => void;
  initialData?: Category | null;
  categories?: Category[];
  isLoading?: boolean | undefined;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string;
  bannerUrl: string;
  metaTitle: string;
  metaDescription: string;
  featuredContent: {
    card1: {
      title: string;
      description: string;
      mediaUrl: string;
      link: string;
      maskSvgUrl?: string | undefined; // New SVG mask field
      contentMediaUrl?: string | undefined; // New content media field
    };
    card2: {
      title: string;
      description: string;
      mediaUrl: string;
      link: string;
      expandedContent?: Array<{ title: string; text: string }>;
    };
    card3: {
      title: string;
      description: string;
      mediaUrl: string;
      link: string;
      subtitle?: string | undefined;
      features?: string[];
    };
    card4: {
      title: string;
      description: string;
      mediaUrl: string;
      link: string;
    };
  };
}

export default function CategoryForm({
  open,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  isLoading = false,
  mode = "create",
}: CategoryFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    sortOrder: 0,
    isActive: true,
    imageUrl: "",
    bannerUrl: "",
    metaTitle: "",
    metaDescription: "",
    featuredContent: {
      card1: {
        title: "",
        description: "",
        mediaUrl: "",
        link: "",
        maskSvgUrl: "",
        contentMediaUrl: "",
      },
      card2: {
        title: "",
        description: "",
        mediaUrl: "",
        link: "",
        expandedContent: [],
      },
      card3: {
        title: "",
        description: "",
        mediaUrl: "",
        link: "",
        subtitle: "",
        features: [],
      },
      card4: { title: "", description: "", mediaUrl: "", link: "" },
    },
  });

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        parentId: initialData.parentId?.toString() || "none",
        sortOrder: initialData.sortOrder || 0,
        isActive: initialData.isActive !== false,
        imageUrl: (initialData as Category & { imageUrl?: string }).imageUrl || "",
        bannerUrl: (initialData as Category & { bannerUrl?: string }).bannerUrl || "",
        metaTitle: (initialData as Category & { metaTitle?: string }).metaTitle || "",
        metaDescription:
          (initialData as Category & { metaDescription?: string }).metaDescription || "",
        featuredContent: ((initialData as Category & { featuredContent?: unknown })
          .featuredContent as FormData["featuredContent"]) || {
          card1: { title: "", description: "", mediaUrl: "", link: "" },
          card2: {
            title: "",
            description: "",
            mediaUrl: "",
            link: "",
            expandedContent: [],
          },
          card3: {
            title: "",
            description: "",
            mediaUrl: "",
            link: "",
            subtitle: "",
            features: [],
          },
          card4: { title: "", description: "", mediaUrl: "", link: "" },
        },
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: "",
        slug: "",
        description: "",
        parentId: "none",
        sortOrder: 0,
        isActive: true,
        imageUrl: "",
        bannerUrl: "",
        metaTitle: "",
        metaDescription: "",
        featuredContent: {
          card1: { title: "", description: "", mediaUrl: "", link: "" },
          card2: {
            title: "",
            description: "",
            mediaUrl: "",
            link: "",
            expandedContent: [],
          },
          card3: {
            title: "",
            description: "",
            mediaUrl: "",
            link: "",
            subtitle: "",
            features: [],
          },
          card4: { title: "", description: "", mediaUrl: "", link: "" },
        },
      });
    }
  }, [initialData]);

  // Auto-generate slug from name
  useEffect(() => {
    if (mode === "create" && formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, mode, formData.slug]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateFeaturedCard = (
    cardIndex: number,
    updates: Partial<FormData["featuredContent"]["card1"]>,
  ) => {
    const cardKey = `card${cardIndex + 1}` as keyof FormData["featuredContent"];
    setFormData((prev) => ({
      ...prev,
      featuredContent: {
        ...prev.featuredContent,
        [cardKey]: { ...prev.featuredContent[cardKey], ...updates },
      },
    }));
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Basic validation
      if (!formData.name.trim() || !formData.slug.trim()) {
        return;
      }

      // Convert parentId to number or null and clean up data
      const submitData = {
        ...formData,
        parentId:
          formData.parentId && formData.parentId !== "none"
            ? parseInt(formData.parentId, 10)
            : null,
        // Ensure featuredContent is properly structured with validation
        featuredContent: {
          card1: {
            title: (formData.featuredContent.card1.title || "").trim(),
            description: (formData.featuredContent.card1.description || "").trim(),
            mediaUrl:
              formData.featuredContent.card1.mediaUrl &&
              formData.featuredContent.card1.mediaUrl !== "undefined"
                ? formData.featuredContent.card1.mediaUrl.trim()
                : "",
            link: (formData.featuredContent.card1.link || "").trim(),
            // Enhanced Card 1 dual media fields
            maskSvgUrl:
              formData.featuredContent.card1.maskSvgUrl &&
              formData.featuredContent.card1.maskSvgUrl !== "undefined"
                ? formData.featuredContent.card1.maskSvgUrl.trim()
                : "",
            contentMediaUrl:
              formData.featuredContent.card1.contentMediaUrl &&
              formData.featuredContent.card1.contentMediaUrl !== "undefined"
                ? formData.featuredContent.card1.contentMediaUrl.trim()
                : "",
          },
          card2: {
            title: (formData.featuredContent.card2.title || "").trim(),
            description: (formData.featuredContent.card2.description || "").trim(),
            mediaUrl:
              formData.featuredContent.card2.mediaUrl &&
              formData.featuredContent.card2.mediaUrl !== "undefined"
                ? formData.featuredContent.card2.mediaUrl.trim()
                : "",
            link: (formData.featuredContent.card2.link || "").trim(),
            expandedContent: formData.featuredContent.card2.expandedContent || [],
          },
          card3: {
            title: (formData.featuredContent.card3.title || "").trim(),
            description: (formData.featuredContent.card3.description || "").trim(),
            mediaUrl:
              formData.featuredContent.card3.mediaUrl &&
              formData.featuredContent.card3.mediaUrl !== "undefined"
                ? formData.featuredContent.card3.mediaUrl.trim()
                : "",
            link: (formData.featuredContent.card3.link || "").trim(),
            subtitle: (formData.featuredContent.card3.subtitle || "").trim(),
            features: formData.featuredContent.card3.features || [],
          },
          card4: {
            title: (formData.featuredContent.card4.title || "").trim(),
            description: (formData.featuredContent.card4.description || "").trim(),
            mediaUrl:
              formData.featuredContent.card4.mediaUrl &&
              formData.featuredContent.card4.mediaUrl !== "undefined"
                ? formData.featuredContent.card4.mediaUrl.trim()
                : "",
            link: (formData.featuredContent.card4.link || "").trim(),
          },
        },
      };

      onSubmit(submitData);
    },
    [formData, onSubmit],
  );

  const handleMediaSelect = (mediaUrl: string) => {
    if (mediaUrl && mediaPickerTarget) {
      // Handle Card 1 dual media selection
      if (mediaPickerTarget === "card1-svg") {
        updateFeaturedCard(0, { maskSvgUrl: mediaUrl });
      } else if (mediaPickerTarget === "card1-media") {
        updateFeaturedCard(0, { contentMediaUrl: mediaUrl });
      } else if (mediaPickerTarget.startsWith("card")) {
        // Standard card media selection
        const cardIndex = parseInt(mediaPickerTarget.replace("card", ""), 10) - 1;
        updateFeaturedCard(cardIndex, { mediaUrl });
      } else {
        // Basic form fields (imageUrl, bannerUrl)
        updateFormData({ [mediaPickerTarget]: mediaUrl });
      }
    }
    setIsMediaPickerOpen(false);
    setMediaPickerTarget("");
  };

  const handleStandardMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) {
      return;
    }

    const mediaUrl = MediaUrlBuilder.buildContentUrl(asset.id);
    if (mediaUrl) {
      handleMediaSelect(mediaUrl);
    }
  };

  const openMediaPicker = (target: string, mediaType?: string) => {
    // Handle Card 1 dual media selection
    if (target === "card1" && mediaType) {
      if (mediaType === "svg") {
        setMediaPickerTarget("card1-svg");
      } else if (mediaType === "media") {
        setMediaPickerTarget("card1-media");
      } else {
        setMediaPickerTarget(target);
      }
    } else {
      setMediaPickerTarget(target);
    }
    setIsMediaPickerOpen(true);
  };

  const isValid = formData.name.trim() !== "" && formData.slug.trim() !== "";

  const handleManualSubmit = useCallback(() => {
    if (isValid) {
      const e = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(e);
    }
  }, [isValid, handleSubmit]);

  useHotkeys("s", handleManualSubmit, { enabled: open });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="pointer-events-auto z-modal" contentType="form">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger value="featured" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Featured
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => updateFormData({ name: e.target.value })}
                            placeholder="Category name"
                            required
                            aria-required="true"
                            aria-invalid={
                              formData.name.trim() === "" && mode === "edit" ? "true" : "false"
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="slug">Slug *</Label>
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => updateFormData({ slug: e.target.value })}
                            placeholder="category-slug"
                            required
                            aria-required="true"
                            aria-invalid={
                              formData.slug.trim() === "" && mode === "edit" ? "true" : "false"
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Category description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="parentId">Parent Category</Label>
                          <Select
                            value={formData.parentId}
                            onValueChange={(value) => updateFormData({ parentId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No parent" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No parent</SelectItem>
                              {categories
                                .filter((cat) => cat.id !== initialData?.id)
                                .map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="sortOrder">Sort Order</Label>
                          <Input
                            id="sortOrder"
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) =>
                              updateFormData({
                                sortOrder: parseInt(e.target.value, 10) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => updateFormData({ isActive: checked })}
                          />
                          <Label htmlFor="isActive">Active</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SEO */}
                <TabsContent value="seo">
                  <Card>
                    <CardHeader>
                      <CardTitle>SEO Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          value={formData.metaTitle}
                          onChange={(e) => updateFormData({ metaTitle: e.target.value })}
                          placeholder="SEO title for this category"
                        />
                      </div>
                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          value={formData.metaDescription}
                          onChange={(e) => updateFormData({ metaDescription: e.target.value })}
                          placeholder="SEO description for this category"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Featured Content */}
                <TabsContent value="featured">
                  <Card>
                    <CardHeader>
                      <CardTitle>Featured Content Cards</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[0, 1, 2, 3].map((index) => {
                        const cardKey = `card${index + 1}` as keyof FormData["featuredContent"];
                        const card = formData.featuredContent[cardKey];

                        return (
                          <div key={index} className="rounded-lg border p-4">
                            <h4 className="mb-3 font-medium">Card {index + 1}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={card.title}
                                  onChange={(e) =>
                                    updateFeaturedCard(index, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Card title"
                                />
                              </div>
                              <div>
                                <Label>Link</Label>
                                <Input
                                  value={card.link}
                                  onChange={(e) =>
                                    updateFeaturedCard(index, {
                                      link: e.target.value,
                                    })
                                  }
                                  placeholder="Card link URL"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label>Description</Label>
                              <Textarea
                                value={card.description}
                                onChange={(e) =>
                                  updateFeaturedCard(index, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Card description"
                                rows={2}
                              />
                            </div>
                            {/* Enhanced Media Selection for Card 1 - Dual SVG Mask + Content */}
                            {index === 0 ? (
                              <div className="mt-4">
                                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
                                  <Label className="font-semibold text-blue-700 text-sm">
                                    🎭 Custom SVG Masking Media
                                  </Label>
                                  <p className="mb-3 text-muted-foreground text-xs">
                                    Select an SVG file for the mask shape and a video/image for the
                                    content
                                  </p>

                                  {/* SVG Mask Selection */}
                                  <div className="mb-4 space-y-2">
                                    <Label className="font-medium text-sm">SVG Mask File *</Label>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openMediaPicker("card1", "svg")}
                                        className="flex items-center gap-2"
                                      >
                                        🎭 Browse SVG Files
                                      </Button>
                                      {"maskSvgUrl" in card && card.maskSvgUrl && (
                                        <div className="rounded bg-purple-100 px-2 py-1 text-purple-800 text-xs">
                                          SVG Selected
                                        </div>
                                      )}
                                    </div>
                                    {"maskSvgUrl" in card && card.maskSvgUrl && (
                                      <div className="rounded border border-purple-200 bg-purple-50 p-2">
                                        <p className="break-all font-mono text-purple-700 text-sm">
                                          🎭 {"maskSvgUrl" in card ? card.maskSvgUrl : ""}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Content Media Selection */}
                                  <div className="space-y-2">
                                    <Label className="font-medium text-sm">
                                      Content Media File *
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openMediaPicker("card1", "media")}
                                        className="flex items-center gap-2"
                                      >
                                        🎬 Browse Video/Images
                                      </Button>
                                      {"contentMediaUrl" in card && card.contentMediaUrl && (
                                        <div className="rounded bg-green-100 px-2 py-1 text-green-800 text-xs">
                                          Content Selected
                                        </div>
                                      )}
                                    </div>
                                    {"contentMediaUrl" in card && card.contentMediaUrl && (
                                      <div className="rounded border border-green-200 bg-green-50 p-2">
                                        <p className="break-all font-mono text-green-700 text-sm">
                                          🎬 {"contentMediaUrl" in card ? card.contentMediaUrl : ""}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Clear Button */}
                                  {(("maskSvgUrl" in card && card.maskSvgUrl) ||
                                    ("contentMediaUrl" in card && card.contentMediaUrl)) && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        updateFeaturedCard(index, {
                                          maskSvgUrl: "",
                                          contentMediaUrl: "",
                                          mediaUrl: "",
                                        })
                                      }
                                      className="mt-3 text-red-600"
                                    >
                                      Clear All Media
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4">
                                <Label>Media</Label>
                                <div className="flex items-center space-x-4">
                                  {card.mediaUrl && (
                                    <img
                                      src={card.mediaUrl}
                                      alt="Card media"
                                      className="h-16 w-16 rounded object-cover"
                                    />
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => openMediaPicker(`card${index + 1}`)}
                                  >
                                    Select Media
                                  </Button>
                                  {card.mediaUrl && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() =>
                                        updateFeaturedCard(index, {
                                          mediaUrl: "",
                                        })
                                      }
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Card 2 - Expandable Content */}
                            {index === 1 && (
                              <div className="mt-4 rounded border border-green-200 bg-green-50 p-3">
                                <h5 className="mb-2 font-medium text-green-800">
                                  Expandable Content Sections
                                </h5>
                                <p className="mb-3 text-green-600 text-sm">
                                  Define sections that appear when users expand this card
                                </p>
                                {(formData.featuredContent.card2.expandedContent || []).map(
                                  (section, sectionIndex) => (
                                    <div
                                      key={sectionIndex}
                                      className="mb-3 rounded border border-green-300 bg-white p-2"
                                    >
                                      <div className="grid grid-cols-1 gap-2">
                                        <Input
                                          placeholder="Section title (e.g., Features)"
                                          value={section.title}
                                          onChange={(e) => {
                                            const newSections = [
                                              ...(formData.featuredContent.card2.expandedContent ||
                                                []),
                                            ];
                                            newSections[sectionIndex] = {
                                              title: e.target.value,
                                              text: newSections[sectionIndex]?.text || "",
                                            };
                                            setFormData((prev) => ({
                                              ...prev,
                                              featuredContent: {
                                                ...prev.featuredContent,
                                                card2: {
                                                  ...prev.featuredContent.card2,
                                                  expandedContent: newSections,
                                                },
                                              },
                                            }));
                                          }}
                                          className="text-sm"
                                        />
                                        <Textarea
                                          placeholder="Section content"
                                          value={section.text}
                                          onChange={(e) => {
                                            const newSections = [
                                              ...(formData.featuredContent.card2.expandedContent ||
                                                []),
                                            ];
                                            newSections[sectionIndex] = {
                                              title: newSections[sectionIndex]?.title || "",
                                              text: e.target.value,
                                            };
                                            setFormData((prev) => ({
                                              ...prev,
                                              featuredContent: {
                                                ...prev.featuredContent,
                                                card2: {
                                                  ...prev.featuredContent.card2,
                                                  expandedContent: newSections,
                                                },
                                              },
                                            }));
                                          }}
                                          className="text-sm"
                                          rows={2}
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newSections = (
                                            formData.featuredContent.card2.expandedContent || []
                                          ).filter((_, i) => i !== sectionIndex);
                                          setFormData((prev) => ({
                                            ...prev,
                                            featuredContent: {
                                              ...prev.featuredContent,
                                              card2: {
                                                ...prev.featuredContent.card2,
                                                expandedContent: newSections,
                                              },
                                            },
                                          }));
                                        }}
                                        className="mt-1 text-red-600 text-xs"
                                      >
                                        Remove Section
                                      </Button>
                                    </div>
                                  ),
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newSection = { title: "", text: "" };
                                    const newSections = [
                                      ...(formData.featuredContent.card2.expandedContent || []),
                                      newSection,
                                    ];
                                    setFormData((prev) => ({
                                      ...prev,
                                      featuredContent: {
                                        ...prev.featuredContent,
                                        card2: {
                                          ...prev.featuredContent.card2,
                                          expandedContent: newSections,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-full text-xs"
                                >
                                  + Add Content Section
                                </Button>
                              </div>
                            )}

                            {/* Card 3 - Flip Card Content */}
                            {index === 2 && (
                              <div className="mt-4 rounded border border-purple-200 bg-purple-50 p-3">
                                <h5 className="mb-2 font-medium text-purple-800">
                                  Flip Card Back Side Content
                                </h5>
                                <p className="mb-3 text-purple-600 text-sm">
                                  Content shown when the card is flipped
                                </p>

                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-sm">Subtitle</Label>
                                    <Input
                                      placeholder="e.g., Explore the details"
                                      value={formData.featuredContent.card3.subtitle || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          featuredContent: {
                                            ...prev.featuredContent,
                                            card3: {
                                              ...prev.featuredContent.card3,
                                              subtitle: e.target.value,
                                            },
                                          },
                                        }));
                                      }}
                                      className="text-sm"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm">Features List</Label>
                                    {(formData.featuredContent.card3.features || []).map(
                                      (feature, featureIndex) => (
                                        <div
                                          key={featureIndex}
                                          className="mb-2 flex items-center gap-2"
                                        >
                                          <Input
                                            placeholder="e.g., Premium Quality"
                                            value={feature}
                                            onChange={(e) => {
                                              const newFeatures = [
                                                ...(formData.featuredContent.card3.features || []),
                                              ];
                                              newFeatures[featureIndex] = e.target.value;
                                              setFormData((prev) => ({
                                                ...prev,
                                                featuredContent: {
                                                  ...prev.featuredContent,
                                                  card3: {
                                                    ...prev.featuredContent.card3,
                                                    features: newFeatures,
                                                  },
                                                },
                                              }));
                                            }}
                                            className="text-sm"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const newFeatures = (
                                                formData.featuredContent.card3.features || []
                                              ).filter((_, i) => i !== featureIndex);
                                              setFormData((prev) => ({
                                                ...prev,
                                                featuredContent: {
                                                  ...prev.featuredContent,
                                                  card3: {
                                                    ...prev.featuredContent.card3,
                                                    features: newFeatures,
                                                  },
                                                },
                                              }));
                                            }}
                                            className="text-red-600 text-xs"
                                          >
                                            ✕
                                          </Button>
                                        </div>
                                      ),
                                    )}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newFeatures = [
                                          ...(formData.featuredContent.card3.features || []),
                                          "",
                                        ];
                                        setFormData((prev) => ({
                                          ...prev,
                                          featuredContent: {
                                            ...prev.featuredContent,
                                            card3: {
                                              ...prev.featuredContent.card3,
                                              features: newFeatures,
                                            },
                                          },
                                        }));
                                      }}
                                      className="w-full text-xs"
                                    >
                                      + Add Feature
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="flex justify-end space-x-4 border-t pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isValid || isLoading}>
                  {isLoading
                    ? "Saving..."
                    : mode === "create"
                      ? "Create Category"
                      : "Update Category"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleStandardMediaSelect}
        title={
          mediaPickerTarget === "card1-svg"
            ? "Select SVG Mask File"
            : mediaPickerTarget === "card1-media"
              ? "Select Content Media"
              : "Select Media"
        }
        mediaPickerTarget="category-form"
        selectionMode="single"
      />
    </>
  );
}
