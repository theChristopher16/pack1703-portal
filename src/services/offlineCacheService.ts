import { Location } from '../types/firestore';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
}

export interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // maximum number of entries
  version: string; // cache version for invalidation
}

class OfflineCacheService {
  private readonly CACHE_PREFIX = 'pack1703_';
  private readonly LOCATIONS_KEY = 'locations';
  private readonly WEATHER_KEY = 'weather';
  private readonly MAP_STATE_KEY = 'map_state';
  
  private readonly DEFAULT_CONFIG: CacheConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 100,
    version: '1.0.0'
  };

  /**
   * Check if browser supports localStorage
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available for caching');
      return false;
    }

    try {
      const cacheConfig = { ...this.DEFAULT_CONFIG, ...config };
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: cacheConfig.version,
        expiresAt: Date.now() + cacheConfig.maxAge
      };

      const cacheKey = this.getCacheKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
      // Clean up old entries if cache is getting too large
      this.cleanupCache();
      
      return true;
    } catch (error) {
      console.error('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache entry is expired
      if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
        this.remove(key);
        return null;
      }

      // Check if cache version is outdated
      if (cacheEntry.version !== this.DEFAULT_CONFIG.version) {
        this.remove(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      this.remove(key); // Remove corrupted cache entry
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.error('Failed to remove cache entry:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: string[]; totalSize: number } {
    if (!this.isStorageAvailable()) {
      return { size: 0, entries: [], totalSize: 0 };
    }

    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      let totalSize = 0;

      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      });

      return {
        size: cacheKeys.length,
        entries: cacheKeys.map(key => key.replace(this.CACHE_PREFIX, '')),
        totalSize
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { size: 0, entries: [], totalSize: 0 };
    }
  }

  /**
   * Clean up expired and old cache entries
   */
  private cleanupCache(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      // Remove expired entries
      cacheKeys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const cacheEntry: CacheEntry<any> = JSON.parse(cached);
            if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      });

      // If still too many entries, remove oldest ones
      const remainingKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (remainingKeys.length > this.DEFAULT_CONFIG.maxSize) {
        // Sort by timestamp and remove oldest
        const entriesWithTimestamps = remainingKeys.map(key => {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const cacheEntry: CacheEntry<any> = JSON.parse(cached);
              return { key, timestamp: cacheEntry.timestamp };
            } catch (error) {
              return { key, timestamp: 0 };
            }
          }
          return { key, timestamp: 0 };
        });

        entriesWithTimestamps
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, remainingKeys.length - this.DEFAULT_CONFIG.maxSize)
          .forEach(({ key }) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Cache locations data
   */
  cacheLocations(locations: Location[]): boolean {
    return this.set(this.LOCATIONS_KEY, locations, {
      maxAge: 6 * 60 * 60 * 1000, // 6 hours
      maxSize: 1
    });
  }

  /**
   * Get cached locations
   */
  getCachedLocations(): Location[] | null {
    return this.get<Location[]>(this.LOCATIONS_KEY);
  }

  /**
   * Cache weather data for a location
   */
  cacheWeather(locationKey: string, weatherData: any): boolean {
    return this.set(`${this.WEATHER_KEY}_${locationKey}`, weatherData, {
      maxAge: 30 * 60 * 1000, // 30 minutes
      maxSize: 50
    });
  }

  /**
   * Get cached weather data
   */
  getCachedWeather(locationKey: string): any | null {
    return this.get(`${this.WEATHER_KEY}_${locationKey}`);
  }

  /**
   * Cache map state (center, zoom, etc.)
   */
  cacheMapState(mapState: any): boolean {
    return this.set(this.MAP_STATE_KEY, mapState, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 1
    });
  }

  /**
   * Get cached map state
   */
  getCachedMapState(): any | null {
    return this.get(this.MAP_STATE_KEY);
  }

  /**
   * Check if we're online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Listen for online/offline events
   */
  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Get cache size in human-readable format
   */
  getCacheSizeFormatted(): string {
    const stats = this.getStats();
    const sizeInKB = Math.round(stats.totalSize / 1024);
    
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else {
      const sizeInMB = Math.round(sizeInKB / 1024 * 10) / 10;
      return `${sizeInMB} MB`;
    }
  }

  /**
   * Check if cache is available and working
   */
  isCacheAvailable(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      // Test write and read
      const testKey = 'test';
      const testData = { test: true };
      
      if (!this.set(testKey, testData)) {
        return false;
      }
      
      const retrieved = this.get(testKey);
      this.remove(testKey);
      
      return retrieved !== null;
    } catch (error) {
      return false;
    }
  }
}

export const offlineCacheService = new OfflineCacheService();
export default offlineCacheService;
