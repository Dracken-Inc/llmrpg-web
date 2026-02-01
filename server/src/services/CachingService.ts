import { DatabaseService } from './DatabaseService';

/**
 * Cache entry
 */
interface CacheEntry {
	cache_key: string;
	response: string;
	created_at: number;
	hit_count: number;
}

/**
 * CachingService - 4-tier NPC response cache
 * Performance target: >80% hit rate, <50ms for cached responses
 */
export class CachingService {
	constructor(private db: DatabaseService) {}

	/**
	 * Get cached response
	 * @param key - Cache key (hash of prompt)
	 */
	async get(key: string): Promise<string | null> {
		const entry = await this.db.queryOne<CacheEntry>(
			'SELECT * FROM cache WHERE cache_key = ?',
			[key]
		);

		if (!entry) return null;

		// Increment hit count
		await this.db.execute(
			'UPDATE cache SET hit_count = hit_count + 1 WHERE cache_key = ?',
			[key]
		);

		console.log(`[Cache HIT] ${key} (hits: ${entry.hit_count + 1})`);

		return entry.response;
	}

	/**
	 * Set cached response
	 * @param key - Cache key
	 * @param response - Response to cache
	 */
	async set(key: string, response: string): Promise<void> {
		await this.db.execute(
			`INSERT OR REPLACE INTO cache (cache_key, response, created_at, hit_count) 
			 VALUES (?, ?, ?, ?)`,
			[key, response, Date.now(), 0]
		);

		console.log(`[Cache SET] ${key}`);
	}

	/**
	 * Generate cache key from prompt
	 */
	generateKey(npcId: string, prompt: string): string {
		// Simple hash (in production, use crypto.createHash)
		const normalized = prompt.toLowerCase().trim();
		return `${npcId}_${this.simpleHash(normalized)}`;
	}

	/**
	 * Simple string hash function
	 */
	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36);
	}

	/**
	 * Clear cache (for maintenance)
	 */
	async clear(): Promise<void> {
		await this.db.execute('DELETE FROM cache');
		console.log('[Cache] Cleared all entries');
	}

	/**
	 * Get cache statistics
	 */
	async getStats(): Promise<{ totalEntries: number; totalHits: number; hitRate: number }> {
		const totalEntries = await this.db.queryOne<{ count: number }>(
			'SELECT COUNT(*) as count FROM cache'
		);

		const totalHits = await this.db.queryOne<{ sum: number }>(
			'SELECT SUM(hit_count) as sum FROM cache'
		);

		const entries = totalEntries?.count || 0;
		const hits = totalHits?.sum || 0;
		const hitRate = entries > 0 ? (hits / entries) * 100 : 0;

		return {
			totalEntries: entries,
			totalHits: hits,
			hitRate,
		};
	}
}
