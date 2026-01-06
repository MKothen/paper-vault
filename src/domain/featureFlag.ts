import { z } from 'zod';

export const FeatureFlagSchema = z.object({
  copilot: z.boolean().default(false),
  semanticSearch: z.boolean().default(false),
  projects: z.boolean().default(false),
  systematicReview: z.boolean().default(false),
});

export type FeatureFlags = z.infer<typeof FeatureFlagSchema>;

export const defaultFeatureFlags: FeatureFlags = FeatureFlagSchema.parse({});
