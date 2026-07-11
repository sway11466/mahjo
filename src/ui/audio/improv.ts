/**
 * BGM 即興音：小節内の音の配置（8分グリッド）と音階上のランダムウォーク（純ロジック・テスト対象）。
 * 乱数は注入（rng: () => [0,1)）。既定 Math.random は再生側（useBgm）で渡す。engine の決定性原則は
 * 持ち込まない（BGM は ui の演出）が、テストのため rng 注入で決定的にできる。移植元は tools/melody-authoring。
 */
import type { Mode } from '../../types/index.ts';
import { BEATS_PER_BAR, MODES } from './notation.ts';

/** 1小節を分割するスロット数（8分グリッド）。 */
export const SLOTS = 8;

/**
 * 1小節に density 個の音を置くスロット（0〜SLOTS-1）を返す。offset は拍単位のずらし
 * （0=拍ぴったり／0.5=裏拍）。density 0 は空配列。等間隔＋offset で 8分グリッドに整列。
 */
export function improvSlots(density: number, offset: number): number[] {
  const d = Math.max(0, Math.round(density));
  if (d === 0) return [];
  const off = Math.round((offset || 0) * (SLOTS / BEATS_PER_BAR));
  const slots: number[] = [];
  for (let k = 0; k < d; k++) {
    slots.push((((Math.round((k * SLOTS) / d) + off) % SLOTS) + SLOTS) % SLOTS);
  }
  return slots;
}

/**
 * 音階上のランダムウォークで次の音（MIDI）を選ぶ。idx＝現在の音階インデックス（0〜4）、
 * ±1 ゆらして clamp。まれ（15%）に1オクターブ上へ跳ねる。次の idx とともに返す（状態は呼び側で持つ）。
 */
export function nextWalkMidi(
  idx: number,
  tonicMidi: number,
  mode: Mode,
  octave: number,
  rng: () => number,
): { midi: number; idx: number } {
  const scale = MODES[mode];
  let next = idx + (Math.round(rng() * 2) - 1);
  next = Math.max(0, Math.min(scale.length - 1, next));
  let midi = tonicMidi + 12 * octave + (scale[next] ?? 0);
  if (rng() < 0.15) midi += 12;
  return { midi, idx: next };
}
