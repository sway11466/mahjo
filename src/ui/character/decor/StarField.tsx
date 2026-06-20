import './StarField.css';

/**
 * 共通装飾「星・きらめき」。全キャラ共通のベース雰囲気レイヤ（魔女世界の夜空）。
 * 固有モチーフ（月＝まお／蝶＝りん…）の下に常時敷く（CharacterDecor）。
 * 色はキャラに追従：星は `--char-accent`（まお＝金／りん＝銀。未指定はハイライト金）、きらめきは白。
 * 濃さ（opacity）は StarField.css。`motif.decor: 'none'` のキャラだけ CharacterDecor 側で非表示。
 */
export function StarField() {
  return (
    <svg
      className="star-field"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* 星（散らす・小さく淡く） */}
      <g
        className="star-field__stars"
        fill="var(--char-accent, var(--color-highlight))"
      >
        <circle cx="320" cy="90" r="3" />
        <circle cx="540" cy="48" r="2" />
        <circle cx="1010" cy="120" r="3.5" />
        <circle cx="1120" cy="300" r="2.5" />
        <circle cx="660" cy="560" r="3" />
        <circle cx="120" cy="470" r="2.5" />
        <circle cx="250" cy="660" r="3" />
        <circle cx="700" cy="720" r="2.5" />
      </g>
      {/* きらめき（4点星） */}
      <g className="star-field__sparkles" fill="#ffffff">
        <path d="M430 180 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z" />
        <path d="M710 370 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" />
        <path d="M210 195 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" />
      </g>
    </svg>
  );
}
