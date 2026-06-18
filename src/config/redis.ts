import Redis from 'ioredis';
import { Logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
    retryStrategy(times: number) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
});

redis.on('connect', () => {
    Logger.info('Redis connected');
});

redis.on('ready', () => {
    Logger.info('Redis ready');
});

redis.on('error', (err) => {
    Logger.error(`Redis error: ${err.message}`);
});

redis.on('reconnecting', (delay: number) => {
    Logger.warn(`Redis reconnecting in ${delay}ms`);
});

export default redis;
