import { Queue } from 'bullmq';
import { Logger as logger } from './logger';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const emailQueue = new Queue('email-queue', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

emailQueue.on('error', (err) => {
    logger.error('Queue Error', err);
});
