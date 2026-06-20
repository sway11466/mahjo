import type { HighlightTarget } from '../../types/index.ts';

/**
 * 「いま光らせる対象」（HighlightTarget の集合）への問い合わせ（data-model §10）。
 * 中立データ（HighlightTarget）を各盤面コンポーネントが自分の要素と突き合わせるための小道具。
 * 解説シーンの現在ステップ／ヒントのやわらかいハイライトで共通利用する。
 */

/** 特定の牌（Tile.id）が対象か。 */
export function tileLit(highlights: HighlightTarget[], tileId: number): boolean {
  return highlights.some((t) => t.kind === 'tile' && t.tileId === tileId);
}

/** 副露面子（meldIndex）が対象か。 */
export function meldLit(highlights: HighlightTarget[], meldIndex: number): boolean {
  return highlights.some((t) => t.kind === 'meld' && t.meldIndex === meldIndex);
}

/** n 番目のドラ表示牌が対象か。 */
export function doraIndicatorLit(
  highlights: HighlightTarget[],
  index: number,
): boolean {
  return highlights.some(
    (t) => t.kind === 'doraIndicator' && t.index === index,
  );
}

/** n 番目の裏ドラ表示牌が対象か。 */
export function uraDoraIndicatorLit(
  highlights: HighlightTarget[],
  index: number,
): boolean {
  return highlights.some(
    (t) => t.kind === 'uraDoraIndicator' && t.index === index,
  );
}

/** 引数 kind の単発マーカー（winningTile/tsumo/menzenRon/roundWind/seatWind）が対象か。 */
export function kindLit(
  highlights: HighlightTarget[],
  kind: 'winningTile' | 'tsumo' | 'menzenRon' | 'roundWind' | 'seatWind',
): boolean {
  return highlights.some((t) => t.kind === kind);
}
