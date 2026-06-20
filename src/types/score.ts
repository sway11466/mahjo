import type { HighlightTarget } from './highlight.ts';
import type { HintKey } from './hint.ts';

export type ScoreRank =
  | 'normal'
  | 'mangan'
  | 'haneman'
  | 'baiman'
  | 'sanbaiman'
  | 'kazoe-yakuman'
  | 'yakuman';

export interface PaymentBreakdown {
  // ロン: { ron: number }
  // 子ツモ: { fromDealer: number, fromNonDealer: number }
  // 親ツモ: { fromEach: number }  // 子全員から
  ron?: number;
  fromDealer?: number;
  fromNonDealer?: number;
  fromEach?: number;
  total: number; // 合計移動点
}

export type ScoreItemCategory = 'yaku' | 'fu' | 'dora';

export interface ScoreItem {
  id: string; // 一意（クリック対象）
  category: ScoreItemCategory;
  /** 解説・ヒント script を引くキー（hint-base 語彙）。役＝`yaku:<YakuId>` ／ 符＝`fu:<source>` ／
   *  ドラ＝`dora`・`aka-dora`・`ura-dora`。生成側（engine）が確定し、消費側（session/hints）は
   *  これを引くだけ（id 文字列の逆解析をしない）。値の正は [hints/keys.ts](../hints/keys.ts)。 */
  explainKey: HintKey;
  label: string; // 例 "三色同順", "暗刻(中張) 4符", "ドラ2"
  value: number; // 翻数(yaku/dora) または 符数(fu)
  description: string; // 学習用の説明文（キャラ非依存の中立テキスト）
  highlightTargets: HighlightTarget[]; // 光らせる対象（§10）
}

/**
 * 採点エンジンの出力。役モードでは items の category:'yaku' と totalHan を主に使い、
 * 点数モードでは符・点数（fu/score）まで使う（型は最初から完全形）。
 */
export interface ScoreResult {
  totalHan: number;
  totalFu: number; // 符の合計（点数モードで使用。役モードでは表示しない）
  scoreText: string; // 例 "子ロン 5200点" / "親ツモ 2000オール"
  payments: PaymentBreakdown;
  rank: ScoreRank;
  yakuman: boolean; // 役満成立か（複合数は doubleYakuman 設定に従う）
  items: ScoreItem[]; // 加点要素（= 箇条書き1行ずつ）
  /** 役なし（ドラのみ等で和了不可）の場合の判定。生成は常に役ありを満たすが防御的に保持 */
  hasYaku: boolean;
}
