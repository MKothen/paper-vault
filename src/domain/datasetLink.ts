import { z } from 'zod';

const timestampNumber = z.number().int();

export const DatasetLinkTypeSchema = z.enum(['Dataset', 'Code', 'Notebook']);
export type DatasetLinkType = z.infer<typeof DatasetLinkTypeSchema>;

export const DatasetLinkSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: DatasetLinkTypeSchema,
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  formatConceptIds: z.array(z.string()).default([]),
  license: z.string().optional(),
  version: z.string().optional(),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type DatasetLink = z.infer<typeof DatasetLinkSchema>;

export const CreateDatasetLinkSchema = DatasetLinkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateDatasetLinkInput = z.infer<typeof CreateDatasetLinkSchema>;
