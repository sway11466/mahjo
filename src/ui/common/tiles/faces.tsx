import { useId } from 'react';
import type { Tile, Suit } from '../../../types/index.ts';
import { heroTileUrl } from './heroTiles.ts';

/**
 * 牌面の幾何（architecture §5：幾何は TSX、色・フォントは CSS）。
 * 共通の viewBox は TileSvg 側の "0 0 74 100"。牌面はその内側（およそ x:[16,58], y:[16,84]）に描く。
 * 数牌は模様そのものが種別（筒＝丸／索＝竹／萬＝漢数字＋萬）。色は --ink トークンに乗せる
 * （赤ドラは inkClass が --ink を赤に切り替えるため、模様も自動で赤くなる）。
 */

const KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 筒子1–9の丸の点配置（cx=37 中心）と丸半径。index=rank-1。 */
const PIN_LAYOUTS: ReadonlyArray<{ pts: ReadonlyArray<readonly [number, number]>; size: number }> = [
  { pts: [[37, 50]], size: 13 }, // 1
  { pts: [[37, 29], [37, 71]], size: 11 }, // 2
  { pts: [[52, 28], [37, 50], [22, 72]], size: 11 }, // 3（斜め）
  { pts: [[25, 30], [49, 30], [25, 70], [49, 70]], size: 10 }, // 4
  { pts: [[25, 29], [49, 29], [37, 50], [25, 71], [49, 71]], size: 9.5 }, // 5
  // 6：上2つ（離す）＋下は7筒と同じ2×2
  { pts: [[25, 26], [49, 26], [25, 62], [49, 62], [25, 82], [49, 82]], size: 8.5 }, // 6
  // 7：上に斜め3つ＋下に2×2
  { pts: [[22, 22], [37, 29], [52, 36], [25, 62], [49, 62], [25, 82], [49, 82]], size: 8.5 }, // 7
  { pts: [[25, 20], [49, 20], [25, 42], [49, 42], [25, 63], [49, 63], [25, 85], [49, 85]], size: 8 }, // 8
  { pts: [[21, 25], [37, 25], [53, 25], [21, 50], [37, 50], [53, 50], [21, 75], [37, 75], [53, 75]], size: 8 }, // 9
];

/** 索子1–9の竹の点配置と竹の基準サイズ。筒子とは並びが違う（列ベース）。index=rank-1。 */
const SOU_LAYOUTS: ReadonlyArray<{ pts: ReadonlyArray<readonly [number, number]>; size: number }> = [
  { pts: [[37, 50]], size: 13 }, // 1（特別描画：SouOne）
  { pts: [[37, 30], [37, 70]], size: 10 }, // 2：縦1列×2
  { pts: [[37, 28], [25, 72], [49, 72]], size: 9.5 }, // 3：三角形（上1本＋下2本）
  { pts: [[25, 30], [49, 30], [25, 70], [49, 70]], size: 10 }, // 4：2×2
  { pts: [[22, 27], [52, 27], [37, 50], [22, 73], [52, 73]], size: 9.5 }, // 5：四隅＋中央（隅を広げる）
  { pts: [[25, 26], [49, 26], [25, 50], [49, 50], [25, 74], [49, 74]], size: 9 }, // 6：2列×3段（均等）
  // 7：上に1本＋下に3列×2段
  { pts: [[37, 24], [21, 52], [37, 52], [53, 52], [21, 78], [37, 78], [53, 78]], size: 7.7 }, // 7
  { pts: [[25, 20], [49, 20], [25, 42], [49, 42], [25, 63], [49, 63], [25, 85], [49, 85]], size: 7.7 }, // 8：2列×4段
  { pts: [[21, 25], [37, 25], [53, 25], [21, 50], [37, 50], [53, 50], [21, 75], [37, 75], [53, 75]], size: 7.7 }, // 9：3×3
];

/** 索子で赤くする竹の index（SOU_LAYOUTS の pts と同順）。緑地に赤が混じる本物に倣う：
 *  5索＝中央、7索＝頭、9索＝中列（縦3本）。8索は Sou8 で別描画（全緑）。 */
const SOU_RED: ReadonlyArray<ReadonlyArray<number>> = [
  [], // 1（鳥・特別描画）
  [], // 2
  [], // 3
  [], // 4
  [2], // 5：中央
  [], // 6
  [0], // 7：頭
  [], // 8（Sou8）
  [1, 4, 7], // 9：中列（縦3本）
];

