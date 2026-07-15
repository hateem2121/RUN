import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../server/db.js";
import { StorageSingleton } from "../../../../../server/lib/storage-singleton.js";
import { webhookRepository } from "../../../../../server/services/repositories/webhook-repository.js";

vi.mock("../../../../../server/db.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([{ id: 1 }])),
  },
}));

vi.mock("../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

describe("WebhookRepository", () => {
  let mockStorageInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageInstance = {
      getWebhookSubscriptions: vi.fn(),
      getWebhookSubscription: vi.fn(),
      createWebhookSubscription: vi.fn(),
      updateWebhookSubscription: vi.fn(),
      deleteWebhookSubscription: vi.fn(),
      logWebhookDelivery: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("getWebhookSubscriptions delegates", async () => {
      await webhookRepository.getWebhookSubscriptions();
      expect(mockStorageInstance.getWebhookSubscriptions).toHaveBeenCalled();
    });

    it("getWebhookSubscription delegates", async () => {
      await webhookRepository.getWebhookSubscription(1);
      expect(mockStorageInstance.getWebhookSubscription).toHaveBeenCalled();
    });

    it("createWebhookSubscription delegates", async () => {
      await webhookRepository.createWebhookSubscription({} as any);
      expect(mockStorageInstance.createWebhookSubscription).toHaveBeenCalled();
    });

    it("updateWebhookSubscription delegates", async () => {
      await webhookRepository.updateWebhookSubscription(1, {} as any);
      expect(mockStorageInstance.updateWebhookSubscription).toHaveBeenCalled();
    });

    it("deleteWebhookSubscription delegates", async () => {
      await webhookRepository.deleteWebhookSubscription(1);
      expect(mockStorageInstance.deleteWebhookSubscription).toHaveBeenCalled();
    });

    it("logWebhookDelivery delegates", async () => {
      await webhookRepository.logWebhookDelivery({} as any);
      expect(mockStorageInstance.logWebhookDelivery).toHaveBeenCalled();
    });
  });

  describe("when StorageSingleton has no instance (db logic)", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    it("getWebhookSubscriptions uses db", async () => {
      await webhookRepository.getWebhookSubscriptions();
      expect(db.select).toHaveBeenCalled();
    });

    it("getWebhookSubscription uses db", async () => {
      await webhookRepository.getWebhookSubscription(1);
      expect(db.select).toHaveBeenCalled();
    });

    it("createWebhookSubscription uses db", async () => {
      await webhookRepository.createWebhookSubscription({} as any);
      expect(db.insert).toHaveBeenCalled();
    });

    it("updateWebhookSubscription uses db", async () => {
      await webhookRepository.updateWebhookSubscription(1, {} as any);
      expect(db.update).toHaveBeenCalled();
    });

    it("deleteWebhookSubscription uses db", async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      } as any);
      await webhookRepository.deleteWebhookSubscription(1);
      expect(db.delete).toHaveBeenCalled();
    });

    it("logWebhookDelivery uses db", async () => {
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) } as any);
      await webhookRepository.logWebhookDelivery({} as any);
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
