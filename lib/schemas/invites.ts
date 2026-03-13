import { z } from 'zod';

export const createInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email is too long'),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

