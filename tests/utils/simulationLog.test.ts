import { describe, expect, it } from 'vitest';
import { validateSimulationRunLog } from '../../src/utils/simulationLog';

describe('simulation log validation', () => {
  it('accepts a valid log', () => {
    const result = validateSimulationRunLog({
      schemaVersion: 1,
      modelRef: 'model_1',
      runLabel: 'baseline',
      params: { duration: 1000 },
      timestamps: { start: 1700000000000, end: 1700000005000 },
      metrics: { runtimeSeconds: 5 },
      artifacts: [{ fileName: 'trace.png', type: 'image' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid logs', () => {
    const result = validateSimulationRunLog({
      schemaVersion: 1,
      params: {},
      timestamps: { start: 'bad' },
    });
    expect(result.success).toBe(false);
  });
});
