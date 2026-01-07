type UnitDefinition = {
  base: string;
  factor: number;
};

const UNIT_MAP: Record<string, UnitDefinition> = {
  V: { base: 'V', factor: 1 },
  mV: { base: 'V', factor: 1e-3 },
  s: { base: 's', factor: 1 },
  ms: { base: 's', factor: 1e-3 },
  Hz: { base: 'Hz', factor: 1 },
  kHz: { base: 'Hz', factor: 1e3 },
  pA: { base: 'A', factor: 1e-12 },
  nA: { base: 'A', factor: 1e-9 },
  nS: { base: 'S', factor: 1e-9 },
  uS: { base: 'S', factor: 1e-6 },
  mM: { base: 'M', factor: 1e-3 },
  uM: { base: 'M', factor: 1e-6 },
  '°C': { base: 'C', factor: 1 },
};

export const isSupportedUnit = (unit: string) => Boolean(UNIT_MAP[unit]);

export const convertUnit = (value: number, fromUnit: string, toUnit: string) => {
  const from = UNIT_MAP[fromUnit];
  const to = UNIT_MAP[toUnit];
  if (!from || !to) {
    throw new Error(`Unsupported unit conversion: ${fromUnit} -> ${toUnit}`);
  }
  if (from.base !== to.base) {
    throw new Error(`Incompatible unit conversion: ${fromUnit} -> ${toUnit}`);
  }
  return (value * from.factor) / to.factor;
};

export const unitOptions = Object.keys(UNIT_MAP);
