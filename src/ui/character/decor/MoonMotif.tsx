import './MoonMotif.css';

/**
 * 装飾モチーフ「月」（まお）の固有レイヤ＝三日月だけ。背景に薄く敷くキャラ固有の「皮」（二層分離）。
 * 星・きらめきは全キャラ共通の StarField に分離（CharacterDecor が下に常時敷く）。採点・中立データに
 * は無関係。色はキャラに追従：fill は `--char-accent`（未指定はハイライト金）。濃さは MoonMotif.css。
 */
export function MoonMotif() {
  return (
    <svg
      className="moon-motif"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* 三日月＝大円から少しずらした円をマスクで抜く。slice で上端が切れないよう少し下げ気味に置く */}
        <mask id="moon-motif-crescent">
          <rect width="1200" height="800" fill="black" />
          <circle cx="172" cy="260" r="118" fill="white" />
          <circle cx="220" cy="242" r="118" fill="black" />
        </mask>
      </defs>
      {/* 三日月（左上・大きく淡く） */}
      <rect
        className="moon-motif__moon"
        width="1200"
        height="800"
        fill="var(--char-accent, var(--color-highlight))"
        mask="url(#moon-motif-crescent)"
      />
    </svg>
  );
}
