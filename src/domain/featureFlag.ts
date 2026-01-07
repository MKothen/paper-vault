export interface FeatureFlags {
  enableCopilot: boolean;
  enableSemanticSearch: boolean;
  enableProjects: boolean;
}

const defaults: FeatureFlags = {
  enableCopilot: false,
  enableSemanticSearch: false,
  enableProjects: true, // Enabling this as it's the core of the upgrade
};

export const getFeatureFlags = (): FeatureFlags => {
  // In the future, this could read from localStorage or environment variables
  // e.g., import.meta.env.VITE_ENABLE_COPILOT
  return {
      ...defaults,
      enableCopilot: import.meta.env.VITE_ENABLE_COPILOT === 'true',
      enableSemanticSearch: import.meta.env.VITE_ENABLE_SEMANTIC_SEARCH === 'true',
  };
};
