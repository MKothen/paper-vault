import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FeatureFlagSchema, defaultFeatureFlags } from '../../src/domain/featureFlag.js';

describe('feature flags', () => {
  it('fills defaults for missing flags', () => {
    const parsed = FeatureFlagSchema.parse({ projects: true });

    assert.equal(parsed.projects, true);
    assert.equal(parsed.copilot, defaultFeatureFlags.copilot);
    assert.equal(parsed.semanticSearch, defaultFeatureFlags.semanticSearch);
  });

  it('rejects non-boolean entries', () => {
    const invalid = FeatureFlagSchema.safeParse({ projects: 'yes' });
    assert.equal(invalid.success, false);
  });
});
