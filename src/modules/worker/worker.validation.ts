import { z } from 'zod';

export const updateWorkerProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        phone: z.string().min(10).optional(),
        serviceType: z.string().optional(),
        hourlyRate: z.number().positive().optional(),
    }),
});
