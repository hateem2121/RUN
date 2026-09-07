import { beforeEach, describe, expect, it, vi } from "vitest";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { emailService } from "../../lib/integrations/email-service.js";
import { miscRepository } from "../../services/repositories/index.js";
import { InquiryService } from "../../services/system/inquiry.service";

// Mock dependencies
vi.mock("../../services/repositories/index.js", () => ({
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
    delete: vi.fn().mockResolvedValue(true),
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

vi.mock("../../services/lib/jobs/queues/email-queue.js", () => ({
  emailQueue: null, // Force fallback to EmailService for simple testing
}));

vi.mock("../../lib/security/recaptcha-verify.js", () => ({
  verifyRecaptcha: vi.fn().mockResolvedValue({ success: true }),
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

      vi.mocked(miscRepository.createInquiry).mockResolvedValue(mockInquiry as any);

      const result = await service.createInquiry(mockData);
      expect(result.isOk()).toBe(true);
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

  describe("processContactSubmission (GEO-01 Factory Dispatch)", () => {
    it("should route Asian/manufacturing region (PK) to Sialkot Production Desk", async () => {
      const mockInquiry = {
        id: 10,
        name: "Ali Khan",
        email: "ali@wear-run.com",
        message: "Technical inquiry for tech-fleece line",
        tags: ["SIALKOT_HQ"],
        assignedTo: "Sialkot Production Desk",
        adminNotes: "Routed to SIALKOT_HQ via cf-ipcountry=PK",
        submittedAt: new Date(),
      };
      vi.mocked(miscRepository.createInquiry).mockResolvedValue(mockInquiry as any);

      const result = await service.processContactSubmission(
        {
          name: "Ali Khan",
          email: "ali@wear-run.com",
          message: "Technical inquiry for tech-fleece line",
          recaptchaToken: "valid-token",
        },
        "111.119.50.1",
        { "cf-ipcountry": "PK" },
      );

      expect(result.isOk()).toBe(true);
      expect(miscRepository.createInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ["SIALKOT_HQ"],
          assignedTo: "Sialkot Production Desk",
          adminNotes: "Routed to SIALKOT_HQ via cf-ipcountry=PK",
        }),
      );
    });

    it("should route European/corporate sales region (CH) to Zurich Global Sales", async () => {
      const mockInquiry = {
        id: 11,
        name: "Beat Meier",
        email: "beat@zurich-sport.ch",
        message: "Wholesale inquiry for running apparel",
        tags: ["ZURICH_SALES"],
        assignedTo: "Zurich Global Sales",
        adminNotes: "Routed to ZURICH_SALES via cf-ipcountry=CH",
        submittedAt: new Date(),
      };
      vi.mocked(miscRepository.createInquiry).mockResolvedValue(mockInquiry as any);

      const result = await service.processContactSubmission(
        {
          name: "Beat Meier",
          email: "beat@zurich-sport.ch",
          message: "Wholesale inquiry for running apparel",
          recaptchaToken: "valid-token",
        },
        "178.192.1.1",
        { "cf-ipcountry": "CH" },
      );

      expect(result.isOk()).toBe(true);
      expect(miscRepository.createInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ["ZURICH_SALES"],
          assignedTo: "Zurich Global Sales",
          adminNotes: "Routed to ZURICH_SALES via cf-ipcountry=CH",
        }),
      );
    });
  });
});
