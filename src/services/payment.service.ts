import Stripe from 'stripe';
import logger from '../config/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-11-20.acacia' as any, // Cast to any to bypass strict version check if types are outdated
});

export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects amount in cents
            currency,
        });
        return paymentIntent;
    } catch (error) {
        logger.error('Error creating payment intent', error);
        throw error;
    }
};

export const verifyPayment = async (paymentIntentId: string) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent.status === 'succeeded';
    } catch (error) {
        logger.error('Error verifying payment', error);
        throw error;
    }
}
