import { Queue, Worker } from 'bullmq';
import { Logger as logger } from './logger';
import ServiceFactory from '../core/services/service.factory';

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

export const emailWorker = new Worker('email-queue', async (job) => {
    const { to, subject, html } = job.data;

    logger.info(`Processing email job ${job.id} to ${to}`);

    try {
        const emailProvider = ServiceFactory.getEmailProvider();
        await emailProvider.sendEmail(to, subject, html);
        logger.info(`Email sent successfully to ${to}`);
        return { success: true, to };
    } catch (error: any) {
        logger.error(`Email send failed to ${to}: ${error.message}`);
        throw error;
    }
}, {
    connection,
    concurrency: 5
});

emailWorker.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed: ${err.message}`);
});

export async function sendQueuedEmail(to: string, subject: string, html: string) {
    return emailQueue.add('send-email', { to, subject, html }, {
        priority: 1
    });
}
