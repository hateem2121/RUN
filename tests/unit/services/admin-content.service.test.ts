import { ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { miscRepository } from "../../../server/lib/db/repositories/index.js";
import { aboutService } from "../../../server/services/about.service.js";
import { adminService } from "../../../server/services/admin/admin.service.js";

vi.mock("../../../server/lib/db/repositories/index.js", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    miscRepository: {
      getFibers: vi.fn(),
      createFiber: vi.fn(),
      getFiber: vi.fn(),
      updateFiber: vi.fn(),
      deleteFiber: vi.fn(),
      getCertificates: vi.fn(),
      createCertificate: vi.fn(),
      getCertificate: vi.fn(),
      updateCertificate: vi.fn(),
      deleteCertificate: vi.fn(),
    },
  };
});

vi.mock("../../../server/services/about.service.js", () => ({
  aboutService: {
    getTimeline: vi.fn(),
    getTimelineEntry: vi.fn(),
    createTimelineEntry: vi.fn(),
    updateTimelineEntry: vi.fn(),
    deleteTimelineEntry: vi.fn(),
    getTimelineEntries: vi.fn(),
  },
}));

// AdminService.logAudit() calls systemRepository.createAuditLog() — mock it to
// prevent real Neon DB hits (the DB is missing the user_email_index column).
vi.mock("../../../server/lib/db/repositories/system-repository.js", () => ({
  systemRepository: {
    createAuditLog: vi
      .fn()
      .mockResolvedValue({ id: 1, action: "INSERT", tableName: "test", recordId: "1" }),
  },
}));

const mockAudit = {
  user: { id: 1, email: "admin@run.com", claims: { sub: "1", email: "admin@run.com" } },
  userAgent: "testAgent",
  ipAddress: "127.0.0.1",
};

describe("AdminService - Content Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fiber Management", () => {
    it("should get fibers list", async () => {
      vi.mocked(miscRepository.getFibers).mockResolvedValue([{ id: 1, name: "Polyester" }] as any);
      const result = await adminService.getFibersList();
      expect(result.isOk()).toBe(true);
      const list = result._unsafeUnwrap();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe("Polyester");
    });

    it("should create fiber and log audit", async () => {
      const fiberData = { name: "Cotton", type: "natural", description: "Natural" };
      vi.mocked(miscRepository.createFiber).mockResolvedValue({ id: 2, ...fiberData } as any);

      const result = await adminService.createFiber(mockAudit as any, fiberData);

      expect(result.isOk()).toBe(true);
      const fiber = result._unsafeUnwrap();
      expect(fiber.id).toBe(2);
      expect(miscRepository.createFiber).toHaveBeenCalled();
    });
  });

  describe("Certificate Management", () => {
    it("should get certificates list", async () => {
      vi.mocked(miscRepository.getCertificates).mockResolvedValue([{ id: 1, name: "GOTS" }] as any);
      const result = await adminService.getCertificatesList();
      expect(result.isOk()).toBe(true);
      const list = result._unsafeUnwrap();
      expect(list).toHaveLength(1);
    });

    it("should delete certificate and log audit", async () => {
      vi.mocked(miscRepository.getCertificate).mockResolvedValue({ id: 1, name: "GOTS" } as any);
      vi.mocked(miscRepository.deleteCertificate).mockResolvedValue(true);

      const result = await adminService.deleteCertificate(mockAudit as any, 1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });
  });

  describe("About Timeline Management", () => {
    it("should delegate timeline creation to aboutService", async () => {
      const entryData = { year: "2010", title: "Start" };
      vi.mocked(aboutService.createTimelineEntry).mockResolvedValue(
        ok({ id: 1, ...entryData }) as any,
      );

      const result = await adminService.createAboutTimelineEntry(mockAudit as any, entryData);

      expect(result.isOk()).toBe(true);
      const entry = result._unsafeUnwrap();
      expect(entry.id).toBe(1);
      expect(aboutService.createTimelineEntry).toHaveBeenCalledWith(entryData);
    });
  });
});
