import { z } from 'zod';

export const updateImageSchema = z.object({
    description: z.string().max(2200, 'Description must be at most 2200 characters').optional(),
});
