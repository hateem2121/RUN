/**
 * Lightweight Dependency Injection Container
 *
 * @module di-container
 * @description A minimal, type-safe DI container for managing service dependencies.
 * Enables loose coupling, easier testing, and explicit dependency declaration.
 *
 * @architecture
 * - Services are registered with string tokens
 * - Factory functions enable lazy instantiation
 * - Singleton pattern ensures single instance per service
 *
 * @example
 * ```typescript
 * // Register services
 * container.register('db', () => db);
 * container.register('cache', () => unifiedCache);
 *
 * // Resolve dependencies
 * const database = container.resolve<Database>('db');
 * ```
 */

type ServiceFactory<T> = () => T;

interface ServiceRegistration<T> {
  factory: ServiceFactory<T>;
  instance?: T;
  singleton: boolean;
}

/**
 * Dependency Injection Container
 *
 * Provides a centralized registry for application services with support for:
 * - Lazy instantiation via factory functions
 * - Singleton pattern for shared instances
 * - Type-safe resolution with generics
 */
export class Container {
  private services = new Map<string, ServiceRegistration<unknown>>();

  /**
   * Register a service factory
   *
   * @param token - Unique identifier for the service
   * @param factory - Factory function that creates the service instance
   * @param singleton - If true, reuse the same instance (default: true)
   *
   * @example
   * ```typescript
   * container.register('logger', () => new Logger(), true);
   * ```
   */
  register<T>(token: string, factory: ServiceFactory<T>, singleton = true): void {
    this.services.set(token, { factory, singleton });
  }

  /**
   * Resolve a service by token
   *
   * @param token - The service identifier
   * @returns The service instance
   * @throws Error if service is not registered
   *
   * @example
   * ```typescript
   * const db = container.resolve<Database>('db');
   * ```
   */
  resolve<T>(token: string): T {
    const registration = this.services.get(token);

    if (!registration) {
      throw new Error(`Service not registered: ${token}`);
    }

    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance as T;
    }

    return registration.factory() as T;
  }

  /**
   * Check if a service is registered
   *
   * @param token - The service identifier
   * @returns True if the service is registered
   */
  has(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all registered services
   * Useful for testing to reset the container state
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Clear a specific service's cached instance
   * Forces re-instantiation on next resolve
   *
   * @param token - The service identifier
   */
  clearInstance(token: string): void {
    const registration = this.services.get(token);
    if (registration) {
      registration.instance = undefined;
    }
  }

  /**
   * Get all registered service tokens
   * Useful for debugging and introspection
   */
  getTokens(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Global application container instance
 * Use this for registering and resolving application-wide services
 */
export const container = new Container();

/**
 * Service tokens for type-safe dependency resolution
 *
 * @example
 * ```typescript
 * const db = container.resolve<Database>(ServiceTokens.DATABASE);
 * ```
 */
export const ServiceTokens = {
  DATABASE: "db",
  CACHE: "cache",
  LOGGER: "logger",
  AUTH: "auth",
  STORAGE: "storage",
  MEDIA: "media",
  METRICS: "metrics",
} as const;

export type ServiceToken = (typeof ServiceTokens)[keyof typeof ServiceTokens];
