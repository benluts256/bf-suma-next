import { z } from 'zod';

export const checkoutItemSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  quantity: z.coerce.number().int().min(1).max(100),
});

export const checkoutCreateSchema = z.object({
  shippingAddress: z.string().trim().min(5).max(500).optional(),
  items: z.array(checkoutItemSchema).min(1).max(50),
});

export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;

