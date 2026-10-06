import { z } from 'zod';

export const createUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email address').optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z
        .union([z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone format'), z.literal('')])
        .optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
    avatar: z.string().optional(),
});
