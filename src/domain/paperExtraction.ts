import { z } from 'zod';

const timestampNumber = z.number().int();

export const ReproChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  done: z.boolean().default(false),
});
export type ReproChecklistItem = z.infer<typeof ReproChecklistItemSchema>;

export const PaperExtractionSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  projectId: z.string().optional(),
  taskParadigmConceptIds: z.array(z.string()).default([]),
  dataTypeConceptIds: z.array(z.string()).default([]),
  modelTypeConceptIds: z.array(z.string()).default([]),
  trainingObjective: z.string().optional(),
  evaluationMetrics: z.array(z.string()).default([]),
  keyFindingsMd: z.string().default(''),
  limitationsMd: z.string().default(''),
  reproChecklist: z.array(ReproChecklistItemSchema).default([]),
  linkedRunIds: z.array(z.string()).default([]),
  linkedConceptIds: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type PaperExtraction = z.infer<typeof PaperExtractionSchema>;

export const CreatePaperExtractionSchema = PaperExtractionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreatePaperExtractionInput = z.infer<typeof CreatePaperExtractionSchema>;
