import { z } from 'zod';

const timestampNumber = z.number().int();

export const CaptureInboxSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string().optional(),
  source: z.string().optional(),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type CaptureInboxItem = z.infer<typeof CaptureInboxSchema>;

export const CreateCaptureInboxSchema = CaptureInboxSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCaptureInboxInput = z.infer<typeof CreateCaptureInboxSchema>;
