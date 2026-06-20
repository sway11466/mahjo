/**
 * 「符の数え方」一覧（feature A）の表示用データ。符の発生源・面子の符・特例を列挙する。
 * 値・適用条件の正は [scoring-rules.md](../../../../docs/spec/scoring-rules.md) §2 符計算。
 * 値を直すときはまず scoring-rules を更新してからここを合わせる（engine `fu.ts` も同じ §2 が正）。
 *
 * ふりがなは character-guide §セリフの規則に従い、この画面（オーバーレイ）での初出に付ける
 * （1画面の静的テキスト＝その画面で初出1回）。読みは同 §「麻雀用語の読み」に統一。
 */

/** 符の発生源（基本符・加符）。fu は表示文字列（"20符"＝基本、"+10符"＝加算 を区別）。 */
export interface FuSource {
  source: string;
  fu: string;
  condition: string;
}

export const FU_SOURCES: FuSource[] = [
  { source: '副底（フーテイ）', fu: '20符', condition: 'すべての和了の基本（常に加算）。' },
  { source: '門前（メンゼン）ロン', fu: '+10符', condition: '門前でロン和了したとき。' },
  { source: 'ツモ', fu: '+2符', condition: 'ツモ和了（平和（ピンフ）ツモは付けない）。' },
  {
    source: '待ち',
    fu: '+2符',
    condition:
      '単騎（タンキ）・嵌張（カンチャン）・辺張（ペンチャン）待ち。両面（リャンメン）・双碰（シャンポン）は0符。',
  },
  {
    source: '雀頭（ジャントウ）',
    fu: '+2符',
    condition: '役牌（三元牌・場風・自風）の雀頭。連風牌は+4符。',
  },
];

/** 面子の符（中張2-8／么九1・9・字 × 明／暗）。順子は0符。 */
export interface MeldFuRow {
  meld: string;
  /** [中張 明, 中張 暗, 么九 明, 么九 暗] */
  values: [number, number, number, number];
}

export const MELD_FU: MeldFuRow[] = [
  { meld: '刻子（コーツ）', values: [2, 4, 4, 8] },
  { meld: '槓子（カンツ）', values: [8, 16, 16, 32] },
];

/** 順子は牌種（中張/么九）・明暗を問わず常に0符。4列ヘッダーに当てはまらないので、
 *  面子符表に全列をまたぐ1行として添える。 */
export const SHUNTSU_FU = {
  meld: '順子（ジュンツ）',
  label: '0符（牌種・明暗を問わず）',
} as const;

/** 面子の符に添える注記（暗刻/明刻の判定。表の直下に箇条書きで置く）。 */
export const MELD_FU_NOTES: string[] = [
  'ロンで完成した刻子は明刻（ミンコ）として数える（他家から出たため）。',
];

/** 面子符の列見出し（中張＝2-8／么九＝1・9・字）。 */
export const MELD_FU_COLUMNS = ['中張（チュンチャン） 明', '中張 暗', '么九（ヤオチュー） 明', '么九 暗'] as const;

/** 符の特例（平和・七対子などの特別な符と、端数の切り上げ）。 */
export interface FuSpecial {
  case: string;
  fu: string;
  note: string;
}

export const FU_SPECIALS: FuSpecial[] = [
  {
    case: '平和（ピンフ）ツモ',
    fu: '20符',
    note: '積み上げではツモ符（+2）が付くが、20符として計算する。',
  },
  { case: '平和ロン', fu: '30符', note: '副底20＋門前ロン10で、結果として30符になる。' },
  {
    case: '喰いピンフ形',
    fu: '30符',
    note: '鳴いた平和形のロン。副底以外の符が付かず20符どまりになるため、特別に30符と規定する。',
  },
  { case: '七対子（チートイツ）', fu: '25符', note: '符計算しない（切り上げもしない）。' },
  {
    case: '端数の切り上げ',
    fu: '10符単位',
    note: '符の合計に端数が出たら10符単位に切り上げる（例 32符→40符）。七対子の25符は切り上げない。',
  },
];
