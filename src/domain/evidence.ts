import { z } from 'zod';

export const EvidenceClassificationSchema = z.enum([
  'claim',
  'method',
  'result',
  'conclusion',
  'limitation',
  'confound',
  'definition',
  'statistic',
  'uncategorized'
]);
export type EvidenceClassification = z.infer<typeof EvidenceClassificationSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  paperId: z.string(),
  quote: z.string(),
  page: z.number().int(),
  // Minimal provenance for highlighting.
  // We store rects to allow re-highlighting on the PDF.
  provenance: z.object({
      rects: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })
      ).optional(),
      startOffset: z.number().optional(),
      endOffset: z.number().optional(),
  }).optional(),
  classification: EvidenceClassificationSchema.default('uncategorized'),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
  tags: z.array(z.string()).default([]),
  note: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
