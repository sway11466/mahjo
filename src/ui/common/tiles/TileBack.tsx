import './TileSvg.css';

/**
 * 裏向きの牌（裏ドラ未公開＝リーチでないとき等）。面は見せず裏一色で描く。
 * サイズは TileSvg と同じく置かれたコンテナ幅にフィットする。
 */
export function TileBack() {
  return (
    <svg
      className="tile tile--back"
      role="img"
      aria-label="裏向きの牌"
      viewBox="0 0 74 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>裏向きの牌</title>
      <rect
        className="tile__back"
        x="1.5"
        y="1.5"
        width="71"
        height="97"
        rx="10"
        ry="10"
      />
    </svg>
  );
}
