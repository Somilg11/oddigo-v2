import Razorpay from 'razorpay';
import crypto from 'crypto';
import { IPaymentProvider, IServiceHealth } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';
import { Logger } from '../../config/logger';

export class RazorpayProvider implements IPaymentProvider {
    public name = 'Razorpay';
    private razorpay: Razorpay;

    constructor() {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new AppError('Razorpay credentials not configured', 500);
        }

        this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }

    async createPaymentIntent(amount: number, currency: string = 'inr', metadata: any = {}): Promise<any> {
        try {
            const options = {
                amount: Math.round(amount * 100), // Razorpay expects amount in paise
                currency: currency.toUpperCase(),
                receipt: `rcpt_${metadata.jobId || Date.now()}`,
                notes: {
                    jobId: metadata.jobId || '',
                    paymentMethod: metadata.paymentMethod || 'online',
                },
            };

            const order = await this.razorpay.orders.create(options);
            Logger.info(`Razorpay order created: ${order.id} for ₹${amount}`);

            return {
                id: order.id,
                amount: Number(order.amount) / 100,
                currency: order.currency,
                status: order.status,
                receipt: order.receipt,
                key_id: process.env.RAZORPAY_KEY_ID, // Needed by frontend to init SDK
            };
        } catch (error: any) {
            throw new AppError(`Razorpay Error: ${error.message}`, 500);
        }
    }

    async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean> {
        try {
            const body = `${razorpayOrderId}|${razorpayPaymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(body)
                .digest('hex');

            const isValid = expectedSignature === razorpaySignature;

            if (!isValid) {
                Logger.warn(`Razorpay signature mismatch for order ${razorpayOrderId}`);
            }

            return isValid;
        } catch (error: any) {
            Logger.error(`Razorpay verification error: ${error.message}`);
            return false;
        }
    }

    async getPaymentDetails(paymentId: string): Promise<any> {
        try {
            return await this.razorpay.payments.fetch(paymentId);
        } catch (error: any) {
            throw new AppError(`Razorpay fetch error: ${error.message}`, 500);
        }
    }

    async refundPayment(transactionId: string, amount?: number): Promise<any> {
        try {
            const options: any = {};
            if (amount) {
                options.amount = Math.round(amount * 100);
            }

            const refund = await this.razorpay.payments.refund(transactionId, options);
            Logger.info(`Razorpay refund created: ${refund.id} for payment ${transactionId}`);
            return refund;
        } catch (error: any) {
            throw new AppError(`Razorpay Refund Error: ${error.message}`, 500);
        }
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        try {
            // Razorpay doesn't have a simple health endpoint; just check if we can init
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                throw new Error('Razorpay credentials not configured');
            }
            return { service: 'Razorpay', status: 'UP', latency: Date.now() - start };
        } catch (error: any) {
            return { service: 'Razorpay', status: 'DOWN', error: error.message };
        }
    }
}
