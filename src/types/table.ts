import type { Tile } from './tile.ts';
import type { Wind } from './wind.ts';

/**
 * 盤面（場）。卓の状態。全員で共有する観測要素だけを持つ。
 * ドラの枚数換算は点数計算側の仕事（Table は表示牌だけを持つ）。
 * 本場・供託は採点スコープ外のため持たない。
 */
export interface Table {
  roundWind: Wind; // 場風（通常 east/south）
  doraIndicators: Tile[]; // ドラ表示牌（表向き。複数可）
  uraDoraIndicators?: Tile[]; // 裏ドラ表示牌（リーチ和了時のみ）
}
