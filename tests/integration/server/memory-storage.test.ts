import { beforeEach, describe, expect, it } from "vitest";
import type { InsertCategory, UpsertUser } from "../../../shared/index";
import { MemoryStorage } from "../../../tests/integration/server/memory-storage";

describe("MemoryStorage", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  describe("Users", () => {
    it("upserts and retrieves a user", async () => {
      const userData: UpsertUser = {
        email: "test@example.com",
        name: "Test User",
        isAdmin: true,
      };

      const user = await storage.upsertUser(userData);
      expect(user.id).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.isAdmin).toBe(true);

      const retrieved = await storage.getUser(user.id);
      expect(retrieved).toEqual(user);

      const retrievedByEmail = await storage.getUserByEmail("test@example.com");
      expect(retrievedByEmail).toEqual(user);
    });

    it("updates an existing user", async () => {
      const user = await storage.upsertUser({ email: "test2@example.com", name: "User 2" });
      const updated = await storage.updateUser(user.id, { name: "Updated User 2" });

      expect(updated?.name).toBe("Updated User 2");
      const retrieved = await storage.getUser(user.id);
      expect(retrieved?.name).toBe("Updated User 2");
    });
  });

  describe("Categories", () => {
    it("creates, reads, updates, and deletes categories", async () => {
      const categoryData: InsertCategory = {
        name: "New Category",
        slug: "new-category",
        description: "Test description",
        parentId: null,
        order: 1,
        isActive: true,
      };

      // Create
      const category = await storage.createCategory(categoryData);
      expect(category.id).toBe(1);
      expect(category.name).toBe("New Category");

      // Read
      let fetched = await storage.getCategory(category.id);
      expect(fetched?.slug).toBe("new-category");
      let all = await storage.getCategories();
      expect(all.length).toBe(1);

      // Update
      await storage.updateCategory(category.id, { name: "Updated Category" });
      fetched = await storage.getCategory(category.id);
      expect(fetched?.name).toBe("Updated Category");

      // Soft Delete
      await storage.deleteCategory(category.id);
      all = await storage.getCategories();
      expect(all.length).toBe(0); // Excluded because deletedAt is set

      // Restore
      await storage.restoreCategory(category.id);
      all = await storage.getCategories();
      expect(all.length).toBe(1);

      // Permanent Delete
      await storage.permanentlyDeleteCategory(category.id);
      fetched = await storage.getCategory(category.id);
      expect(fetched).toBeUndefined();
    });
  });

  describe("MediaAssets (Folders & Files)", () => {
    it("handles folders hierarchy", async () => {
      const folder1 = await storage.createFolder({ name: "Root", parentId: null });
      const folder2 = await storage.createFolder({ name: "Child", parentId: folder1.id });

      const path1 = await storage.getFolderPath(folder1.id);
      expect(path1).toBe("/Root");

      const path2 = await storage.getFolderPath(folder2.id);
      expect(path2).toBe("/Root/Child");

      const children = await storage.getFolderChildren(folder1.id);
      expect(children).toHaveLength(1);
      expect(children[0].id).toBe(folder2.id);
    });

    it("creates and moves media assets", async () => {
      const folder = await storage.createFolder({ name: "Images", parentId: null });
      const asset = await storage.createMediaAsset({
        filename: "test.jpg",
        originalName: "test.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        folderId: null,
        type: "image",
        url: "/test.jpg",
        uploaderId: "user-1",
      } as any); // using any for simplicity since some fields might be missing in InsertMediaAsset

      expect(asset.id).toBeDefined();

      await storage.moveMediaAsset(asset.id, folder.id);
      const moved = await storage.getMediaAsset(asset.id);
      expect(moved?.folderId).toBe(folder.id);
    });
  });
});
