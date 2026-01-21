import { z } from 'zod';

const timestampNumber = z.number().int();

export const SimulationFrameworkSchema = z.enum(['brian2', 'nengo', 'other']);
export type SimulationFramework = z.infer<typeof SimulationFrameworkSchema>;

export const SimulationArtifactSchema = z.object({
  fileName: z.string(),
  storageKey: z.string(),
  url: z.string().optional(),
  contentType: z.string().optional(),
});
export type SimulationArtifact = z.infer<typeof SimulationArtifactSchema>;

export const SimulationModelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  framework: SimulationFrameworkSchema,
  repoPath: z.string().optional(),
  files: z.array(z.string()).default([]),
  versionTag: z.string().optional(),
  gitCommit: z.string().optional(),
  linkedPapers: z.array(z.string()).default([]),
  assumptionsMd: z.string().default(''),
  validationPapers: z.array(z.string()).default([]),
  parametersSchema: z.record(z.unknown()).default({}),
  defaultParams: z.record(z.unknown()).default({}),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type SimulationModel = z.infer<typeof SimulationModelSchema>;

export const CreateSimulationModelSchema = SimulationModelSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSimulationModelInput = z.infer<typeof CreateSimulationModelSchema>;

export const SimulationEnvironmentSchema = z.object({
  pythonVersion: z.string().optional(),
  packageVersions: z.record(z.string()).default({}),
  cpu: z.string().optional(),
  gpu: z.string().optional(),
});
export type SimulationEnvironment = z.infer<typeof SimulationEnvironmentSchema>;

export const SimulationRunSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  runLabel: z.string().min(1),
  timestampStart: timestampNumber,
  timestampEnd: timestampNumber.optional(),
  params: z.record(z.unknown()).default({}),
  randomSeed: z.number().int().optional(),
  environment: SimulationEnvironmentSchema.optional(),
  outputs: z.array(SimulationArtifactSchema).default([]),
  metrics: z.record(z.unknown()).default({}),
  linkedPapers: z.array(z.string()).default([]),
  notesMd: z.string().default(''),
  tags: z.array(z.string()).default([]),
  createdAt: timestampNumber,
  updatedAt: timestampNumber,
});
export type SimulationRun = z.infer<typeof SimulationRunSchema>;

export const CreateSimulationRunSchema = SimulationRunSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSimulationRunInput = z.infer<typeof CreateSimulationRunSchema>;
