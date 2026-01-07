import { z } from 'zod';

const timestampNumber = z.number().int();

export const MethodsSnippetSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  bodyMd: z.string().min(1),
  linkedPapers: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type MethodsSnippet = z.infer<typeof MethodsSnippetSchema>;

export const CreateMethodsSnippetSchema = MethodsSnippetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMethodsSnippetInput = z.infer<typeof CreateMethodsSnippetSchema>;
