import { scorePoints } from '../../../engine/score.ts';
import type { PaymentBreakdown, RuleSettings } from '../../../types/index.ts';

/**
 * 点数早見表（feature-4）の算出。値は engine の `scorePoints`（採点と同じ関数）から動的に出すので、
 * 表と採点が絶対にズレない。計算規則の正は [scoring-rules.md](../../../../docs/spec/scoring-rules.md) §3。
 *
 * 標準ルールで算出する（早見表の基準）。切り上げ満貫など設定差分は当面反映しない（注記）。
 */

/** 行＝符（20・25 は特殊／30〜110 は本則）。 */
export const TABLE_FU = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;
/** 列＝翻（符に依る 1〜4。5翻以上は符に依らないので別表）。 */
export const TABLE_HAN = [1, 2, 3, 4] as const;

const STANDARD: RuleSettings = {
  kuitan: true,
  atozuke: true,
  akaDoraCount: 0,
  kiriageMangan: false,
  kazoeYakuman: false,
  doubleYakuman: false,
  rareYaku: false,
  round: 'random',
  enabledYaku: {},
};
// 満貫以上の別表で「役満（数え役満）」の値を出すため kazoeYakuman を有効化したルール。
const STANDARD_KAZOE: RuleSettings = { ...STANDARD, kazoeYakuman: true };

/** ツモの支払い。子＝子1人ぶん（fromKo）＋親ぶん（fromOya）、親＝全員同額（each＝オール）。 */
export type CellTsumo =
  | { kind: 'ko'; fromKo: number; fromOya: number }
  | { kind: 'oya'; each: number };

function tsumoOf(p: PaymentBreakdown, isDealer: boolean): CellTsumo {
  return isDealer
    ? { kind: 'oya', each: p.fromEach! }
    : { kind: 'ko', fromKo: p.fromNonDealer!, fromOya: p.fromDealer! };
}

export interface ScoreCell {
  ron: number | null; // ロン点（成立しない欄は null）
  tsumo: CellTsumo | null; // ツモの支払い（成立しない欄は null）
}

/**
 * (符, 翻, 親か) の1セル。成立しない組み合わせは null（表では「—」）：
 *  - 20符はロンが無い（平和ロンは30符）。ツモも平和ツモ＝2翻以上のみ。
 *  - 25符（七対子）は2翻以上のみ（七対子は2翻）。
 */
export function cellFor(fu: number, han: number, isDealer: boolean): ScoreCell {
  const ronAvail = fu !== 20 && !(fu === 25 && han < 2);
  const tsumoAvail = !((fu === 20 || fu === 25) && han < 2);
  return {
    ron: ronAvail ? (scorePoints(han, fu, isDealer, 'ron', STANDARD).payments.ron ?? null) : null,
    tsumo: tsumoAvail
      ? tsumoOf(scorePoints(han, fu, isDealer, 'tsumo', STANDARD).payments, isDealer)
      : null,
  };
}

// 5翻以上は符に依らない固定値（§3.1）。代表の翻で区分を出す。
export const MANGAN_RANKS: { label: string; han: number }[] = [
  { label: '満貫', han: 5 },
  { label: '跳満', han: 6 },
  { label: '倍満', han: 8 },
  { label: '三倍満', han: 11 },
  { label: '役満', han: 13 },
];

/** 5翻以上の1区分を子／親いずれかのセルとして返す（符は固定値に無関係なので 30 を渡す）。 */
export function manganCell(han: number, isDealer: boolean): ScoreCell {
  return {
    ron: scorePoints(han, 30, isDealer, 'ron', STANDARD_KAZOE).payments.ron ?? null,
    tsumo: tsumoOf(scorePoints(han, 30, isDealer, 'tsumo', STANDARD_KAZOE).payments, isDealer),
  };
}
