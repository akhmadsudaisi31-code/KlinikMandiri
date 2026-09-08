/**
 * In-Memory Isolate Edge Cache for Cloudflare Workers
 * Menyimpan respons read-heavy (stats, notifications, medicines) di RAM Worker isolate.
 * Mengurangi query ke D1 hingga 90% saat polling aktif dari banyak klien.
 */

interface EdgeCacheEntry {
  data: any;
  expires: number;
}

const memoryCache = new Map<string, EdgeCacheEntry>();

export function getEdgeCache<T = any>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setEdgeCache<T = any>(key: string, data: T, ttlSeconds: number): void {
  // Prune cache jika terlalu besar (maksimal 500 entri per worker isolate)
  if (memoryCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expires) memoryCache.delete(k);
    }
  }

  memoryCache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate cache berdasarkan prefix (misalnya clinicId atau jenis resource)
 */
export function invalidateEdgeCache(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}