/** 筒子の丸の色（b＝青 / r＝赤）。PIN_LAYOUTS の pts と同順。本物の配色に倣う（青地に赤が混じる）。 */
type PipColor = 'b' | 'r';
const PIN_COLORS: ReadonlyArray<ReadonlyArray<PipColor>> = [
  [], // 1（特別描画）
  ['b', 'b'], // 2
  ['b', 'r', 'b'], // 3（中央が赤）
  ['b', 'b', 'b', 'b'], // 4
  ['b', 'b', 'r', 'b', 'b'], // 5（中央が赤）
  ['b', 'b', 'r', 'r', 'r', 'r'], // 6（上2青・下4赤）
  ['b', 'b', 'b', 'r', 'r', 'r', 'r'], // 7（斜め3青・下2×2赤）
  ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'], // 8（全青）
  ['b', 'b', 'b', 'r', 'r', 'r', 'b', 'b', 'b'], // 9（青/赤/青の三段）
];

const PIP_CLASS: Record<PipColor, string> = { b: 'pip--blue', r: 'pip--red' };

/** 筒子の単位：ドーナツ（外円＋白抜き＋芯）。 */
function Donut({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: PipColor }) {
  return (
    <g className={`pip ${PIP_CLASS[color]}`}>
      <circle className="pip__outer" cx={cx} cy={cy} r={r} />
      <circle className="pip__inner" cx={cx} cy={cy} r={r * 0.5} />
      <circle className="pip__core" cx={cx} cy={cy} r={r * 0.2} />
    </g>
  );
}

/** 筒子の1筒：大きな同心円（青の外輪・赤・青の芯）。本物のあしらいに寄せる。 */
function PinOne() {
  return (
    <g className="pip">
      <circle className="pip--blue pip__outer" cx={37} cy={50} r={15} />
      <circle className="pip__inner" cx={37} cy={50} r={11.5} />
      <circle className="pip--red pip__outer" cx={37} cy={50} r={8} />
      <circle className="pip__inner" cx={37} cy={50} r={4.5} />
      <circle className="pip--blue pip__core" cx={37} cy={50} r={2.5} />
    </g>
  );
}

/** 索子の単位：竹。縦棒2本＋横棒3本（上・中・下）の「日」字ラダー（I を2つ並べた形）。
 *  h＝高さ。w＝幅（既定 h*0.42。高さと太さを切り離したいとき指定）。rot＝中心まわりの傾き（度）。
 *  red＝赤竹（5索の中央・7索の頭・9索の中列など）。既定は緑（--ink）。 */
function Bamboo({ cx, cy, h, w = h * 0.42, rot = 0, red = false }: { cx: number; cy: number; h: number; w?: number; rot?: number; red?: boolean }) {
  const bar = w * 0.31; // 棒の太さ（縦・横共通。幅に比例）
  const left = cx - w / 2;
  const top = cy - h / 2;
  const r = bar / 2;
  return (
    <g className={red ? 'pip bamboo--red' : 'pip'} transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}>
      {/* 縦棒2本（左右） */}
      <rect className="bamboo__bar" x={left} y={top} width={bar} height={h} rx={r} ry={r} />
      <rect className="bamboo__bar" x={left + w - bar} y={top} width={bar} height={h} rx={r} ry={r} />
      {/* 横棒3本（上・中・下） */}
      <rect className="bamboo__bar" x={left} y={top} width={w} height={bar} rx={r} ry={r} />
      <rect className="bamboo__bar" x={left} y={cy - bar / 2} width={w} height={bar} rx={r} ry={r} />
      <rect className="bamboo__bar" x={left} y={cy + h / 2 - bar} width={w} height={bar} rx={r} ry={r} />
    </g>
  );
}

/** 索子の8索：外側2本は縦で上下端いっぱいまで長く、内側2本は傾けて短め（上下端に届かない）。
 *  上段「|/\\|」・下段「|\\/|」（上段内側＝山 /\、下段内側＝谷 \/）。rot は時計回りが正＝"/"。 */
function Sou8() {
  // [cx, cy, rot, h]。両端は縦で固定（x=15/59, h=32, 上端y=12・下端y=88）。
  // 内側の斜め（角度±38°・h=36）は、その先端が両端の竹の先端と中央で合うよう配置：
  // 上段＝両端の上端(15,12)/(59,12)から中央(37,40)へ＝谷、下段＝両端の下端から中央(37,60)へ＝山。
  const sticks: ReadonlyArray<readonly [number, number, number, number]> = [
    [15, 28, 0, 32], [26, 26, -38, 36], [48, 26, 38, 36], [59, 28, 0, 32], // 上段
    [15, 72, 0, 32], [26, 74, 38, 36], [48, 74, -38, 36], [59, 72, 0, 32], // 下段
  ];
  return (
    <g>
      {sticks.map(([cx, cy, rot, h], i) => (
        <Bamboo key={i} cx={cx} cy={cy} h={h} w={7.5} rot={rot} />
      ))}
    </g>
  );
}

