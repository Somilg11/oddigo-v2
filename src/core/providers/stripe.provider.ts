import Stripe from 'stripe';
import { IPaymentProvider, IServiceHealth } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';

export class StripeProvider implements IPaymentProvider {
    public name = 'Stripe';
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
            apiVersion: '2024-12-18.acacia' as any
        });
    }

    async createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}): Promise<any> {
        try {
            return await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency,
                metadata,
                automatic_payment_methods: { enabled: true },
            });
        } catch (error: any) {
            throw new AppError(`Stripe Error: ${error.message}`, 500);
        }
    }

    async refundPayment(transactionId: string, amount?: number): Promise<any> {
        return this.stripe.refunds.create({
            payment_intent: transactionId,
            amount: amount ? Math.round(amount * 100) : undefined
        });
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        try {
            await this.stripe.balance.retrieve(); // Light API interaction
            return { service: 'Stripe', status: 'UP', latency: Date.now() - start };
        } catch (error: any) {
            return { service: 'Stripe', status: 'DOWN', error: error.message };
        }
    }
}
