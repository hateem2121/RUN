import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the repository so we can control what it returns or throws
vi.mock("../../../../server/services/repositories/index.js", () => {
  return {
    miscRepository: {
      getFibers: vi.fn(),
      getFiber: vi.fn(),
      createFiber: vi.fn(),
      updateFiber: vi.fn(),
      deleteFiber: vi.fn(),

      getFabrics: vi.fn(),
      getFabric: vi.fn(),
      createFabric: vi.fn(),
      updateFabric: vi.fn(),
      deleteFabric: vi.fn(),

      getCertificates: vi.fn(),
      createCertificate: vi.fn(),
      updateCertificate: vi.fn(),
      deleteCertificate: vi.fn(),

      getSizeCharts: vi.fn(),
    },
  };
});

import { InternalError } from "../../../../server/lib/errors.js";
import { miscService } from "../../../../server/services/misc.service.js";
import { miscRepository } from "../../../../server/services/repositories/index.js";

describe("Misc Service Deep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fibers", () => {
    it("getFibers success", async () => {
      // @ts-expect-error
      miscRepository.getFibers.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscService.getFibers();
      expect(res.isOk()).toBe(true);
    });

    it("getFibers error", async () => {
      // @ts-expect-error
      miscRepository.getFibers.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.getFibers();
      expect(res.isErr()).toBe(true);
      if (res.isErr()) expect(res.error).toBeInstanceOf(InternalError);
    });

    it("getFiber success", async () => {
      // @ts-expect-error
      miscRepository.getFiber.mockResolvedValueOnce({ id: 1 });
      const res = await miscService.getFiber(1);
      expect(res.isOk()).toBe(true);
    });

    it("getFiber not found", async () => {
      // @ts-expect-error
      miscRepository.getFiber.mockResolvedValueOnce(null);
      const res = await miscService.getFiber(1);
      expect(res.isErr()).toBe(true);
    });

    it("getFiber generic error", async () => {
      // @ts-expect-error
      miscRepository.getFiber.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.getFiber(1);
      expect(res.isErr()).toBe(true);
    });

    it("createFiber success", async () => {
      // @ts-expect-error
      miscRepository.createFiber.mockResolvedValueOnce({ id: 1 });
      // @ts-expect-error
      const res = await miscService.createFiber({ name: "Cotton" });
      expect(res.isOk()).toBe(true);
    });

    it("createFiber error", async () => {
      // @ts-expect-error
      miscRepository.createFiber.mockRejectedValueOnce(new Error("DB Error"));
      // @ts-expect-error
      const res = await miscService.createFiber({});
      expect(res.isErr()).toBe(true);
    });

    it("updateFiber success", async () => {
      // @ts-expect-error
      miscRepository.updateFiber.mockResolvedValueOnce({ id: 1 });
      const res = await miscService.updateFiber(1, { name: "Test" });
      expect(res.isOk()).toBe(true);
    });

    it("updateFiber not found", async () => {
      // @ts-expect-error
      miscRepository.updateFiber.mockResolvedValueOnce(null);
      const res = await miscService.updateFiber(1, { name: "Test" });
      expect(res.isErr()).toBe(true);
    });

    it("updateFiber generic error", async () => {
      // @ts-expect-error
      miscRepository.updateFiber.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.updateFiber(1, { name: "Test" });
      expect(res.isErr()).toBe(true);
    });

    it("deleteFiber success", async () => {
      // @ts-expect-error
      miscRepository.deleteFiber.mockResolvedValueOnce(true);
      const res = await miscService.deleteFiber(1);
      expect(res.isOk()).toBe(true);
    });

    it("deleteFiber not found", async () => {
      // @ts-expect-error
      miscRepository.deleteFiber.mockResolvedValueOnce(false);
      const res = await miscService.deleteFiber(1);
      expect(res.isErr()).toBe(true);
    });

    it("deleteFiber generic error", async () => {
      // @ts-expect-error
      miscRepository.deleteFiber.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.deleteFiber(1);
      expect(res.isErr()).toBe(true);
    });
  });

  describe("Fabrics", () => {
    it("getFabrics success", async () => {
      // @ts-expect-error
      miscRepository.getFabrics.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscService.getFabrics();
      expect(res.isOk()).toBe(true);
    });

    it("getFabrics error", async () => {
      // @ts-expect-error
      miscRepository.getFabrics.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.getFabrics();
      expect(res.isErr()).toBe(true);
    });

    it("getFabric success", async () => {
      // @ts-expect-error
      miscRepository.getFabric.mockResolvedValueOnce({ id: 1 });
      const res = await miscService.getFabric(1);
      expect(res.isOk()).toBe(true);
    });

    it("getFabric not found", async () => {
      // @ts-expect-error
      miscRepository.getFabric.mockResolvedValueOnce(null);
      const res = await miscService.getFabric(1);
      expect(res.isErr()).toBe(true);
    });

    it("getFabric generic error", async () => {
      // @ts-expect-error
      miscRepository.getFabric.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.getFabric(1);
      expect(res.isErr()).toBe(true);
    });

    it("createFabric success", async () => {
      // @ts-expect-error
      miscRepository.createFabric.mockResolvedValueOnce({ id: 1 });
      // @ts-expect-error
      const res = await miscService.createFabric({ name: "Cotton" });
      expect(res.isOk()).toBe(true);
    });

    it("createFabric error", async () => {
      // @ts-expect-error
      miscRepository.createFabric.mockRejectedValueOnce(new Error("DB Error"));
      // @ts-expect-error
      const res = await miscService.createFabric({});
      expect(res.isErr()).toBe(true);
    });

    it("updateFabric success", async () => {
      // @ts-expect-error
      miscRepository.updateFabric.mockResolvedValueOnce({ id: 1 });
      const res = await miscService.updateFabric(1, { name: "Test" });
      expect(res.isOk()).toBe(true);
    });

    it("updateFabric not found", async () => {
      // @ts-expect-error
      miscRepository.updateFabric.mockResolvedValueOnce(null);
      const res = await miscService.updateFabric(1, { name: "Test" });
      expect(res.isErr()).toBe(true);
    });

    it("updateFabric generic error", async () => {
      // @ts-expect-error
      miscRepository.updateFabric.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.updateFabric(1, { name: "Test" });
      expect(res.isErr()).toBe(true);
    });

    it("deleteFabric success", async () => {
      // @ts-expect-error
      miscRepository.deleteFabric.mockResolvedValueOnce(true);
      const res = await miscService.deleteFabric(1);
      expect(res.isOk()).toBe(true);
    });

    it("deleteFabric not found", async () => {
      // @ts-expect-error
      miscRepository.deleteFabric.mockResolvedValueOnce(false);
      const res = await miscService.deleteFabric(1);
      expect(res.isErr()).toBe(true);
    });

    it("deleteFabric generic error", async () => {
      // @ts-expect-error
      miscRepository.deleteFabric.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.deleteFabric(1);
      expect(res.isErr()).toBe(true);
    });
  });

  describe("Certificates", () => {
    it("getCertificates success", async () => {
      // @ts-expect-error
      miscRepository.getCertificates.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscService.getCertificates();
      expect(res.isOk()).toBe(true);
    });

    it("getCertificates error", async () => {
      // @ts-expect-error
      miscRepository.getCertificates.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.getCertificates();
      expect(res.isErr()).toBe(true);
    });

    it("createCertificate success", async () => {
      // @ts-expect-error
      miscRepository.createCertificate.mockResolvedValueOnce({ id: 1 });
      // @ts-expect-error
      const res = await miscService.createCertificate({ name: "Cotton" });
      expect(res.isOk()).toBe(true);
    });

    it("createCertificate error", async () => {
      // @ts-expect-error
      miscRepository.createCertificate.mockRejectedValueOnce(new Error("DB Error"));
      // @ts-expect-error
      const res = await miscService.createCertificate({});
      expect(res.isErr()).toBe(true);
    });

    it("updateCertificate success", async () => {
      // @ts-expect-error
      miscRepository.updateCertificate.mockResolvedValueOnce({ id: 1 });
      const res = await miscService.updateCertificate(1, { name: "Test" });
      expect(res.isOk()).toBe(true);
    });

    it("updateCertificate not found", async () => {
      // @ts-expect-error
      miscRepository.updateCertificate.mockResolvedValueOnce(null);
      const res = await miscService.updateCertificate(1, { name: "Test" });
      expect(res.isErr()).toBe(true);
    });

    it("updateCertificate generic error", async () => {
      // @ts-expect-error
      miscRepository.updateCertificate.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.updateCertificate(1, { name: "Test" });
      expect(res.isErr()).toBe(true);
    });

    it("deleteCertificate success", async () => {
      // @ts-expect-error
      miscRepository.deleteCertificate.mockResolvedValueOnce(true);
      const res = await miscService.deleteCertificate(1);
      expect(res.isOk()).toBe(true);
    });

    it("deleteCertificate not found", async () => {
      // @ts-expect-error
      miscRepository.deleteCertificate.mockResolvedValueOnce(false);
      const res = await miscService.deleteCertificate(1);
      expect(res.isErr()).toBe(true);
    });

    it("deleteCertificate generic error", async () => {
      // @ts-expect-error
      miscRepository.deleteCertificate.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.deleteCertificate(1);
      expect(res.isErr()).toBe(true);
    });
  });

  describe("SizeCharts", () => {
    it("getSizeCharts success", async () => {
      // @ts-expect-error
      miscRepository.getSizeCharts.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscService.getSizeCharts();
      expect(res.isOk()).toBe(true);
    });

    it("getSizeCharts error", async () => {
      // @ts-expect-error
      miscRepository.getSizeCharts.mockRejectedValueOnce(new Error("DB Error"));
      const res = await miscService.getSizeCharts();
      expect(res.isErr()).toBe(true);
    });
  });
});
