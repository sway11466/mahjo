import { selectionMarkFor } from './selectionMark.tsx';
import './RitualHoverMark.css';

/**
 * 親ボタンのホバーで法具モチーフ（皮）が左端にぺたりと乗る純装飾マーク（character-guide §2 法具モチーフ）。
 * 親要素に `position: relative; overflow: hidden` を持たせ、その直下に置くこと（出方は CSS の :hover）。
 * 左位置は親が `--ritual-mark-left` で調整可（既定 0.7rem）。
 * ritual 未指定／未登録キーは何も描かない（selectionMarkFor が null）。
 */
export function RitualHoverMark({ ritual }: { ritual: string | undefined }) {
  const mark = selectionMarkFor(ritual);
  if (!mark) return null;
  return (
    <span className="ritual-hover-mark" aria-hidden="true">
      {mark}
    </span>
  );
}
