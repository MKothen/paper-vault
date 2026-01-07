import { z } from 'zod';

const timestampNumber = z.number().int();

export const CodeSnippetSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  code: z.string().min(1),
  language: z.string().min(1),
  tags: z.array(z.string()).default([]),
  linkedPapers: z.array(z.string()).default([]),
  linkedModels: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type CodeSnippet = z.infer<typeof CodeSnippetSchema>;

export const CreateCodeSnippetSchema = CodeSnippetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCodeSnippetInput = z.infer<typeof CreateCodeSnippetSchema>;
