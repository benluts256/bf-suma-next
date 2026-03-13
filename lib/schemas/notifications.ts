import { z } from 'zod';

export const notificationMarkReadSchema = z.object({
  notificationId: z.string().uuid('Invalid notification id'),
});

export type NotificationMarkReadInput = z.infer<typeof notificationMarkReadSchema>;

