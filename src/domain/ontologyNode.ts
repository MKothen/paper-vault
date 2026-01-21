import { z } from 'zod';

const timestampNumber = z.number().int();

export const OntologyNodeTypeSchema = z.enum([
  'brainRegion',
  'ionChannel',
  'plasticity',
  'circuitMotif',
  'modelType',
  'technique',
  'drug',
  'species',
  'preparation',
  'other',
]);
export type OntologyNodeType = z.infer<typeof OntologyNodeTypeSchema>;

export const OntologyExternalRefSchema = z.object({
  source: z.string().min(1),
  id: z.string().min(1),
  url: z.string().url().optional(),
});
export type OntologyExternalRef = z.infer<typeof OntologyExternalRefSchema>;

export const OntologyNodeSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  type: OntologyNodeTypeSchema,
  parentId: z.string().nullable().optional(),
  path: z.array(z.string()).default([]),
  synonyms: z.array(z.string()).default([]),
  externalRefs: z.array(OntologyExternalRefSchema).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type OntologyNode = z.infer<typeof OntologyNodeSchema>;

export const CreateOntologyNodeSchema = OntologyNodeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateOntologyNodeInput = z.infer<typeof CreateOntologyNodeSchema>;

export const OntologySettingsSchema = z.object({
  id: z.string(),
  version: z.string().default('v1'),
  lockedDefaultNodes: z.boolean().default(false),
  importSource: z.string().optional(),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type OntologySettings = z.infer<typeof OntologySettingsSchema>;
