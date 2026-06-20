/**
 * 光らせる対象（ハイライト連携）。データは中立（光らせる対象のみ）。
 * UI 側は各描画要素に対応する一意 ID を振り、ScoreItem.highlightTargets /
 * HintStep.highlightTargets から参照する。
 */
export type HighlightTarget =
  | { kind: 'tile'; tileId: number } // 特定の牌（Tile.id）
  | { kind: 'winningTile' } // 上がり牌マーカー
  | { kind: 'doraIndicator'; index: number } // n 番目のドラ表示牌
  | { kind: 'uraDoraIndicator'; index: number }
  | { kind: 'roundWind' } // 場風表示
  | { kind: 'seatWind' } // 自風表示
  | { kind: 'menzenRon' } // 門前ロン表示
  | { kind: 'tsumo' } // ツモ表示
  | { kind: 'meld'; meldIndex: number }; // 副露面子
