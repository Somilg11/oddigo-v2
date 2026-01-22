import nodemailer from 'nodemailer';
import { IEmailProvider, IServiceHealth } from '../interfaces/providers.interface';

export class NodemailerProvider implements IEmailProvider {
    public name = 'Nodemailer';
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // Placeholder, ideally use env vars
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
                from: `"InstaServe" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });
        } catch (error) {
            console.error('Email Error:', error);
            // We usually don't throw here to prevent blocking user flow
        }
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        try {
            await this.transporter.verify();
            return { service: 'Email (SMTP)', status: 'UP', latency: Date.now() - start };
        } catch (error: any) {
            return { service: 'Email (SMTP)', status: 'DOWN', error: error.message };
        }
    }
}
