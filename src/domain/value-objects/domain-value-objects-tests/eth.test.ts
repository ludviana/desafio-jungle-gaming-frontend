import { describe, expect, it } from 'vitest';
import { multiplyEth } from '../eth';

describe('multiplyEth', () => {
  it('multiplies decimal values without floating-point drift', () => {
    expect(multiplyEth('0.1', 3)).toBe('0.3');
    expect(multiplyEth('1.19', 3)).toBe('3.57');
  });

  it('supports whole values and zero quantity', () => {
    expect(multiplyEth('2', 4)).toBe('8');
    expect(multiplyEth('2.5', 0)).toBe('0');
  });

  it('keeps six decimal places of precision', () => {
    expect(multiplyEth('0.123456', 3)).toBe('0.370368');
  });
});
