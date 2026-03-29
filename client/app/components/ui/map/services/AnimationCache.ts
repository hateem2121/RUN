/**
 * Centralized Lottie animation cache service
 * Prevents duplicate network requests and manages animation lifecycle
 */

export type AnimationType = "client" | "facility";

interface CachedAnimation {
  data: unknown;
  loading: boolean;
  error?: string;
}

class AnimationCacheService {
  private cache = new Map<AnimationType, CachedAnimation>();
  private loadingPromises = new Map<AnimationType, Promise<unknown>>();

  private getAnimationUrl(type: AnimationType): string {
    return type === "client"
      ? "/attached_assets/cycle-point.json"
      : "/attached_assets/map-marker.json";
  }

  async getAnimation(type: AnimationType): Promise<unknown> {
    // Return cached data if available
    const cached = this.cache.get(type);
    if (cached && !cached.loading && !cached.error) {
      return cached.data;
    }

    // Return existing loading promise if in progress
    const existingPromise = this.loadingPromises.get(type);
    if (existingPromise) {
      return existingPromise;
    }

    // Start new loading process
    const loadingPromise = this.loadAnimation(type);
    this.loadingPromises.set(type, loadingPromise);

    try {
      const data = await loadingPromise;
      this.cache.set(type, { data, loading: false });
      this.loadingPromises.delete(type);
      return data;
    } catch (error) {
      this.cache.set(type, {
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load animation",
      });
      this.loadingPromises.delete(type);
      throw error;
    }
  }

  private async loadAnimation(type: AnimationType): Promise<unknown> {
    const url = this.getAnimationUrl(type);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch animation: ${response.status}`);
    }

    return response.json();
  }

  isLoading(type: AnimationType): boolean {
    const cached = this.cache.get(type);
    return cached?.loading || this.loadingPromises.has(type) || false;
  }

  getError(type: AnimationType): string | undefined {
    return this.cache.get(type)?.error;
  }

  preloadAllAnimations(): Promise<(unknown | null)[]> {
    const types: AnimationType[] = ["client", "facility"];
    return Promise.all(
      types.map((type) =>
        this.getAnimation(type).catch((_error) => {
          return null;
        }),
      ),
    );
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Singleton instance
export const animationCache = new AnimationCacheService();
