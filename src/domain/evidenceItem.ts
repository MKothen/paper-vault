import { z } from 'zod';

const timestampNumber = z.number().int();

export const EvidenceEntityTypeSchema = z.enum([
  'ionChannelKinetics',
  'plasticityRule',
  'firingRate',
  'membraneConstant',
  'synapticWeight',
]);
export type EvidenceEntityType = z.infer<typeof EvidenceEntityTypeSchema>;

export const EvidenceValueSchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
});
export type EvidenceValue = z.infer<typeof EvidenceValueSchema>;

export const EvidenceItemFieldsSchema = z
  .object({
    value: EvidenceValueSchema.optional(),
    condition: z.string().optional(),
    region: z.string().optional(),
    species: z.string().optional(),
    technique: z.string().optional(),
    temperatureC: EvidenceValueSchema.optional(),
    tauMs: EvidenceValueSchema.optional(),
    vHalfMv: EvidenceValueSchema.optional(),
    gmaxNs: EvidenceValueSchema.optional(),
    tauPreMs: EvidenceValueSchema.optional(),
    tauPostMs: EvidenceValueSchema.optional(),
    learningRate: EvidenceValueSchema.optional(),
    firingRateHz: EvidenceValueSchema.optional(),
    membraneTauMs: EvidenceValueSchema.optional(),
    synapticWeight: EvidenceValueSchema.optional(),
    notes: z.string().optional(),
  })
  .passthrough();
export type EvidenceItemFields = z.infer<typeof EvidenceItemFieldsSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  entityType: EvidenceEntityTypeSchema,
  fields: EvidenceItemFieldsSchema,
  extractedFrom: z
    .object({
      page: z.number().int().optional(),
      quote: z.string().optional(),
      figureId: z.string().optional(),
      tableId: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const CreateEvidenceItemSchema = EvidenceItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateEvidenceItemInput = z.infer<typeof CreateEvidenceItemSchema>;
