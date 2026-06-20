import type { CSSProperties, ReactNode } from 'react';
import type { Character } from '../../../types/index.ts';
import { StarField } from './StarField.tsx';
import { MoonMotif } from './MoonMotif.tsx';
import { ButterflyMotif } from './ButterflyMotif.tsx';
import './CharacterDecor.css';

/**
 * 固有モチーフキー → 固有装飾SVGレイヤの解決（ui の責務・二層分離）。
 * 共通の星・きらめきは StarField（下記 CharacterDecor が全キャラ既定で敷く）なので、ここは
 * キャラ固有の形だけ。未指定／未登録キーは null（星だけ）。新モチーフはここに1行＋SVG1枚を足す。
 * 既知キー：'moon'（まお＝三日月）・'butterfly'（りん＝蝶）。
 */
function motifLayer(motif: string | undefined): ReactNode | null {
  switch (motif) {
    case 'moon':
      return <MoonMotif />;
    case 'butterfly':
      return <ButterflyMotif />;
    default:
      return null;
  }
}

/**
 * 選択中キャラの背景装飾（character-guide §2 装飾モチーフ）。
 * 全キャラ共通の星・きらめき（StarField＝魔女世界の夜空）を既定で敷き、その上に固有モチーフ
 * （`motif.decor` → 月/蝶…）を重ねる。`accentColor` を `--char-accent` で流す（星も固有モチーフも色追従）。
 * `motif.decor: 'none'` のキャラは装飾オフ（星も固有も描かない）。最背面・操作不可。
 * スタート画面で使うが、メイン/サブ画面にも流用できる中立コンポーネント。
 */
export function CharacterDecor({ character }: { character: Character }) {
  const decor = character.motif?.decor;
  if (decor === 'none') return null; // 装飾オフ（星も固有モチーフも出さない）
  const style = character.accentColor
    ? ({ '--char-accent': character.accentColor } as CSSProperties)
    : undefined;
  return (
    <div className="char-decor" style={style} aria-hidden="true">
      <StarField />
      {motifLayer(decor)}
    </div>
  );
}
