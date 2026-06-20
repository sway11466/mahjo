import './ButterflyMotif.css';

/**
 * 装飾モチーフ「蝶」（りん）。背景に薄く敷く雰囲気レイヤ＝キャラ固有の「皮」（二層分離）。
 * まおの月（天）に対する対照＝蝶（妖・自然。character-rin.md §3）。採点・中立データには無関係。
 * 星・きらめきは全キャラ共通の StarField に分離（CharacterDecor が下に常時敷く）ので、ここは蝶だけ。
 * 色はキャラに追従：fill は `--char-accent`（りん＝銀。未指定はハイライト金）。幾何は TSX、濃さ（opacity）は
 * ButterflyMotif.css。全面に slice で敷く（背景レイヤ）。MoonMotif と同族（CharacterDecor が解決）。
 */
export function ButterflyMotif() {
  return (
    <svg
      className="butterfly-motif"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* 1匹の蝶（中心 0,0・幅~70）。胴・触角なしの簡易シルエット＝左右の翅対（上翅＋下翅を
            外側の軽いくびれでつないだ連続パス）。fill は use 側（wings）から継承。 */}
        <g id="butterfly-motif__bf">
          <path d="M0 -2 C 6 -28 33 -31 35 -12 C 36 -6 30 -4 24 -3 C 31 -1 33 9 28 19 C 25 28 14 30 9 22 C 5 15 2 7 0 2 Z" />
          <path d="M0 -2 C -6 -28 -33 -31 -35 -12 C -36 -6 -30 -4 -24 -3 C -31 -1 -33 9 -28 19 C -25 28 -14 30 -9 22 C -5 15 -2 7 0 2 Z" />
        </g>
      </defs>
      {/* 蝶（散らす・大小・淡く） */}
      <g
        className="butterfly-motif__wings"
        fill="var(--char-accent, var(--color-highlight))"
      >
        <use href="#butterfly-motif__bf" transform="translate(185 215) scale(1.7) rotate(-12)" />
        <use href="#butterfly-motif__bf" transform="translate(1010 175) scale(1.15) rotate(16)" />
        <use href="#butterfly-motif__bf" transform="translate(650 530) scale(2) rotate(-6)" />
        <use href="#butterfly-motif__bf" transform="translate(305 655) scale(0.9) rotate(22)" />
        <use href="#butterfly-motif__bf" transform="translate(1090 605) scale(1.35) rotate(-18)" />
        <use href="#butterfly-motif__bf" transform="translate(845 320) scale(0.75) rotate(10)" />
      </g>
    </svg>
  );
}
