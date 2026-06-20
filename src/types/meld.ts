import type { Tile } from './tile.ts';

/** 面子の種類（順子 / 刻子 / 槓子 / 雀頭） */
export type MeldType =
  | 'shuntsu' // 順子（123 等）
  | 'kotsu' // 刻子（111）
  | 'kantsu' // 槓子（1111）
  | 'pair'; // 雀頭（対子）

/**
 * 面子（4面子1雀頭の1単位）。
 * concealed は符計算で暗刻/明刻・暗槓/明槓を厳密に区別するためのフラグ（fu.ts が導出）。
 * ロンで完成した刻子は「明刻扱い」になるため、Meld 生成時に固定せず和了牌・ロン/ツモから決める。
 */
export interface Meld {
  type: MeldType;
  tiles: Tile[]; // 構成牌（shuntsu/kotsu=3, kantsu=4, pair=2）
  open: boolean; // 副露(明)=true / 門前(暗)=false（暗槓は open=false）
  /** 槓のとき：明槓 or 暗槓。刻子の暗/明は open で判別、ただしロン牌で完成した刻子は「明刻扱い」 */
  concealed?: boolean;
}
