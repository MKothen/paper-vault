import { z } from 'zod';

const timestampNumber = z.number().int();

export const ProtocolChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  done: z.boolean().default(false),
});
export type ProtocolChecklistItem = z.infer<typeof ProtocolChecklistItemSchema>;

export const ProtocolSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  version: z.string().min(1),
  bodyMd: z.string().default(''),
  checklist: z.array(ProtocolChecklistItemSchema).default([]),
  attachments: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type Protocol = z.infer<typeof ProtocolSchema>;

export const CreateProtocolSchema = ProtocolSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateProtocolInput = z.infer<typeof CreateProtocolSchema>;
