import { describe, expect, it } from "vitest";
import {
  ADMIN_SUPER,
  AUDIT_READ,
  CATALOG_READ,
  CATALOG_WRITE,
  combinePermissions,
  getRolePermissions,
  hasAnyPermission,
  hasPermission,
  MEDIA_MANAGE,
  ORDERS_READ,
  ORDERS_WRITE,
  SETTINGS_WRITE,
  USERS_MANAGE,
} from "../utils/rbac-bitmask.js";

describe("RBAC-01: 64-bit Bitmask RBAC Evaluation", () => {
  describe("Permission bitmask constants", () => {
    it("should have distinct powers of 2 for distinct permissions", () => {
      const perms = [
        CATALOG_READ,
        CATALOG_WRITE,
        MEDIA_MANAGE,
        ORDERS_READ,
        ORDERS_WRITE,
        USERS_MANAGE,
        SETTINGS_WRITE,
        AUDIT_READ,
      ];

      // Each permission should have exactly one bit set
      for (let i = 0; i < perms.length; i++) {
        for (let j = i + 1; j < perms.length; j++) {
          expect(perms[i] & perms[j]).toBe(0n);
        }
      }
    });

    it("ADMIN_SUPER should have all bits set", () => {
      expect(ADMIN_SUPER).toBe(~0n);
    });
  });

  describe("hasPermission", () => {
    it("should return true when user possesses exact required permission", () => {
      const userBits = CATALOG_READ;
      expect(hasPermission(userBits, CATALOG_READ)).toBe(true);
    });

    it("should return true when user possesses a superset of permissions", () => {
      const userBits = CATALOG_READ | CATALOG_WRITE | ORDERS_READ;
      expect(hasPermission(userBits, CATALOG_READ)).toBe(true);
      expect(hasPermission(userBits, CATALOG_WRITE)).toBe(true);
      expect(hasPermission(userBits, combinePermissions(CATALOG_READ, CATALOG_WRITE))).toBe(true);
    });

    it("should return false when user lacks required permission", () => {
      const userBits = CATALOG_READ;
      expect(hasPermission(userBits, CATALOG_WRITE)).toBe(false);
      expect(hasPermission(userBits, combinePermissions(CATALOG_READ, CATALOG_WRITE))).toBe(false);
    });

    it("should grant full access to ADMIN_SUPER", () => {
      const allPerms = combinePermissions(
        CATALOG_READ,
        CATALOG_WRITE,
        MEDIA_MANAGE,
        ORDERS_READ,
        ORDERS_WRITE,
        USERS_MANAGE,
        SETTINGS_WRITE,
        AUDIT_READ,
      );
      expect(hasPermission(ADMIN_SUPER, allPerms)).toBe(true);
    });

    it("should return false for empty user bitmask (0n)", () => {
      expect(hasPermission(0n, CATALOG_READ)).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if user has at least one matching permission", () => {
      const userBits = CATALOG_READ;
      expect(hasAnyPermission(userBits, CATALOG_WRITE, CATALOG_READ, MEDIA_MANAGE)).toBe(true);
    });

    it("should return false if user has none of the requested permissions", () => {
      const userBits = CATALOG_READ;
      expect(hasAnyPermission(userBits, CATALOG_WRITE, MEDIA_MANAGE, ORDERS_WRITE)).toBe(false);
    });

    it("should return false if no permissions to check are provided", () => {
      expect(hasAnyPermission(ADMIN_SUPER)).toBe(false);
    });
  });

  describe("combinePermissions", () => {
    it("should combine multiple permissions using bitwise OR", () => {
      const combined = combinePermissions(CATALOG_READ, MEDIA_MANAGE, AUDIT_READ);
      expect(hasPermission(combined, CATALOG_READ)).toBe(true);
      expect(hasPermission(combined, MEDIA_MANAGE)).toBe(true);
      expect(hasPermission(combined, AUDIT_READ)).toBe(true);
      expect(hasPermission(combined, CATALOG_WRITE)).toBe(false);
    });

    it("should return 0n when called with no arguments", () => {
      expect(combinePermissions()).toBe(0n);
    });
  });

  describe("getRolePermissions", () => {
    it("should map admin and superadmin to ADMIN_SUPER", () => {
      expect(getRolePermissions("admin")).toBe(ADMIN_SUPER);
      expect(getRolePermissions("superadmin")).toBe(ADMIN_SUPER);
      expect(getRolePermissions("ADMIN")).toBe(ADMIN_SUPER);
    });

    it("should map editor to catalog, media, and order permissions", () => {
      const editorPerms = getRolePermissions("editor");
      expect(hasPermission(editorPerms, CATALOG_READ)).toBe(true);
      expect(hasPermission(editorPerms, CATALOG_WRITE)).toBe(true);
      expect(hasPermission(editorPerms, MEDIA_MANAGE)).toBe(true);
      expect(hasPermission(editorPerms, ORDERS_READ)).toBe(true);
      expect(hasPermission(editorPerms, USERS_MANAGE)).toBe(false);
    });

    it("should map viewer to read-only permissions", () => {
      const viewerPerms = getRolePermissions("viewer");
      expect(hasPermission(viewerPerms, CATALOG_READ)).toBe(true);
      expect(hasPermission(viewerPerms, ORDERS_READ)).toBe(true);
      expect(hasPermission(viewerPerms, CATALOG_WRITE)).toBe(false);
      expect(hasPermission(viewerPerms, MEDIA_MANAGE)).toBe(false);
    });

    it("should return 0n for unknown or empty roles", () => {
      expect(getRolePermissions("guest")).toBe(0n);
      expect(getRolePermissions("")).toBe(0n);
    });
  });

  describe("Sub-microsecond evaluation benchmark", () => {
    it("should evaluate 100,000 bitmask checks in under 50ms", () => {
      const userBits = getRolePermissions("editor");
      const required = combinePermissions(CATALOG_READ, ORDERS_READ);

      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        hasPermission(userBits, required);
      }
      const duration = performance.now() - start;

      // 100k operations in < 50ms implies < 0.0005ms (0.5µs) per check!
      expect(duration).toBeLessThan(50);
    });
  });
});
