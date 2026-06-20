import type { Wind } from './wind.ts';

/**
 * 和了状況（点数計算）。手牌・場だけでは足りない、採点に要る要素
 * （自分の席・この和了の事情）。観測できる盤面ではないので点数計算側に置く。
 *
 * フラグは必須 boolean（既定 false）。`?` で undefined を許すと false と二重表現になり、
 * 正確性最優先のエンジンが毎回畳む必要が出るため。生成・テストはデフォルト補完ファクトリで賄う。
 */
export interface WinContext {
  seatWind: Wind; // 自風（親/子は seatWind==='east' で導出）
  win: 'tsumo' | 'ron'; // ツモ / ロン
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  haitei: boolean; // 海底摸月
  houtei: boolean; // 河底撈魚
  rinshan: boolean; // 嶺上開花
  chankan: boolean; // 槍槓
  tenho: boolean; // 天和（親）
  chiho: boolean; // 地和（子）
}
