import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../server/db.js";
import { encrypt, getBlindIndex } from "../../../../../server/lib/encryption.js";
import { logger } from "../../../../../server/lib/monitoring/logger.js";
import { StorageSingleton } from "../../../../../server/lib/storage-singleton.js";
import { UserRepository } from "../../../../../server/services/repositories/user-repository.js";

// Mock Data
const mockRawUser = {
  id: "user-1",
  email: "encrypted:test@example.com",
  emailIndex: "blind:test@example.com",
  firstName: "encrypted:John",
  lastName: "encrypted:Doe",
  profileImageUrl: "encrypted:http://example.com/img.jpg",
  isAdmin: false,
  updatedAt: new Date(),
  createdAt: new Date(),
};

const mockDecryptedUser = {
  ...mockRawUser,
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  profileImageUrl: "http://example.com/img.jpg",
};

const mockSelectWhere = vi.fn();
const mockFrom = vi.fn();

const mockInsertReturning = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockValues = vi.fn();

const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn();
const mockSet = vi.fn();

vi.mock("../../../../../server/db.js", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock("../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/encryption.js", () => ({
  encrypt: vi.fn((val) => (val ? `encrypted:${val}` : val)),
  decrypt: vi.fn((val) => {
    if (val === "encrypted:error") throw new Error("Decrypt error");
    return val.replace("encrypted:", "");
  }),
  getBlindIndex: vi.fn((val) => (val ? `blind:${val}` : val)),
}));

vi.mock("../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("UserRepository", () => {
  let repository: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UserRepository();

    // Setup select mocks
    mockSelectWhere.mockResolvedValue([mockRawUser]);
    mockFrom.mockReturnValue({ where: mockSelectWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    // Setup insert mocks
    mockInsertReturning.mockResolvedValue([mockRawUser]);
    mockOnConflictDoUpdate.mockReturnValue({ returning: mockInsertReturning });
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    (db.insert as any).mockReturnValue({ values: mockValues });

    // Setup update mocks
    mockUpdateReturning.mockResolvedValue([mockRawUser]);
    mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    (db.update as any).mockReturnValue({ set: mockSet });

    (StorageSingleton.hasInstance as any).mockReturnValue(false);
  });

  describe("getUser", () => {
    it("should redirect to StorageSingleton if instance exists", async () => {
      (StorageSingleton.hasInstance as any).mockReturnValue(true);
      const mockStorage = { getUser: vi.fn().mockResolvedValue(mockDecryptedUser) };
      (StorageSingleton.getInstance as any).mockReturnValue(mockStorage);

      const result = await repository.getUser("user-1");

      expect(StorageSingleton.hasInstance).toHaveBeenCalled();
      expect(mockStorage.getUser).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(mockDecryptedUser);
    });

    it("should return and decrypt user from db", async () => {
      const result = await repository.getUser("user-1");

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockSelectWhere).toHaveBeenCalled();
      expect(result).toEqual(mockDecryptedUser);
    });

    it("should return undefined if user not found", async () => {
      mockSelectWhere.mockResolvedValue([]);
      const result = await repository.getUser("non-existent");
      expect(result).toBeUndefined();
    });

    it("should handle partial missing fields during decryption", async () => {
      const partialUser = { id: "user-2" };
      mockSelectWhere.mockResolvedValue([partialUser]);
      const result = await repository.getUser("user-2");
      expect(result).toEqual(partialUser);
    });

    it("should fallback to raw value if decryption throws via safeDecrypt", async () => {
      mockSelectWhere.mockResolvedValue([{ ...mockRawUser, email: "encrypted:error" }]);
      const result = await repository.getUser("user-1");

      // safeDecrypt catches the error internally, logger.error is not called
      expect(logger.error).not.toHaveBeenCalled();
      expect(result?.email).toBe("encrypted:error");
      expect(result?.firstName).toBe("John");
    });

    it("should safely handle non-encrypted strings (no colon)", async () => {
      mockSelectWhere.mockResolvedValue([{ ...mockRawUser, firstName: "PlainName" }]);
      const result = await repository.getUser("user-1");

      expect(result?.firstName).toBe("PlainName");
    });

    it("should fallback to raw data and log error if decryptUser fails catastrophically", async () => {
      // Simulate an error that safeDecrypt cannot catch (e.g. reading the property throws)
      const maliciousUser = { id: "user-3" };
      Object.defineProperty(maliciousUser, "email", {
        get: () => {
          throw new Error("Catastrophic getter failure");
        },
      });
      mockSelectWhere.mockResolvedValue([maliciousUser]);

      const result = await repository.getUser("user-3");
      expect(logger.error).toHaveBeenCalled();
      // returns the original un-decrypted reference
      expect(result.id).toBe("user-3");
    });
  });

  describe("getUserByEmail", () => {
    it("should redirect to StorageSingleton if instance exists", async () => {
      (StorageSingleton.hasInstance as any).mockReturnValue(true);
      const mockStorage = { getUserByEmail: vi.fn().mockResolvedValue(mockDecryptedUser) };
      (StorageSingleton.getInstance as any).mockReturnValue(mockStorage);

      const result = await repository.getUserByEmail("test@example.com");
      expect(mockStorage.getUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(result).toEqual(mockDecryptedUser);
    });

    it("should return and decrypt user from db by emailIndex", async () => {
      const result = await repository.getUserByEmail("test@example.com");
      expect(getBlindIndex).toHaveBeenCalledWith("test@example.com");
      expect(result).toEqual(mockDecryptedUser);
    });

    it("should return undefined if user not found by email", async () => {
      mockSelectWhere.mockResolvedValue([]);
      const result = await repository.getUserByEmail("notfound@example.com");
      expect(result).toBeUndefined();
    });
  });

  describe("upsertUser", () => {
    const upsertData = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      profileImageUrl: "http://example.com/img.jpg",
    };

    it("should redirect to StorageSingleton if instance exists", async () => {
      (StorageSingleton.hasInstance as any).mockReturnValue(true);
      const mockStorage = { upsertUser: vi.fn().mockResolvedValue(mockDecryptedUser) };
      (StorageSingleton.getInstance as any).mockReturnValue(mockStorage);

      const result = await repository.upsertUser(upsertData);
      expect(mockStorage.upsertUser).toHaveBeenCalledWith(upsertData);
      expect(result).toEqual(mockDecryptedUser);
    });

    it("should encrypt data, insert, and return decrypted user", async () => {
      const result = await repository.upsertUser(upsertData);
      expect(encrypt).toHaveBeenCalledWith("test@example.com");
      expect(getBlindIndex).toHaveBeenCalledWith("test@example.com");
      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
      expect(mockInsertReturning).toHaveBeenCalled();
      expect(result).toEqual(mockDecryptedUser);
    });

    it("should handle upsertData with missing optional fields", async () => {
      const partialData = { email: "test@example.com" };
      await repository.upsertUser(partialData);
      expect(encrypt).toHaveBeenCalledWith("test@example.com");
      expect(encrypt).not.toHaveBeenCalledWith("John"); // firstName not passed
    });

    it("should throw error if db fails to return user", async () => {
      mockInsertReturning.mockResolvedValue([]);
      await expect(repository.upsertUser(upsertData)).rejects.toThrow(
        "Failed to upsert user - no user returned from database",
      );
    });
  });

  describe("setAdminStatus", () => {
    it("should redirect to StorageSingleton if instance exists", async () => {
      (StorageSingleton.hasInstance as any).mockReturnValue(true);
      const mockStorage = { setAdminStatus: vi.fn().mockResolvedValue(mockRawUser) };
      (StorageSingleton.getInstance as any).mockReturnValue(mockStorage);

      const result = await repository.setAdminStatus("user-1", true);
      expect(mockStorage.setAdminStatus).toHaveBeenCalledWith("user-1", true);
      expect(result).toEqual(mockRawUser);
    });

    it("should update user admin status and return", async () => {
      const result = await repository.setAdminStatus("user-1", true);
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
      expect(mockUpdateWhere).toHaveBeenCalled();
      expect(mockUpdateReturning).toHaveBeenCalled();
      expect(result).toEqual(mockRawUser);
    });
  });

  describe("updateUser", () => {
    it("should redirect to StorageSingleton if instance exists", async () => {
      (StorageSingleton.hasInstance as any).mockReturnValue(true);
      const mockStorage = { updateUser: vi.fn().mockResolvedValue(mockRawUser) };
      (StorageSingleton.getInstance as any).mockReturnValue(mockStorage);

      const result = await repository.updateUser("user-1", { firstName: "NewName" });
      expect(mockStorage.updateUser).toHaveBeenCalledWith("user-1", { firstName: "NewName" });
      expect(result).toEqual(mockRawUser);
    });

    it("should update user details and return", async () => {
      const result = await repository.updateUser("user-1", { firstName: "NewName" });
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ firstName: "NewName" }));
      expect(mockUpdateWhere).toHaveBeenCalled();
      expect(mockUpdateReturning).toHaveBeenCalled();
      expect(result).toEqual(mockRawUser);
    });
  });

  describe("getAdminUsers", () => {
    it("should redirect to StorageSingleton if instance exists", async () => {
      (StorageSingleton.hasInstance as any).mockReturnValue(true);
      const mockStorage = { getAdminUsers: vi.fn().mockResolvedValue([mockDecryptedUser]) };
      (StorageSingleton.getInstance as any).mockReturnValue(mockStorage);

      const result = await repository.getAdminUsers();
      expect(mockStorage.getAdminUsers).toHaveBeenCalled();
      expect(result).toEqual([mockDecryptedUser]);
    });

    it("should return and decrypt admin users from db", async () => {
      mockSelectWhere.mockResolvedValue([mockRawUser, mockRawUser]);
      const result = await repository.getAdminUsers();
      expect(db.select).toHaveBeenCalled();
      expect(mockSelectWhere).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDecryptedUser);
      expect(result[1]).toEqual(mockDecryptedUser);
    });
  });
});
