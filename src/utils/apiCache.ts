/**
 * In-memory cache untuk API response.
 * Mencegah polling yang terlalu sering membaca row D1 yang sama berulang kali.
 *
 * Cache bersifat per-session (hilang saat refresh/close tab).
 * Setiap mutasi (POST/PUT/DELETE) wajib memanggil invalidate() untuk membersihkan cache.
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<any>>();

/**
 * Ambil data dari cache jika masih segar (belum expired).
 * @param key - Cache key (biasanya endpoint URL)
 * @param ttlMs - Time to live dalam milidetik
 * @returns Data dari cache, atau null jika expired/tidak ada
 */
export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Simpan data ke cache.
 * @param key - Cache key
 * @param data - Data yang disimpan
 */
export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

/**
 * Hapus satu atau beberapa key dari cache (prefix match).
 * Panggil setelah mutasi data agar data tidak basi.
 * @param prefix - Prefix key yang akan dihapus, misal '/patients'
 */
export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/**
 * Bersihkan seluruh cache.
 */
export function clearAllCache(): void {
  store.clear();
}
