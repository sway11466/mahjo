import type { Tile } from './tile.ts';
import type { Meld } from './meld.ts';

/** 待ちの形（符・説明用） */
export type WaitType =
  | 'tanki' // 単騎（雀頭待ち）
  | 'kanchan' // 嵌張（両端を持ち真ん中待ち 1_3）
  | 'penchan' // 辺張（12 で3待ち / 89 で7待ち）
  | 'ryanmen' // 両面
  | 'shanpon'; // 双碰（シャンポン）

/**
 * 点数計算の解釈。Hand を面子に分解した1つの形。1つの和了牌に対し複数の分解が
 * 成立しうる（高点法）ので、parse/ が全分解を列挙し、score() が最高点になる解釈を採用する。
 */
export interface Decomposition {
  melds: Meld[]; // 4面子1雀頭（順子/刻子/槓子 ×4 ＋ pair）。副露分は Hand.calledMelds と一致
  wait: WaitType; // 待ちの形（符・説明用）
  specialForm?: 'chiitoitsu' | 'kokushi'; // 七対子 / 国士無双（melds を使わない特殊形）
  specialTiles?: Tile[]; // 特殊形のときの牌一覧
}
