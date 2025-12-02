import nodemailer from 'nodemailer';
import logger from '../config/logger';
import { emailQueue } from '../config/queue';

// Create a transporter (using Ethereal for dev)
const createTransporter = async () => {
    if (process.env.NODE_ENV === 'production') {
        // Configure production email service (e.g., SendGrid, AWS SES)
        return nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USER,
                pass: process.env.SENDGRID_KEY,
            },
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
};

export const sendEmail = async (to: string, subject: string, text: string) => {
    try {
        // Add to queue
        await emailQueue.add('send-email', { to, subject, text });
        logger.info(`Email job added to queue for ${to}`);
    } catch (error) {
        logger.error('Error adding email to queue', error);
    }
};

// Worker to process emails
import { Worker } from 'bullmq';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

const emailWorker = new Worker(
    'email-queue',
    async (job) => {
        const { to, subject, text } = job.data;
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: '"Oddigo" <no-reply@oddigo.com>',
            to,
            subject,
            text,
        });
        logger.info(`Email sent: ${info.messageId}`);
        if (process.env.NODE_ENV !== 'production') {
            logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    },
    { connection }
);

emailWorker.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed`, err);
});
