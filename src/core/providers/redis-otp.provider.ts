import redis from '../../config/redis';
import { IOTPProvider, IServiceHealth, IEmailProvider } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';

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

        const html = `<h1>Your OTP</h1><p>${code}</p>`;
        await this.emailProvider.sendEmail(to, 'Login OTP', html);
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
