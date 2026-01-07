import { describe, it, expect } from 'vitest';
import { generateRunSweep } from '../src/utils/runSweep';
import type { Run } from '../src/domain';

describe('generateRunSweep', () => {
  it('generates Cartesian product runs', () => {
    const baseRun: Run = {
      id: 'parent',
      projectId: 'project_1',
      date: '2024-01-01',
      aim: 'Test sweep',
      modelConceptIds: [],
      methodConceptIds: [],
      datasetLinks: [],
      codeLinks: [],
      parameters: { lr: 0.01 },
      resultsSummaryMd: '',
      metrics: [],
      artifacts: [],
      qcMd: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sweep = generateRunSweep(baseRun, [
      { key: 'lr', values: [0.01, 0.1] },
      { key: 'seed', values: [1, 2] },
    ]);

    expect(sweep.childRuns).toHaveLength(4);
    expect(sweep.childRuns[0].sweepKey).toContain('lr=');
    expect(sweep.childRuns[0].sweepKey).toContain('seed=');
  });
});
