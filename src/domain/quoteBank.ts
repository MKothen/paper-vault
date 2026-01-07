import { z } from 'zod';

const timestampNumber = z.number().int();

export const QuoteItemSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  quote: z.string().min(1),
  context: z.string().optional(),
  page: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type QuoteItem = z.infer<typeof QuoteItemSchema>;

export const CreateQuoteItemSchema = QuoteItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateQuoteItemInput = z.infer<typeof CreateQuoteItemSchema>;
