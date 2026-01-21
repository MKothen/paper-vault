import type { Run, RunSweepDimension } from '../domain';

export type RunSweepResult = {
  parentRun: Run;
  childRuns: Run[];
};

export const generateRunSweep = (
  baseRun: Run,
  dimensions: RunSweepDimension[],
): RunSweepResult => {
  if (dimensions.length === 0) {
    return { parentRun: baseRun, childRuns: [] };
  }

  const timestamp = Date.now();
  const parentRun: Run = {
    ...baseRun,
    id: baseRun.id || `sweep_${timestamp}`,
    parentRunId: undefined,
  };

  const expand = (index: number, currentParams: Record<string, unknown>): Record<string, unknown>[] => {
    if (index >= dimensions.length) return [currentParams];
    const dimension = dimensions[index];
    return dimension.values.flatMap((value) =>
      expand(index + 1, {
        ...currentParams,
        [dimension.key]: value,
      }),
    );
  };

  const combinations = expand(0, { ...baseRun.parameters });
  const childRuns = combinations.map((params, idx) => ({
    ...baseRun,
    id: `${parentRun.id}_run_${idx + 1}`,
    parentRunId: parentRun.id,
    sweepKey: dimensions.map((dimension) => `${dimension.key}=${params[dimension.key]}`).join(','),
    parameters: params,
  }));

  return { parentRun, childRuns };
};
