import { IEmailProvider, IOTPProvider, IPaymentProvider, IStorageProvider, IAIProvider } from '../interfaces/providers.interface';
import { NodemailerProvider } from '../providers/nodemailer.provider';
import { RedisOTPProvider } from '../providers/redis-otp.provider';
import { StripeProvider } from '../providers/stripe.provider';
import { CloudinaryProvider } from '../providers/cloudinary.provider';
import { OpenAIProvider } from '../providers/openai.provider';

class ServiceFactory {
    private static emailProvider: IEmailProvider;
    private static otpProvider: IOTPProvider;
    private static paymentProvider: IPaymentProvider;
    private static storageProvider: IStorageProvider;
    private static aiProvider: IAIProvider;

    static getEmailProvider(): IEmailProvider {
        if (!this.emailProvider) {
            this.emailProvider = new NodemailerProvider();
        }
        return this.emailProvider;
    }

    static getOTPProvider(): IOTPProvider {
        if (!this.otpProvider) {
            this.otpProvider = new RedisOTPProvider(this.getEmailProvider());
        }
        return this.otpProvider;
    }

    static getPaymentProvider(): IPaymentProvider {
        if (!this.paymentProvider) {
            this.paymentProvider = new StripeProvider();
        }
        return this.paymentProvider;
    }

    static getStorageProvider(): IStorageProvider {
        if (!this.storageProvider) {
            this.storageProvider = new CloudinaryProvider();
        }
        return this.storageProvider;
    }

    static getAIProvider(): IAIProvider {
        if (!this.aiProvider) {
            this.aiProvider = new OpenAIProvider();
        }
        return this.aiProvider;
    }
}

export default ServiceFactory;
