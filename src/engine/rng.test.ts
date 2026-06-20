import { mulberry32, randInt, pick, shuffle } from './rng.ts';

describe('rng — 決定性', () => {
  it('同じ seed は同じ系列を返す', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('異なる seed は異なる系列になる', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it('[0,1) の範囲に収まる', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('rng — ヘルパ', () => {
  it('randInt は 0..n-1 を返す', () => {
    const r = mulberry32(3);
    for (let i = 0; i < 100; i++) {
      const x = randInt(r, 6);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(6);
      expect(Number.isInteger(x)).toBe(true);
    }
  });

  it('pick は配列の要素を返す', () => {
    const r = mulberry32(9);
    const arr = ['a', 'b', 'c'] as const;
    expect(arr).toContain(pick(r, arr));
  });

  it('shuffle は要素を保ち元配列を壊さない', () => {
    const r = mulberry32(11);
    const orig = [1, 2, 3, 4, 5];
    const out = shuffle(r, orig);
    expect(out).toHaveLength(5);
    expect([...out].sort((a, b) => a - b)).toEqual(orig);
    expect(orig).toEqual([1, 2, 3, 4, 5]); // 非破壊
  });
});
