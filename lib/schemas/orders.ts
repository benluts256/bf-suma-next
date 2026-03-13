import { z } from 'zod';

export const orderTrackSchema = z.object({
  orderId: z
    .string()
    .trim()
    .uuid('Order ID must be a valid UUID'),
});

export type OrderTrackInput = z.infer<typeof orderTrackSchema>;

