import type { Tile } from './tile.ts';
import type { Meld } from './meld.ts';

/**
 * 手牌（場）。盤面に見える自分の手そのもの。観測できる事実だけを持つ
 * （点数計算の解釈は Decomposition）。
 */
export interface Hand {
  concealed: Tile[]; // 門前の手持ち牌（まだ面子に分解していない素の牌）
  calledMelds: Meld[]; // 副露（チー/ポン/明槓）＋暗槓。明/暗は Meld.open で区別
  winningTile: Tile; // あがり牌（ツモ/ロンの別は WinContext.win）
}
