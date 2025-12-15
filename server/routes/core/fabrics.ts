/**
 * FABRICS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all fabric CRUD operations and relationships
 */

import { Router } from 'express';
import { z } from 'zod';
import { getStorage } from '../../lib/storage-singleton.js';
import { insertFabricSchema } from '../../../shared/schema.js';
import { logger } from '../../lib/smart-logger.js';
import { withTimeout } from '../../lib/request-timeout.js';
import { retryDbOperation } from '../../lib/db-retry.js';

const router = Router();

// GET /api/fabrics - List all fabrics
router.get('/fabrics', async (_req, res) => {
  try {
    const fabrics = await withTimeout(
      retryDbOperation(() => getStorage().getFabrics(), { operationName: 'Get all fabrics' }),
      10000,
      'Get all fabrics'
    );
    res.json(fabrics);
  } catch (error: unknown) {
    logger.error('Route: Error fetching fabrics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch fabrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// POST /api/fabrics - Create new fabric
router.post('/fabrics', async (req, res) => {
  try {
    const validatedData = insertFabricSchema.parse(req.body);
    const fabric = await withTimeout(
      retryDbOperation(() => getStorage().createFabric(validatedData as any), { operationName: 'Create fabric' }),
      10000,
      'Create fabric'
    );
    return res.status(201).json(fabric);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.issues
        }
      });
    } else {
      logger.error('Route: Error creating fabric:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create fabric',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
});

// PUT /api/fabrics/:id - Update fabric
router.put('/fabrics/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertFabricSchema.parse(req.body);
    const fabric = await withTimeout(
      retryDbOperation(() => getStorage().updateFabric(id, validatedData as any), { operationName: `Update fabric ${id}` }),
      10000,
      'Update fabric'
    );

    if (!fabric) {
      return res.status(404).json({
        success: false,
        error: { message: 'Fabric not found' }
      });
    }

    return res.json(fabric);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.issues
        }
      });
    } else {
      logger.error('Route: Error updating fabric:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update fabric',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
});

// PATCH /api/fabrics/:id - Partial update fabric
router.patch('/fabrics/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const partialData = insertFabricSchema.partial().parse(req.body);
    const fabric = await withTimeout(
      retryDbOperation(() => getStorage().updateFabric(id, partialData as any), { operationName: `Partial update fabric ${id}` }),
      10000,
      'Partial update fabric'
    );

    if (!fabric) {
      return res.status(404).json({
        success: false,
        error: { message: 'Fabric not found' }
      });
    }

    return res.json(fabric);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.issues
        }
      });
    } else {
      logger.error('Route: Error updating fabric:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update fabric',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
});

// DELETE /api/fabrics/:id - Delete fabric
router.delete('/fabrics/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await withTimeout(
      retryDbOperation(() => getStorage().deleteFabric(id), { operationName: `Delete fabric ${id}` }),
      10000,
      'Delete fabric'
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        error: { message: 'Fabric not found' }
      });
    }

    return res.status(204).send();
  } catch (error: unknown) {
    logger.error('Route: Error deleting fabric:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete fabric',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;