"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BlogCategory, BlogPost, InsertBlogPost } from "@shared/index";
import { insertBlogPostSchema } from "@shared/index";
import {
  IconEdit,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconSeo,
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "../shared/RichTextEditor";
import { SEOPreview } from "./SEOPreview";
import "@/styles/editor.css";

export function BlogManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        limit: "50",
        offset: "0",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/blog/posts?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch posts");

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/blog/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const form = useForm({
    resolver: zodResolver(insertBlogPostSchema),
    defaultValues: {
      title: "",
      content: "",
      status: "draft" as const,
      categoryId: undefined as number | undefined,
      excerpt: "",
      featuredImageId: undefined as number | undefined,
      slug: "",
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      ogImage: "",
      keywords: "",
    },
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchCategories, fetchPosts]);

  const onSubmit = async (values: InsertBlogPost) => {
    try {
      const url = editingPost ? `/api/admin/blog/posts/${editingPost.id}` : "/api/admin/blog/posts";

      const method = editingPost ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to save post");

      toast.success(`Blog post ${editingPost ? "updated" : "created"} successfully`);
      setIsModalOpen(false);
      setEditingPost(null);
      form.reset();
      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      content: post.content,
      status: post.status as "draft" | "published" | "archived",
      categoryId: post.categoryId ?? undefined,
      excerpt: post.excerpt || "",
      featuredImageId: post.featuredImageId ?? undefined,
      slug: post.slug,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      canonicalUrl: post.canonicalUrl || "",
      ogImage: post.ogImage || "",
      keywords: post.keywords || "",
    });
    setIsModalOpen(true);
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete post");

      toast.success("Blog post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-admin-muted mt-1">Manage global content and storytelling.</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingPost(null);
            form.reset({
              title: "",
              content: "",
              status: "draft",
              categoryId: undefined,
              excerpt: "",
              featuredImageId: undefined,
              slug: "",
              metaTitle: "",
              metaDescription: "",
              canonicalUrl: "",
              ogImage: "",
              keywords: "",
            });
            setIsModalOpen(true);
          }}
        >
          <IconPlus size={18} />
          New Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Pipeline</CardTitle>
          <div className="relative mt-2">
            <IconSearch className="absolute top-2.5 left-2.5 h-4 w-4 text-admin-muted" />
            <Input
              placeholder="Search posts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-admin-muted">
              <IconLoader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Syncing blog content...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow
                      key={post.id}
                      className="group hover:bg-white/[0.03] transition-colors"
                    >
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={post.status === "published" ? "default" : "secondary"}
                          className={
                            post.status === "published"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : ""
                          }
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {categories.find((c) => c.id === post.categoryId)?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-sm text-admin-muted">
                        {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPost(post)}
                            className="h-8 w-8"
                          >
                            <IconEdit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <IconTrash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-admin-muted">
                      No blog posts found. Capture the narrative by creating one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form action={() => form.handleSubmit(onSubmit)()} className="space-y-4">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Social</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter post title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="auto-generated-from-title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v, 10))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featuredImageId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Media Asset ID"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value, 10) : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Excerpt (Short Summary)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="A brief summary for previews..."
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Content (Rich Text Editor)</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Write your story here..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Search engine title"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Search engine description..."
                                className="h-24 resize-none"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ogImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Social Share Image (URL)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Keywords (Comma separated)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="sustainability, fashion, run"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <IconSeo size={16} className="text-blue-500" />
                          Google Search Preview
                        </h4>
                        <SEOPreview
                          type="google"
                          title={form.watch("metaTitle") || form.watch("title")}
                          description={
                            (form.watch("metaDescription") || form.watch("excerpt") || "") as string
                          }
                          slug={form.watch("slug")}
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <IconShare size={16} className="text-pink-500" />
                          Social Media Preview
                        </h4>
                        <SEOPreview
                          type="social"
                          title={form.watch("metaTitle") || form.watch("title")}
                          description={
                            (form.watch("metaDescription") || form.watch("excerpt") || "") as string
                          }
                          slug={form.watch("slug")}
                          ogImage={form.watch("ogImage") || undefined}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingPost ? "Save Changes" : "Create Post"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
