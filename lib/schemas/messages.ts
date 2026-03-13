import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver id'),
  content: z.string().trim().min(1, 'Message is required').max(2000, 'Message is too long'),
  messageType: z.enum(['text', 'image', 'system']).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

