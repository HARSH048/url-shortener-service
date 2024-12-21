import redis from '../config/redis.js';

const CACHE_TTL = 3600; // 1 hour in seconds

export class CacheService {
  static async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key, value, ttl = CACHE_TTL) {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async del(key) {
    await redis.del(key);
  }

  static generateKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  static async getOrSet(key, fetchData, ttl = CACHE_TTL) {
    const cached = await this.get(key);
    if (cached) return cached;

    const data = await fetchData();
    await this.set(key, data, ttl);
    return data;
  }
}