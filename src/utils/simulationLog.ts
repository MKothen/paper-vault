import { z } from 'zod';

const timestampNumber = z.number().int();

export const SimulationRunLogSchema = z.object({
  schemaVersion: z.number().int().default(1),
  modelRef: z.string().min(1),
  runLabel: z.string().optional(),
  params: z.record(z.unknown()).default({}),
  timestamps: z.object({
    start: timestampNumber,
    end: timestampNumber.optional(),
  }),
  metrics: z
    .object({
      runtimeSeconds: z.number().optional(),
      peakMemoryMB: z.number().optional(),
      convergence: z.string().optional(),
    })
    .default({}),
  randomSeed: z.number().int().optional(),
  environment: z
    .object({
      pythonVersion: z.string().optional(),
      packageVersions: z.record(z.string()).default({}),
      cpu: z.string().optional(),
      gpu: z.string().optional(),
    })
    .optional(),
  artifacts: z
    .array(
      z.object({
        fileName: z.string().min(1),
        type: z.string().min(1),
      }),
    )
    .default([]),
});
export type SimulationRunLog = z.infer<typeof SimulationRunLogSchema>;

export const validateSimulationRunLog = (payload: unknown) => {
  const parsed = SimulationRunLogSchema.safeParse(payload);
  if (parsed.success) {
    return { success: true as const, data: parsed.data };
  }
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return { success: false as const, errors: issues };
};
