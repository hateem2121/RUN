import { beforeEach, describe, expect, it, vi } from "vitest";

const returningMock = vi.fn();
const valuesMock = vi.fn(() => ({ returning: returningMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));

const setMock = vi.fn(() => ({ where: vi.fn(() => ({ returning: returningMock })) }));
const updateMock = vi.fn(() => ({ set: setMock }));

const deleteWhereMock = vi.fn(() => ({ returning: returningMock }));
const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));

const orderByMock = vi.fn();
const whereMock = vi.fn(() => ({ orderBy: orderByMock, prepare: vi.fn() }));
const leftJoinMock = vi.fn(() => ({ where: whereMock }));
const fromMock = vi.fn(() => ({ where: whereMock, leftJoin: leftJoinMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

const dbMock = vi.hoisted(() => {
  const rMock = vi.fn();
  const vMock = vi.fn(() => ({ returning: rMock }));
  const iMock = vi.fn(() => ({ values: vMock }));

  const setM = vi.fn(() => ({ where: vi.fn(() => ({ returning: rMock })) }));
  const uMock = vi.fn(() => ({ set: setM }));

  const dWhereM = vi.fn(() => ({ returning: rMock }));
  const dMock = vi.fn(() => ({ where: dWhereM }));

  const oMock = vi.fn();
  oMock.mockResolvedValue([]);

  const wMock = vi.fn(() => ({ orderBy: oMock, prepare: vi.fn() }));
  wMock.mockReturnValue(Object.assign(Promise.resolve([]), { orderBy: oMock, prepare: vi.fn() }));

  const jMock = vi.fn(() => ({ where: wMock, orderBy: oMock }));
  jMock.mockReturnValue(Object.assign(Promise.resolve([]), { where: wMock, orderBy: oMock }));

  const fMock = vi.fn(() => ({ where: wMock, leftJoin: jMock, orderBy: oMock }));
  fMock.mockReturnValue(
    Object.assign(Promise.resolve([]), { where: wMock, leftJoin: jMock, orderBy: oMock }),
  );

  const sMock = vi.fn(() => ({ from: fMock, execute: oMock }));

  return {
    query: {
      fibers: { findMany: vi.fn(), findFirst: vi.fn() },
      fabrics: { findMany: vi.fn(), findFirst: vi.fn() },
      certificates: { findMany: vi.fn(), findFirst: vi.fn() },
      sizeCharts: { findMany: vi.fn(), findFirst: vi.fn() },
    },
    insert: iMock,
    update: uMock,
    delete: dMock,
    select: sMock,
    _returningMock: rMock,
    _orderByMock: oMock,
    _whereMock: wMock,
  };
});

vi.mock("../../../../server/db.js", () => {
  return {
    db: dbMock,
  };
});

import { miscRepository } from "../../../../server/services/repositories/index.js";

describe("Misc Repository Deep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fibers", () => {
    it("getFibers", async () => {
      dbMock._orderByMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.getFibers();
      expect(res).toBeDefined();
    });
    it("getFiber", async () => {
      dbMock._whereMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.getFiber(1);
      expect(res).toBeDefined();
    });
    it("createFiber", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      // @ts-expect-error
      const res = await miscRepository.createFiber({});
      expect(res).toBeDefined();
    });
    it("updateFiber", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.updateFiber(1, {});
      expect(res).toBeDefined();
    });
    it("deleteFiber", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.deleteFiber(1);
      expect(res).toBeDefined();
    });
  });

  describe("Fabrics", () => {
    it("getFabrics", async () => {
      dbMock._orderByMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.getFabrics();
      expect(res).toBeDefined();
    });
    it("getFabric", async () => {
      dbMock._whereMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.getFabric(1);
      expect(res).toBeDefined();
    });
    it("createFabric", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      // @ts-expect-error
      const res = await miscRepository.createFabric({});
      expect(res).toBeDefined();
    });
    it("updateFabric", async () => {
      dbMock._whereMock.mockResolvedValueOnce([{ id: 1 }]);
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.updateFabric(1, {});
      expect(res).toBeDefined();
    });
    it("deleteFabric", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.deleteFabric(1);
      expect(res).toBeDefined();
    });
  });

  describe("Certificates", () => {
    it("getCertificates", async () => {
      dbMock._orderByMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.getCertificates();
      expect(res).toBeDefined();
    });
    it("createCertificate", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      // @ts-expect-error
      const res = await miscRepository.createCertificate({});
      expect(res).toBeDefined();
    });
    it("updateCertificate", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.updateCertificate(1, {});
      expect(res).toBeDefined();
    });
    it("deleteCertificate", async () => {
      dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.deleteCertificate(1);
      expect(res).toBeDefined();
    });
  });

  describe("SizeCharts", () => {
    it("getSizeCharts", async () => {
      dbMock._orderByMock.mockResolvedValueOnce([{ id: 1 }]);
      const res = await miscRepository.getSizeCharts();
      expect(res).toBeDefined();
    });
  });
});
