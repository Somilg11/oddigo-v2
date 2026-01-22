import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
    console.log('✅ Redis Connected');
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err);
});

export default redis;
