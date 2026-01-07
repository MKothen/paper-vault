import { z } from 'zod';

export const FeatureFlagSchema = z.object({
  copilot: z.boolean().default(false),
  semanticSearch: z.boolean().default(false),
  projects: z.boolean().default(false),
  systematicReview: z.boolean().default(false),
  newPDFReader: z.boolean().default(false),
});

export type FeatureFlags = z.infer<typeof FeatureFlagSchema>;

const DEFAULT_FLAGS: FeatureFlags = {
  copilot: false,
  semanticSearch: false,
  projects: true, // Enabling for Milestone 1
  systematicReview: false,
  newPDFReader: false,
};

class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    // In the future, load from localStorage or remote config
    this.flags = DEFAULT_FLAGS;
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  public getFlags(): FeatureFlags {
    return { ...this.flags };
  }
  
  // For development testing
  public setFlag(flag: keyof FeatureFlags, value: boolean) {
      this.flags[flag] = value;
  }
}

export const featureFlags = new FeatureFlagService();
