import redis from '../../config/redis';
import { IOTPProvider, IServiceHealth, IEmailProvider } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';
import { Logger } from '../../config/logger';

export class RedisOTPProvider implements IOTPProvider {
    public name = 'RedisOTP';
    private emailProvider: IEmailProvider;
    private readonly EXPIRE_SECONDS = 600;

    constructor(emailProvider: IEmailProvider) {
        this.emailProvider = emailProvider;
    }

    generate(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async send(to: string, code: string): Promise<void> {
        const key = `otp:${to}`;
        await redis.set(key, code, 'EX', this.EXPIRE_SECONDS);

        const html = `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px}.otp-box{background:#f0f0f0;border-radius:10px;padding:20px;text-align:center;margin:20px 0}.otp{font-size:32px;font-weight:bold;letter-spacing:5px;color:#333}</style></head>
<body>
<h1>Oddigo - OTP Verification</h1>
<p>Your One-Time Password (OTP) is:</p>
<div class="otp-box"><div class="otp">${code}</div></div>
<p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
<p style="color:#666;font-size:12px">If you didn't request this, please ignore this email.</p>
</body>
</html>`;

        await this.emailProvider.sendEmail(to, 'Oddigo - Login OTP', html);
        Logger.info(`OTP sent to ${to}`);
    }

    async verify(to: string, code: string): Promise<boolean> {
        const key = `otp:${to}`;
        const stored = await redis.get(key);
        if (!stored) throw new AppError('OTP expired', 400);
        if (stored !== code) throw new AppError('Invalid OTP', 400);

        await redis.del(key);
        return true;
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        try {
            await redis.ping();
            return { service: 'OTP Service (Redis)', status: 'UP', latency: Date.now() - start };
        } catch (error: any) {
            return { service: 'OTP Service (Redis)', status: 'DOWN', error: error.message };
        }
    }
}
