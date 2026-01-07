/**
 * Cache item metadata
 */
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  updatedAt: number;
}

/**
 * Simple in-memory cache implementation with TTL (Time-To-Live)
 */
export class Cache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set a value in the cache with TTL
   */
  set(key: string, value: T, ttlMs = 60_000): void {
    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + ttlMs,
      updatedAt: now,
    });
  }

  /**
   * Get cached value or compute it if not available
   */
  async getOrFetch(
    key: string,
    fetchFn: () => Promise<T | null>,
    ttlMs = 60_000
  ): Promise<T | null> {
    const cached = this.get(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    if (value !== null) {
      this.set(key, value, ttlMs);
    }
    return value;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}
