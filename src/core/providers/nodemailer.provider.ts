import nodemailer from 'nodemailer';
import { IEmailProvider, IServiceHealth } from '../interfaces/providers.interface';
import { Logger } from '../../config/logger';

export class NodemailerProvider implements IEmailProvider {
    public name = 'Nodemailer';
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE || 'gmail',
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        if (process.env.NODE_ENV === 'test') return;
        try {
            await this.transporter.sendMail({
                from: `"Oddigo" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });
        } catch (error) {
            Logger.error(`Email Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        try {
            await this.transporter.verify();
            return { service: 'Email (SMTP)', status: 'UP', latency: Date.now() - start };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { service: 'Email (SMTP)', status: 'DOWN', error: message };
        }
    }
}
