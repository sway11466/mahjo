import './Ofuda.css';

/**
 * まおのキャラ固有アイテム＝御札（お札）。inline SVG（幾何は TSX／色は Ofuda.css）。
 * 嘘字対策（character-guide §3）：本物の漢字は描かず、朱の帯・封の丸・抽象的な墨の曲線のみ。
 * 中立データには無関係の「皮」。当面は4択の自分の選択に貼るが、将来は符ハイライト等にも流用可。
 */
export function Ofuda() {
  return (
    <svg className="ofuda" viewBox="0 0 44 100" aria-hidden="true">
      {/* 紙 */}
      <rect className="ofuda__paper" x="7" y="4" width="30" height="92" rx="2.5" />
      {/* 上部の朱の帯 */}
      <rect className="ofuda__band" x="7" y="4" width="30" height="7" rx="2.5" />
      {/* 封の丸（朱の印） */}
      <circle className="ofuda__seal" cx="22" cy="24" r="5" />
      {/* 抽象的な墨の曲線（呪符風・判読不能＝嘘字回避） */}
      <path
        className="ofuda__ink"
        d="M22 36 c 7 6 -7 12 0 18 c 7 6 -7 12 0 18 c 5 5 -3 9 0 12"
      />
      {/* 左右の短い墨のしるし */}
      <path className="ofuda__ink" d="M14 44 h 6 M24 60 h 6 M14 76 h 6" />
    </svg>
  );
}
