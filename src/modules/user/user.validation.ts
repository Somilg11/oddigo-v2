import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        phone: z.string().min(10).optional(),
        address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional(),
            coordinates: z.array(z.number()).length(2).optional(),
        }).optional(),
    }),
});

export const searchWorkersSchema = z.object({
    query: z.object({
        lat: z.string().optional(),
        lng: z.string().optional(),
        serviceType: z.string().optional(),
        distance: z.string().optional(),
    }),
});
