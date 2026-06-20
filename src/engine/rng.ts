/**
 * 乱数（rng）。生成器を決定的にテストするため、シード注入できる純粋な PRNG を提供する
 * （testing.md §7）。`Rng` は [0,1) を返す関数。エンジン内の乱数はこのモジュールに隔離する。
 */
export type Rng = () => number;

/** mulberry32：軽量・決定的な seeded PRNG。同じ seed は同じ系列を返す。 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0..maxExclusive-1 の整数 */
export function randInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

/** 配列から1要素を等確率で選ぶ */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[randInt(rng, arr.length)]!;
}

/** Fisher–Yates シャッフル（非破壊。新しい配列を返す） */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
