import { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

class ApiCacheService {
  private db = getFirestore();
  private memoryCache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = {
    weather: 30 * 60 * 1000, // 30 minutes
    places: 24 * 60 * 60 * 1000, // 24 hours
    maps: 60 * 60 * 1000, // 1 hour
    default: 15 * 60 * 1000 // 15 minutes
  };

  /**
   * Get cached data for a given key
   */
  async get(key: string, service: string): Promise<any | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
        memoryEntry.hits++;
        console.log(`🎯 Cache hit (memory): ${key} (${service})`);
        return memoryEntry.data;
      }

      // Check Firestore cache
      const cacheRef = doc(this.db, 'api-cache', key);
      const cacheDoc = await getDoc(cacheRef);
      
      if (cacheDoc.exists()) {
        const cacheData = cacheDoc.data();
        if (Date.now() < cacheData.expiresAt) {
          // Update memory cache
          this.memoryCache.set(key, {
            data: cacheData.data,
            timestamp: cacheData.timestamp,
            expiresAt: cacheData.expiresAt,
            hits: (cacheData.hits || 0) + 1
          });
          
          console.log(`🎯 Cache hit (firestore): ${key} (${service})`);
          return cacheData.data;
        } else {
          // Cache expired, remove it
          await this.delete(key);
        }
      }

      console.log(`❌ Cache miss: ${key} (${service})`);
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Set cached data for a given key
   */
  async set(key: string, data: any, service: string, customTTL?: number): Promise<void> {
    try {
      const ttl = customTTL || (this.DEFAULT_TTL as any)[service] || this.DEFAULT_TTL.default;
      const expiresAt = Date.now() + ttl;
      
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiresAt,
        hits: 0,
        service
      };

      // Store in memory cache
      this.memoryCache.set(key, cacheEntry);

      // Store in Firestore cache
      const cacheRef = doc(this.db, 'api-cache', key);
      await setDoc(cacheRef, {
        ...cacheEntry,
        lastUpdated: serverTimestamp()
      });

      console.log(`💾 Cached: ${key} (${service}) - TTL: ${Math.round(ttl / 60000)}min`);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      // Note: Firestore deletion would go here if needed
    } catch (error) {
      console.error('Error deleting from cache:', error);
    }
  }

  /**
   * Generate cache key for API requests
   */
  generateKey(service: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${service}:${btoa(sortedParams)}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): { memoryEntries: number; totalHits: number } {
    const memoryEntries = this.memoryCache.size;
    const totalHits = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    
    return { memoryEntries, totalHits };
  }

  /**
   * Clear expired entries from memory cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const apiCacheService = new ApiCacheService();
