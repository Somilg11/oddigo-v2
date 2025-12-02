import { z } from 'zod';

export const createBannerSchema = z.object({
    body: z.object({
        imageUrl: z.string().url(),
        targetScreen: z.string().min(1),
        isActive: z.boolean().optional(),
    }),
});

export const createOfferSchema = z.object({
    body: z.object({
        code: z.string().min(3),
        description: z.string().min(5),
        discountPercentage: z.number().min(1).max(100),
        maxDiscount: z.number().positive(),
        validUntil: z.string().datetime(), // Expect ISO string
        isActive: z.boolean().optional(),
    }),
});

export const setConfigSchema = z.object({
    body: z.object({
        key: z.string().min(1),
        value: z.any(),
    }),
});
