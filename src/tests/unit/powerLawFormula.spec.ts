import { describe, it, expect } from 'vitest';
import { powerLawFormulaMock } from '../../tests/mocks/powerLawFormulaMock';

describe('PowerLawFormula', () => {
  it('should return power law parameters for valid symbol', () => {
    const params = powerLawFormulaMock.getPowerLawCalParams('SOL');
    expect(params.core).toBeDefined();
    expect(params.lowerBound).toBeDefined();
    expect(params.upperBound).toBeDefined();
  });

  it('should return undefined for invalid symbol', () => {
    const params = powerLawFormulaMock.getPowerLawCalParams('INVALID');
    expect(params.core).toBeUndefined();
    expect(params.lowerBound).toBeUndefined();
    expect(params.upperBound).toBeUndefined();
  });

  it('should return correct SOL parameters from mock', () => {
    const params = powerLawFormulaMock.getPowerLawCalParams('SOL');
    expect(params.core?.coefficient_a).toBeCloseTo(2.0207982973876115e-7);
    expect(params.core?.exponent_b).toBeCloseTo(2.703111530476079);
    expect(params.core?.offset_c).toBeCloseTo(36.97426161118382);
  });
});