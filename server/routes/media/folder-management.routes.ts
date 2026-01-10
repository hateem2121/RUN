import { removeUndefined } from "../../utils.js";

/**
 * FOLDERS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all folder CRUD operations, tree structure, and hierarchy management
 */

import { Router } from "express";
import { type Folder, insertFolderSchema } from "../../../shared/schema.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// GET /api/folders - List all folders
router.get("/folders", async (req, res) => {
  // Check if we should fetch subfolders as well
  const includeChildren = req.query.includeChildren === "true";

  const folders = await withTimeout(getStorage().getFolders(), 10000, "Get folders");

  if (includeChildren) {
    // For each folder, get its subfolders
    const foldersWithChildren = await Promise.all(
      folders.map(async (folder) => {
        try {
          const children = await withTimeout(
            getStorage().getFolderChildren(folder.id),
            5000,
            `Get children for folder ${folder.id}`,
          );
          return { ...folder, children: children || [] };
        } catch (error) {
          logger.error(`Route: Error fetching children for folder ${folder.id}:`, error);
          return { ...folder, children: [] };
        }
      }),
    );
    return res.json(foldersWithChildren);
  } else {
    return res.json(folders);
  }
});

// GET /api/folders/tree - Get folder tree structure
router.get("/folders/tree", async (_req, res) => {
  const buildTree = (folders: Folder[], parentId: number | null = null): Folder[] => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .map((folder) => ({
        ...folder,
        children: buildTree(folders, folder.id),
      }));
  };

  const allFolders = await withTimeout(getStorage().getFolders(), 10000, "Get folders for tree");
  const tree = buildTree(allFolders);

  return res.json(tree);
});

// GET /api/folders/:id - Get specific folder
router.get("/folders/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "folder");
  if (id === null) return;

  const folder = await withTimeout(getStorage().getFolder(id), 5000, "Get folder by ID");

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.json(folder);
});

// POST /api/folders - Create new folder
router.post("/folders", authService.requireAdmin, async (req, res) => {
  const validatedData = insertFolderSchema.parse(req.body);
  const folder = await withTimeout(
    getStorage().createFolder(removeUndefined(validatedData)),
    10000,
    "Create folder",
  );
  return res.status(201).json(folder);
});

// PUT /api/folders/:id - Update folder
router.put("/folders/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "folder");
  if (id === null) return;

  const validatedData = insertFolderSchema.partial().parse(req.body);
  const folder = await withTimeout(
    getStorage().updateFolder(id, removeUndefined(validatedData)),
    10000,
    "Update folder",
  );

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.json(folder);
});

// DELETE /api/folders/:id - Delete folder
router.delete("/folders/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "folder");
  if (id === null) return;

  // Check if folder has children
  const children = await withTimeout(
    getStorage().getFolderChildren(id),
    5000,
    "Get folder children for deletion check",
  );
  if (children && children.length > 0) {
    return res.status(400).json({
      message: "Cannot delete folder with children. Delete children first.",
    });
  }

  const success = await withTimeout(getStorage().deleteFolder(id), 10000, "Delete folder");

  if (!success) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.status(204).send();
});

// GET /api/folders/:id/children - Get folder children
router.get("/folders/:id/children", async (req, res) => {
  const id = validateIdParam(req, res, "id", "folder");
  if (id === null) return;

  const children = await withTimeout(
    getStorage().getFolderChildren(id),
    5000,
    "Get folder children",
  );
  return res.json(children || []);
});

// GET /api/folders/:id/media - Get media assets in folder
router.get("/folders/:id/media", async (req, res) => {
  const id = validateIdParam(req, res, "id", "folder");
  if (id === null) return;

  const assets = await withTimeout(
    getStorage().getMediaAssetsByFolder(id),
    5000,
    "Get media assets by folder",
  );
  return res.json(assets || []);
});

// POST /api/folders/:id/move-media - Move media asset to folder
router.post("/folders/:id/move-media", authService.requireAdmin, async (req, res) => {
  const folderId = validateIdParam(req, res, "id", "folder");
  if (folderId === null) return;
  const { mediaAssetId } = req.body;

  if (!mediaAssetId) {
    return res.status(400).json({
      message: "Missing media asset ID",
    });
  }

  const updatedAsset = await withTimeout(
    getStorage().moveMediaAsset(mediaAssetId, folderId),
    10000,
    "Move media asset to folder",
  );

  if (!updatedAsset) {
    return res.status(404).json({ message: "Media asset not found" });
  }

  return res.json(updatedAsset);
});

export default router;
