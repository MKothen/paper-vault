import { z } from 'zod';

const timestampNumber = z.number().int();

export const RunMetricSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
});
export type RunMetric = z.infer<typeof RunMetricSchema>;

export const RunSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.string(),
  aim: z.string().optional(),
  modelConceptIds: z.array(z.string()).default([]),
  methodConceptIds: z.array(z.string()).default([]),
  datasetLinks: z.array(z.string()).default([]),
  codeLinks: z.array(z.string()).default([]),
  parameters: z.record(z.string(), z.unknown()).default({}),
  resultsSummaryMd: z.string().default(''),
  metrics: z.array(RunMetricSchema).default([]),
  artifacts: z.array(z.string()).default([]),
  qcMd: z.string().default(''),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
  parentRunId: z.string().optional(),
  sweepKey: z.string().optional(),
});
export type Run = z.infer<typeof RunSchema>;

export const CreateRunSchema = RunSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateRunInput = z.infer<typeof CreateRunSchema>;

export const RunSweepDimensionSchema = z.object({
  key: z.string().min(1),
  values: z.array(z.union([z.string(), z.number(), z.boolean()])),
});
export type RunSweepDimension = z.infer<typeof RunSweepDimensionSchema>;
