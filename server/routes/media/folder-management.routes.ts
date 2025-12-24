/**
 * FOLDERS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all folder CRUD operations, tree structure, and hierarchy management
 */

import { Router } from 'express';
import { z } from 'zod';
import { type Folder, insertFolderSchema } from '../../../shared/schema.js';
import { withTimeout } from '../../lib/request-timeout.js';
import { logger } from '../../lib/smart-logger.js';
import { getStorage } from '../../lib/storage-singleton.js';

const router = Router();

// GET /api/folders - List all folders
router.get('/folders', async (req, res) => {
  try {
    // Check if we should fetch subfolders as well
    const includeChildren = req.query.includeChildren === 'true';

    const folders = await withTimeout(
      getStorage().getFolders(),
      10000,
      'Get folders'
    );

    if (includeChildren) {
      // For each folder, get its subfolders
      const foldersWithChildren = await Promise.all(
        folders.map(async (folder) => {
          try {
            const children = await withTimeout(
              getStorage().getFolderChildren(folder.id),
              5000,
              `Get children for folder ${folder.id}`
            );
            return { ...folder, children: children || [] };
          } catch (error) {
            logger.error(`Route: Error fetching children for folder ${folder.id}:`, error);
            return { ...folder, children: [] };
          }
        })
      );
      return res.json(foldersWithChildren);
    } else {
      return res.json(folders);
    }
  } catch (error: unknown) {
    logger.error('Route: Error fetching folders:', error);
    return res.status(500).json({
      message: 'Failed to fetch folders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/folders/tree - Get folder tree structure
router.get('/folders/tree', async (_req, res) => {
  try {
    const buildTree = (folders: Folder[], parentId: number | null = null): Folder[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folders, folder.id)
        }));
    };

    const allFolders = await withTimeout(
      getStorage().getFolders(),
      10000,
      'Get folders for tree'
    );
    const tree = buildTree(allFolders);

    return res.json(tree);
  } catch (error: unknown) {
    logger.error('Route: Error building folder tree:', error);
    return res.status(500).json({
      message: 'Failed to build folder tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/folders/:id - Get specific folder
router.get('/folders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const folder = await withTimeout(
      getStorage().getFolder(id),
      5000,
      'Get folder by ID'
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    return res.json(folder);
  } catch (error: unknown) {
    logger.error('Route: Error fetching folder:', error);
    return res.status(500).json({
      message: 'Failed to fetch folder',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/folders - Create new folder
router.post('/folders', async (req, res) => {
  try {
    const validatedData = insertFolderSchema.parse(req.body);
    const folder = await withTimeout(
      getStorage().createFolder(validatedData),
      10000,
      'Create folder'
    );
    return res.status(201).json(folder);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues
      });
    } else {
      logger.error('Route: Error creating folder:', error);
      return res.status(500).json({
        message: 'Failed to create folder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// PUT /api/folders/:id - Update folder
router.put('/folders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const validatedData = insertFolderSchema.partial().parse(req.body);
    const folder = await withTimeout(
      getStorage().updateFolder(id, validatedData),
      10000,
      'Update folder'
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    return res.json(folder);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: 'errors' in error ? (error as any).issues : []
      });
    } else {
      logger.error('Route: Error updating folder:', error);
      return res.status(500).json({
        message: 'Failed to update folder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// DELETE /api/folders/:id - Delete folder
router.delete('/folders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    // Check if folder has children
    const children = await withTimeout(
      getStorage().getFolderChildren(id),
      5000,
      'Get folder children for deletion check'
    );
    if (children && children.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete folder with children. Delete children first.'
      });
    }

    const success = await withTimeout(
      getStorage().deleteFolder(id),
      10000,
      'Delete folder'
    );

    if (!success) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    return res.status(204).send();
  } catch (error: unknown) {
    logger.error('Route: Error deleting folder:', error);
    return res.status(500).json({
      message: 'Failed to delete folder',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/folders/:id/children - Get folder children
router.get('/folders/:id/children', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const children = await withTimeout(
      getStorage().getFolderChildren(id),
      5000,
      'Get folder children'
    );
    return res.json(children || []);
  } catch (error: unknown) {
    logger.error('Route: Error fetching folder children:', error);
    return res.status(500).json({
      message: 'Failed to fetch folder children',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/folders/:id/media - Get media assets in folder
router.get('/folders/:id/media', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const assets = await withTimeout(
      getStorage().getMediaAssetsByFolder(id),
      5000,
      'Get media assets by folder'
    );
    return res.json(assets || []);
  } catch (error: unknown) {
    logger.error('Route: Error fetching folder media:', error);
    return res.status(500).json({
      message: 'Failed to fetch folder media',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/folders/:id/move-media - Move media asset to folder
router.post('/folders/:id/move-media', async (req, res) => {
  try {
    const folderId = parseInt(req.params.id);
    const { mediaAssetId } = req.body;

    if (isNaN(folderId) || !mediaAssetId) {
      return res.status(400).json({
        message: 'Invalid folder ID or media asset ID'
      });
    }

    const updatedAsset = await withTimeout(
      getStorage().moveMediaAsset(
        mediaAssetId,
        folderId,
      ),
      10000,
      'Move media asset to folder'
    );

    if (!updatedAsset) {
      return res.status(404).json({ message: 'Media asset not found' });
    }

    return res.json(updatedAsset);
  } catch (error: unknown) {
    logger.error('Route: Error moving media asset:', error);
    return res.status(500).json({
      message: 'Failed to move media asset',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;