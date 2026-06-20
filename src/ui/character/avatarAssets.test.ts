import { describe, it, expect } from 'vitest';
import { variantIndex } from './avatarAssets.ts';

describe('variantIndex', () => {
  it('maps a [0,1) seed evenly across the pool length', () => {
    expect(variantIndex(2, 0)).toBe(0);
    expect(variantIndex(2, 0.49)).toBe(0);
    expect(variantIndex(2, 0.5)).toBe(1);
    expect(variantIndex(2, 0.99)).toBe(1);
    expect(variantIndex(3, 0)).toBe(0);
    expect(variantIndex(3, 0.34)).toBe(1);
    expect(variantIndex(3, 0.67)).toBe(2);
  });

  it('always picks index 0 for a single-element pool (no behaviour change)', () => {
    expect(variantIndex(1, 0)).toBe(0);
    expect(variantIndex(1, 0.5)).toBe(0);
    expect(variantIndex(1, 0.999)).toBe(0);
  });

  it('stays in range at the seed boundary (1.0 should not overflow)', () => {
    // Rng は [0,1) を返す契約だが、防御的に 1.0 でも範囲内に収める。
    expect(variantIndex(3, 1)).toBe(2);
    expect(variantIndex(0, 0.5)).toBe(0);
  });
});
