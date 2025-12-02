import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        worker: z.string().min(1, 'Worker ID is required'),
        serviceType: z.string().min(1, 'Service type is required'),
        price: z.number().positive('Price must be positive'),
        description: z.string().optional(),
    }),
});

export const updateStatusSchema = z.object({
    body: z.object({
        status: z.enum(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
        otp: z.string().length(4).optional(),
    }),
});
