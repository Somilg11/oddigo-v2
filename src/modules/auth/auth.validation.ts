import { z } from 'zod';

export const registerUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const registerWorkerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phone: z.string().min(10, 'Phone number must be at least 10 digits'),
        serviceType: z.string().min(2, 'Service type is required'),
        hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
    }),
});
