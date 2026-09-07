/**
 * RBAC-01: 64-bit Bitmask RBAC Evaluation
 *
 * Implements high-performance, single-cycle authorization using BigInt bitwise operators.
 */

// 64-bit Permission Bitmasks
export const CATALOG_READ = 1n << 0n;
export const CATALOG_WRITE = 1n << 1n;
export const MEDIA_MANAGE = 1n << 2n;
export const ORDERS_READ = 1n << 3n;
export const ORDERS_WRITE = 1n << 4n;
export const USERS_MANAGE = 1n << 5n;
export const SETTINGS_WRITE = 1n << 6n;
export const AUDIT_READ = 1n << 7n;
export const ADMIN_SUPER = ~0n;

export const PERMISSIONS = {
  CATALOG_READ,
  CATALOG_WRITE,
  MEDIA_MANAGE,
  ORDERS_READ,
  ORDERS_WRITE,
  USERS_MANAGE,
  SETTINGS_WRITE,
  AUDIT_READ,
  ADMIN_SUPER,
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Checks if user bitmask includes all required permissions.
 * Evaluates in 1 CPU cycle: (userBitmask & required) === required.
 */
export function hasPermission(userBitmask: bigint, required: bigint): boolean {
  return (userBitmask & required) === required;
}

/**
 * Checks if user bitmask includes ANY of the provided permissions.
 */
export function hasAnyPermission(userBitmask: bigint, ...perms: bigint[]): boolean {
  if (perms.length === 0) return false;
  return perms.some((p) => (userBitmask & p) !== 0n);
}

/**
 * Combines multiple permission bitmasks using bitwise OR.
 */
export function combinePermissions(...perms: bigint[]): bigint {
  return perms.reduce((acc, p) => acc | p, 0n);
}

/**
 * Resolves standard role name to its associated 64-bit permission bitmask.
 */
export function getRolePermissions(role: string): bigint {
  const normalized = role.toLowerCase().trim();
  switch (normalized) {
    case "admin":
    case "superadmin":
      return ADMIN_SUPER;
    case "editor":
      return CATALOG_READ | CATALOG_WRITE | MEDIA_MANAGE | ORDERS_READ;
    case "manager":
      return CATALOG_READ | CATALOG_WRITE | MEDIA_MANAGE | ORDERS_READ | ORDERS_WRITE | AUDIT_READ;
    case "viewer":
      return CATALOG_READ | ORDERS_READ;
    case "auditor":
      return CATALOG_READ | ORDERS_READ | AUDIT_READ;
    case "user":
    case "customer":
      return CATALOG_READ;
    default:
      return 0n;
  }
}
