import { IPaymentProvider, IServiceHealth } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';

export class StripeProvider implements IPaymentProvider {
    public name = 'Stripe (disabled)';

    constructor() {
        // Stripe provider is disabled; Razorpay is the active payment provider.
    }

    async createPaymentIntent(_amount: number, _currency: string = 'usd', _metadata: any = {}): Promise<any> {
        throw new AppError('Stripe provider is not enabled. Use Razorpay.', 500);
    }

    async verifyPayment(_orderId: string, _paymentId: string, _signature: string): Promise<boolean> {
        throw new AppError('Stripe provider is not enabled. Use Razorpay.', 500);
    }

    async refundPayment(_transactionId: string, _amount?: number): Promise<any> {
        throw new AppError('Stripe provider is not enabled. Use Razorpay.', 500);
    }

    async checkHealth(): Promise<IServiceHealth> {
        return { service: 'Stripe', status: 'DOWN', error: 'Disabled — using Razorpay' };
    }
}
