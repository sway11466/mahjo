import './RiichiStick.css';

/**
 * リーチの千点棒（白地に赤い点1つ）。手牌の前（上側）に横向きで置く（uxui §2）。
 * 牌と同じく SVG で描画。Unicode は使わない。
 */
export function RiichiStick() {
  return (
    <svg
      className="riichi-stick"
      role="img"
      aria-label="リーチ（千点棒）"
      viewBox="0 0 320 16"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>リーチ（千点棒）</title>
      <rect
        className="riichi-stick__body"
        x="1"
        y="1"
        width="318"
        height="14"
        rx="7"
        ry="7"
      />
      <circle className="riichi-stick__dot" cx="160" cy="8" r="3.2" />
    </svg>
  );
}
