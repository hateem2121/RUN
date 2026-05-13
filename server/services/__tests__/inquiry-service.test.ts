import { beforeEach, describe, expect, it, vi } from "vitest";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { emailService } from "../../lib/integrations/email-service.js";
import { InquiryService } from "../inquiry-service";

// Mock dependencies
vi.mock("../../lib/db/repositories/index.js", () => ({
  miscRepository: {
    createInquiry: vi.fn(),
    getInquiryById: vi.fn(),
    listInquiries: vi.fn(),
    updateInquiry: vi.fn(),
    getInquiryStats: vi.fn(),
  },
}));

vi.mock("../../lib/cache/unified-cache.js", () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../lib/integrations/email-service.js", () => ({
  emailService: {
    sendAdminNotification: vi.fn(),
    sendCustomerConfirmation: vi.fn(),
  },
}));

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../lib/jobs/queues/email-queue.js", () => ({
  emailQueue: null, // Force fallback to EmailService for simple testing
}));

describe("InquiryService", () => {
  let service: InquiryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InquiryService();
  });

  describe("createInquiry", () => {
    it("should create an inquiry and trigger side-effects", async () => {
      const mockData = {
        name: "John Doe",
        email: "john@example.com",
        message: "Test message",
        source: "contact-page",
        status: "new",
      } as any;

      const mockInquiry = {
        id: 1,
        ...mockData,
        submittedAt: new Date(),
      };

      vi.mocked(miscRepository.createInquiry).mockResolvedValue(mockInquiry);

      const result = await service.createInquiry(mockData);
      const val = result._unsafeUnwrap();

      expect(miscRepository.createInquiry).toHaveBeenCalledWith(mockData);
      expect(val).toEqual(mockInquiry);
      expect(unifiedCache.delete).toHaveBeenCalledWith("inquiries:stats");

      // Verify email fallback (since emailQueue is mocked as null)
      expect(emailService.sendAdminNotification).toHaveBeenCalled();
      expect(emailService.sendCustomerConfirmation).toHaveBeenCalled();
    });
  });

  describe("getStats", () => {
    it("should return cached stats if available", async () => {
      const mockStats = { byStatus: { new: 5 }, bySource: {}, recentCount: 2 };
      vi.mocked(unifiedCache.get).mockResolvedValue(mockStats);

      const result = await service.getStats();
      const val = result._unsafeUnwrap();

      expect(val).toEqual(mockStats);
      expect(miscRepository.getInquiryStats).not.toHaveBeenCalled();
    });

    it("should fetch from repository and cache if not in cache", async () => {
      const mockStats = { byStatus: { new: 5 }, bySource: {}, recentCount: 2 };
      vi.mocked(unifiedCache.get).mockResolvedValue(null);
      vi.mocked(miscRepository.getInquiryStats).mockResolvedValue(mockStats);

      const result = await service.getStats();
      const val = result._unsafeUnwrap();

      expect(val).toEqual(mockStats);
      expect(unifiedCache.set).toHaveBeenCalled();
    });
  });

  describe("updateInquiry", () => {
    it("should update inquiry and invalidate cache", async () => {
      const mockUpdated = { id: 1, status: "read" } as any;
      vi.mocked(miscRepository.updateInquiry).mockResolvedValue(mockUpdated);

      const result = await service.updateInquiry(1, { status: "read" });
      const val = result._unsafeUnwrap();

      expect(miscRepository.updateInquiry).toHaveBeenCalledWith(1, { status: "read" });
      expect(val).toEqual(mockUpdated);
      expect(unifiedCache.delete).toHaveBeenCalledWith("inquiries:stats");
      expect(unifiedCache.delete).toHaveBeenCalledWith("inquiries:detail:1");
    });
  });
});