/** 索子の1索：鳥（緑の胴・頭＋赤のくちばし・翼・尾・冠羽）。止まり木に乗った横向き。 */
function SouOne() {
  return (
    <g className="bird">
      {/* 止まり木 */}
      <rect className="bird__perch" x="19" y="82" width="36" height="4" rx="2" />
      {/* 脚 */}
      <line className="bird__leg" x1="33" y1="82" x2="33" y2="62" />
      <line className="bird__leg" x1="40" y1="82" x2="40" y2="62" />
      {/* 尾羽（赤） */}
      <path className="bird__accent" d="M41 56 L60 82 L49 80 Z" />
      {/* 胴 */}
      <ellipse className="bird__body" cx="36" cy="50" rx="12" ry="16" />
      {/* 翼（赤） */}
      <path className="bird__accent" d="M36 40 Q49 47 45 64 Q33 57 36 40 Z" />
      {/* 頭 */}
      <circle className="bird__body" cx="32" cy="30" r="9" />
      {/* くちばし（赤） */}
      <path className="bird__accent" d="M24 27 L12 25 L24 33 Z" />
      {/* 冠羽（赤） */}
      <path className="bird__accent" d="M32 21 L29 11 L34 14 L34 21 Z" />
      {/* 目 */}
      <circle className="bird__eye" cx="30" cy="28" r="2.4" />
    </g>
  );
}

/** 看板牌（1筒/1索）のデフォルト画像を、面の角丸でクリップして描く。 */
function TileImage({ href }: { href: string }) {
  const clip = `tileclip-${useId().replace(/:/g, '')}`;
  return (
    <>
      <clipPath id={clip}>
        <rect x="1.5" y="1.5" width="71" height="97" rx="10" ry="10" />
      </clipPath>
      <image
        href={href}
        x="1.5"
        y="1.5"
        width="71"
        height="97"
        clipPath={`url(#${clip})`}
        preserveAspectRatio="xMidYMid meet"
      />
    </>
  );
}

/** 数牌の牌面。 */
export function SuitedFace({ suit, rank }: { suit: Suit; rank: number }) {
  if (suit === 'man') {
    return (
      <g className="man-face" textAnchor="middle">
        <text className="man-face__num" x="37" y="47">
          {KANJI_NUM[rank - 1]}
        </text>
        <text className="man-face__suit" x="37" y="84">
          萬
        </text>
      </g>
    );
  }

  if (suit === 'sou') {
    if (rank === 1) {
      const url = heroTileUrl('sou1');
      return url ? <TileImage href={url} /> : <SouOne />;
    }
    if (rank === 8) return <Sou8 />;
    const { pts, size } = SOU_LAYOUTS[rank - 1]!;
    const red = SOU_RED[rank - 1]!;
    return (
      <g>
        {pts.map(([cx, cy], i) => (
          <Bamboo key={i} cx={cx} cy={cy} h={size * 2.4} red={red.includes(i)} />
        ))}
      </g>
    );
  }

  // pin（筒子）
  if (rank === 1) {
    const url = heroTileUrl('pin1');
    return url ? <TileImage href={url} /> : <PinOne />;
  }
  const { pts, size } = PIN_LAYOUTS[rank - 1]!;
  const colors = PIN_COLORS[rank - 1]!;
  return (
    <g>
      {pts.map(([cx, cy], i) => (
        <Donut key={i} cx={cx} cy={cy} r={size} color={colors[i]!} />
      ))}
    </g>
  );
}

/** 字牌の牌面。白は無地（真っ白）、發＝緑・中＝赤・風牌＝濃紺は inkClass が決める。 */
export function HonorFace({ tile }: { tile: Extract<Tile, { kind: 'honor' }> }) {
  if (tile.honor === 'haku') return null; // 白は無地（牌面そのまま）
  const label =
    tile.honor === 'hatsu'
      ? '發'
      : tile.honor === 'chun'
        ? '中'
        : { east: '東', south: '南', west: '西', north: '北' }[tile.honor];
  return (
    <text className="honor-face" x="37" y="50" textAnchor="middle" dominantBaseline="central">
      {label}
    </text>
  );
}
