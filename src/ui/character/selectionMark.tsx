import type { ReactNode } from 'react';
import { Ofuda } from './items/Ofuda.tsx';
import { Suzu } from './items/Suzu.tsx';

/**
 * 「自分が選んだ答え」に重ねるキャラ固有マーク＝法具モチーフ（皮）の解決（ui の責務）。
 * 中立データ（selectedIndex・正誤の ○/✗）には触れず、見た目だけをキャラの `motif.ritual` キーで切り替える
 * （二層分離：data-model §10）。未指定/未登録キーは null（中立の ○/✗ のみ）。
 * 既知キー：'ofuda'（まお）・'suzu'（りん）。法具を持つキャラを足すときはここに1行＋皮SVGを追加。
 */
export function selectionMarkFor(ritual: string | undefined): ReactNode {
  switch (ritual) {
    case 'ofuda':
      return <Ofuda />;
    case 'suzu':
      return <Suzu />;
    default:
      return null;
  }
}
