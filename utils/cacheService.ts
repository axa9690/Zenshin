/**
 * Simple hash function for task caching
 * Uses a basic string hashing algorithm for consistent cache keys
 */

export function generateTaskHash(taskText: string): string {
  let hash = 0;
  if (taskText.length === 0) return hash.toString();

  // Normalize the text (lowercase, trim, remove extra whitespace)
  const normalized = taskText.toLowerCase().trim().replace(/\s+/g, ' ');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36); // Base 36 for shorter keys
}

/**
 * Check if a cached entry is still valid
 */
export function isCacheValid(timestamp: number, durationMs: number = 24 * 60 * 60 * 1000): boolean {
  const now = Date.now();
  return (now - timestamp) < durationMs;
}

/**
 * Clean expired entries from AI categorization cache
 */
export function cleanExpiredCache(): void {
  const cacheKeys = Object.keys(localStorage);
  const aiCachePrefix = 'ai_categorization_';

  cacheKeys.forEach(key => {
    if (key.startsWith(aiCachePrefix)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheEntry = JSON.parse(cached);
          if (!isCacheValid(cacheEntry.timestamp)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Remove invalid cache entries
        localStorage.removeItem(key);
      }
    }
  });
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { totalEntries: number; validEntries: number } {
  const cacheKeys = Object.keys(localStorage);
  const aiCachePrefix = 'ai_categorization_';
  let validEntries = 0;

  cacheKeys.forEach(key => {
    if (key.startsWith(aiCachePrefix)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheEntry = JSON.parse(cached);
          if (isCacheValid(cacheEntry.timestamp)) {
            validEntries++;
          }
        }
      } catch (error) {
        // Invalid entry, don't count
      }
    }
  });

  return {
    totalEntries: cacheKeys.filter(key => key.startsWith(aiCachePrefix)).length,
    validEntries
  };
}