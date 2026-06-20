import type { Tile } from '../../../types/index.ts';
import { tileName } from '../../../engine/tiles.ts';
import { SuitedFace, HonorFace } from './faces.tsx';
import './TileSvg.css';

/** 文字色を選ぶ修飾クラス。色そのものは CSS のトークン側（architecture.md §5）。 */
function inkClass(tile: Tile): string {
  if (tile.kind === 'suited') return tile.red ? 'tile--red' : `tile--${tile.suit}`;
  switch (tile.honor) {
    case 'haku':
      return 'tile--haku';
    case 'hatsu':
      return 'tile--hatsu';
    case 'chun':
      return 'tile--chun';
    default:
      return 'tile--wind'; // 東 南 西 北
  }
}

/**
 * 牌1枚の SVG。手牌・副露・上がり牌・ドラ表示で再利用する（uxui §1）。
 * サイズは持たず、置かれたコンテナの幅にフィットしてスケールする（高さは viewBox の比で決まる）。
 * 幾何（viewBox・座標・要素構成）は TSX、色・フォントは CSS（TileSvg.css）。
 */
export function TileSvg({
  tile,
  highlighted,
}: {
  tile: Tile;
  highlighted?: boolean;
}) {
  const label = tileName(tile);

  return (
    <svg
      className={`tile ${inkClass(tile)}${highlighted ? ' tile--lit' : ''}`}
      role="img"
      aria-label={label}
      viewBox="0 0 74 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{label}</title>
      <rect
        className="tile__face"
        x="1.5"
        y="1.5"
        width="71"
        height="97"
        rx="10"
        ry="10"
      />
      <g className="tile__ink">
        {tile.kind === 'suited' ? (
          <SuitedFace suit={tile.suit} rank={tile.rank} />
        ) : (
          <HonorFace tile={tile} />
        )}
      </g>
    </svg>
  );
}
