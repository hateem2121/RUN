/**
 * User Repository Unit Tests
 * Tests user CRUD operations with mocked database
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database module
vi.mock("../../../server/db.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

// Import after mocking
import { db } from "../../../server/db.js";
import { UserRepository } from "../../../server/lib/db/repositories/user-repository.js";

describe("UserRepository", () => {
  let userRepository: UserRepository;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    profileImageUrl: "https://example.com/avatar.jpg",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userRepository = new UserRepository();
    vi.clearAllMocks();
  });

  describe("getUser", () => {
    it("should return user by ID", async () => {
      vi.mocked(db.select().from).mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser]),
      } as any);

      const result = await userRepository.getUser("user-123");

      expect(result).toEqual(mockUser);
    });

    it("should return undefined for non-existent user", async () => {
      vi.mocked(db.select().from).mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await userRepository.getUser("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user by email", async () => {
      vi.mocked(db.select().from).mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser]),
      } as any);

      const result = await userRepository.getUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
    });
  });

  describe("upsertUser", () => {
    it("should create new user", async () => {
      const mockReturning = vi.fn().mockResolvedValue([mockUser]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: mockReturning,
          }),
        }),
      } as any);

      const result = await userRepository.upsertUser({
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      });

      expect(result).toEqual(mockUser);
    });

    it("should throw error if no user returned", async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: mockReturning,
          }),
        }),
      } as any);

      await expect(
        userRepository.upsertUser({
          id: "user-123",
          email: "test@example.com",
        }),
      ).rejects.toThrow("Failed to upsert user");
    });
  });

  describe("setAdminStatus", () => {
    it("should update admin status", async () => {
      const adminUser = { ...mockUser, isAdmin: true };
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([adminUser]),
          }),
        }),
      } as any);

      const result = await userRepository.setAdminStatus("user-123", true);

      expect(result?.isAdmin).toBe(true);
    });
  });

  describe("getAdminUsers", () => {
    it("should return all admin users", async () => {
      const adminUsers = [
        { ...mockUser, isAdmin: true },
        { ...mockUser, id: "admin-2", isAdmin: true },
      ];
      vi.mocked(db.select().from).mockReturnValue({
        where: vi.fn().mockResolvedValue(adminUsers),
      } as any);

      const result = await userRepository.getAdminUsers();

      expect(result).toHaveLength(2);
      expect(result.every((u) => u.isAdmin)).toBe(true);
    });
  });
});
