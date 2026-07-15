import { beforeEach, describe, expect, it, vi } from "vitest";

const returningMock = vi.fn();
const valuesMock = vi.fn(() => ({ returning: returningMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));

const limitMock = vi.fn();
const orderByMock = vi.fn(() => ({ limit: limitMock }));
const fromMock = vi.fn(() => ({ orderBy: orderByMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

const dbMock = vi.hoisted(() => {
  const rMock = vi.fn();
  const vMock = vi.fn(() => ({ returning: rMock }));
  const iMock = vi.fn(() => ({ values: vMock }));

  const lMock = vi.fn();
  const oMock = vi.fn(() => ({ limit: lMock }));
  const fMock = vi.fn(() => ({ orderBy: oMock }));
  const sMock = vi.fn(() => ({ from: fMock }));

  return {
    query: {
      auditLogs: { findMany: vi.fn() },
    },
    insert: iMock,
    select: sMock,
    execute: vi.fn(),
    _returningMock: rMock,
    _limitMock: lMock,
  };
});

vi.mock("../../../../server/db.js", () => {
  return {
    db: dbMock,
    pool: { query: vi.fn() },
  };
});

import { systemRepository } from "../../../../server/services/repositories/system-repository.js";

describe("System Repository Deep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRecentAuditLogs", async () => {
    dbMock._limitMock.mockResolvedValueOnce([{ id: 1 }]);
    const res = await systemRepository.getRecentAuditLogs(10);
    expect(res).toBeDefined();
  });

  it("createAuditLog", async () => {
    dbMock._returningMock.mockResolvedValueOnce([{ id: 1 }]);
    // @ts-expect-error
    const res = await systemRepository.createAuditLog({});
    expect(res).toBeDefined();
  });

  it("setAuditTrailEnabled", () => {
    // Just executing it
    systemRepository.setAuditTrailEnabled(true);
  });

  it("configureTrackedTables", () => {
    systemRepository.configureTrackedTables(["products"]);
  });

  it("ping", async () => {
    dbMock.execute.mockResolvedValueOnce(true);
    const res = await systemRepository.ping();
    expect(res).toBeUndefined();
  });
});
