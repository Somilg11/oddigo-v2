import Redis from 'ioredis';
import logger from './logger';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
    logger.info('Redis Connected');
});

redis.on('error', (err) => {
    logger.error('Redis Error', err);
});

export default redis;
