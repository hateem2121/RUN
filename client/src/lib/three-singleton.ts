/**
 * Three.js Singleton Manager
 * Prevents multiple Three.js instances and memory leaks
 */

class ThreeJSManager {
  private static instance: ThreeJSManager | null = null;
  // private threeInstance: unknown = null;
  private activeInstances: Set<string> = new Set();
  private cleanupCallbacks: Set<(() => void)> = new Set();

  private constructor() {
    // Removed debug console statement for production
  }

  public static getInstance(): ThreeJSManager {
    if (!ThreeJSManager.instance) {
      ThreeJSManager.instance = new ThreeJSManager();
    }
    return ThreeJSManager.instance;
  }

  public registerInstance(componentName: string): void {
    if (this.activeInstances.has(componentName)) {
      // Removed debug console statement for production
      return;
    }

    this.activeInstances.add(componentName);
    // Removed debug console statement for production
  }

  public unregisterInstance(componentName: string): void {
    if (this.activeInstances.has(componentName)) {
      this.activeInstances.delete(componentName);
      // Removed debug console statement for production
    }
  }

  public addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  public removeCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback);
  }

  public cleanup(): void {
    // Removed debug console statement for production

    // Execute all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('[Three.js Cleanup] Error in cleanup callback:', error);
      }
    });

    // Clear all registrations
    this.activeInstances.clear();
    this.cleanupCallbacks.clear();
  }

  public getActiveInstanceCount(): number {
    return this.activeInstances.size;
  }

  public checkMultipleInstances(): void {
    if (this.activeInstances.size > 1) {
      console.warn('WARNING: Multiple instances of Three.js being imported.');
    }
  }
}

// Global cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ThreeJSManager.getInstance().cleanup();
  });
}

export default ThreeJSManager;