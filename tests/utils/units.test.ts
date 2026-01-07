import { describe, expect, it } from 'vitest';
import { convertUnit, isSupportedUnit } from '../../src/utils/units';

describe('units', () => {
  it('converts milliseconds to seconds', () => {
    expect(convertUnit(500, 'ms', 's')).toBeCloseTo(0.5);
  });

  it('converts millivolts to volts', () => {
    expect(convertUnit(30, 'mV', 'V')).toBeCloseTo(0.03);
  });

  it('detects supported units', () => {
    expect(isSupportedUnit('Hz')).toBe(true);
    expect(isSupportedUnit('invalid')).toBe(false);
  });
});
