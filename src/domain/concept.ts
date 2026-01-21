import { z } from 'zod';

const timestampNumber = z.number().int();

export const ConceptTypeSchema = z.enum([
  'BrainRegion',
  'CellType',
  'Method',
  'Paradigm',
  'Molecule',
  'Model',
  'Theory',
  'DatasetFormat',
  'Metric',
]);
export type ConceptType = z.infer<typeof ConceptTypeSchema>;

export const ConceptSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: ConceptTypeSchema,
  parentId: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type Concept = z.infer<typeof ConceptSchema>;

export const CreateConceptSchema = ConceptSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateConceptInput = z.infer<typeof CreateConceptSchema>;
