import './Suzu.css';

/**
 * りんのキャラ固有アイテム＝銀鈴（鈴）。inline SVG（幾何は TSX／色は Suzu.css）。
 * 名前 りん⇄鈴 の法具モチーフ（character-rin.md §3）。中立データには無関係の「皮」。
 * 当面は4択の自分の選択／スタート画面メニューのホバーに乗る（将来ハイライト等にも流用可）。
 * まおの Ofuda と同族（selectionMark が解決）。帯は塗りで円弧を隠す＝鈴の横帯に見せる。
 */
export function Suzu() {
  return (
    <svg className="suzu" viewBox="0 0 100 100" aria-hidden="true">
      {/* 鈴本体（円） */}
      <circle className="suzu__body" cx="50" cy="52" r="32" />
      {/* 横帯（中央のスリット帯。塗りで本体の円弧を隠す） */}
      <rect className="suzu__band" x="9" y="43" width="82" height="15" rx="7.5" />
      {/* 中央の玉（鳴り玉）＋下のスリット */}
      <circle className="suzu__clapper" cx="50" cy="65" r="7.5" />
      <line className="suzu__slit" x1="50" y1="72" x2="50" y2="83" />
    </svg>
  );
}
