import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import homepageManagementRoutes from '../homepage-management.routes.js';
import { unifiedCache } from '../../../lib/cache/unified-cache.js';
import { pageContentRepository } from '../../../lib/db/repositories/index.js';

vi.mock('../../../lib/cache/unified-cache.js', () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  }
}));

vi.mock('../../../lib/cache/cache-strategies.js', () => ({
  CacheKeys: {
    homepage: {
      hero: vi.fn().mockReturnValue('homepage:hero'),
      slogans: vi.fn().mockReturnValue('homepage:slogans'),
      sections: vi.fn().mockReturnValue('homepage:sections'),
      featuredProducts: vi.fn().mockReturnValue('homepage:featuredProducts'),
    }
  },
  CacheOperations: {
    invalidateHomepage: vi.fn(),
  }
}));

vi.mock('../../../lib/cache/two-tier-batch.js', () => ({
  twoTierBatchCache: {
    invalidate: vi.fn(),
  }
}));

vi.mock('../../../lib/db/repositories/index.js', () => ({
  pageContentRepository: {
    getHomepageHero: vi.fn(),
    updateHomepageHero: vi.fn(),
  }
}));

vi.mock('../../../services/auth-service.js', () => ({
  authService: {
    requireAdmin: vi.fn((_req, _res, next) => next()),
  }
}));

const app = express();
app.use(express.json());
app.use('/api', homepageManagementRoutes);

describe('Homepage Management Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/homepage-hero', () => {
    it('returns cached hero if available', async () => {
      const mockHero = { title: 'Cached Hero' };
      vi.mocked(unifiedCache.get).mockResolvedValue(mockHero);

      const response = await request(app).get('/api/homepage-hero');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHero);
      expect(response.headers['x-cache-hit']).toBe('true');
      expect(pageContentRepository.getHomepageHero).not.toHaveBeenCalled();
    });

    it('fetches hero from db if not in cache', async () => {
      vi.mocked(unifiedCache.get).mockResolvedValue(null);
      const mockHero = { title: 'DB Hero' };
      vi.mocked(pageContentRepository.getHomepageHero).mockResolvedValue(mockHero as unknown as Awaited<ReturnType<typeof pageContentRepository.getHomepageHero>>);

      const response = await request(app).get('/api/homepage-hero');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHero);
      expect(unifiedCache.set).toHaveBeenCalledWith('homepage:hero', mockHero, expect.any(Number));
    });
  });

  describe('PATCH /api/homepage-hero', () => {
    it('updates hero and invalidates cache', async () => {
      const updateData = { title: 'Updated Hero' };
      const updatedHero = { id: 1, ...updateData };
      vi.mocked(pageContentRepository.updateHomepageHero).mockResolvedValue(updatedHero as unknown as Awaited<ReturnType<typeof pageContentRepository.updateHomepageHero>>);

      const response = await request(app)
        .patch('/api/homepage-hero')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedHero);
      expect(pageContentRepository.updateHomepageHero).toHaveBeenCalledWith(updateData);
    });

    it('returns 400 for invalid data', async () => {
      const invalidData = { title: 123 }; // Should be string
      const response = await request(app)
        .patch('/api/homepage-hero')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
