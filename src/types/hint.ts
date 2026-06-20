import type { Hand } from './hand.ts';
import type { Table } from './table.ts';
import type { WinContext } from './win-context.ts';
import type { ScoreResult } from './score.ts';

/**
 * 着目ポイント識別子（hint-base / script 共通のキー）。エンジン語彙に対応：
 * 役 = YakuId（'sanshoku-doujun' 等）、符 = 'fu:*'、ドラ = 'dora'、汎用 = 'generic'。
 */
export type HintKey = string;

/**
 * 第1層の出力＝段の骨組み（キャラ非依存・テスト対象）。文言は持たず、
 * 「どの着目ポイントを・どの具体度で」だけを表す（ヒントは牌を指し示さない＝答えを与えない）。
 */
export interface HintStepPlan {
  key: HintKey; // script から文言を引くキー
  level: number; // 具体度（0=ぼんやり … 大きいほど具体）
}

/** 表示用の完成した1段。文言は現在キャラの script 由来（キャラ依存）。 */
export interface HintStep {
  text: string; // キャラ script から引いた手書き文（答え＝役名・確定値は含めない）
  level: number;
}

export type StudyMode = 'yaku' | 'score';

/**
 * キャラ script：着目ポイントキー → 段ごとの文言（配列 index = level）。
 * character-<id>-script.md §2 由来。hint-base の全キーを網羅（突き合わせ＝バリデーション）。
 */
export type HintScript = Record<HintKey, string[]>;

/**
 * 解説 script：着目ポイントキー → 説明文（1キー＝1文。段は持たない）。
 * 回答後の解説シーン（screens.md §3）でキャラが1つずつ説明する文言。回答後なので役名を出してよい。
 * キーは役＝`yaku:<YakuId>` ／ ドラ＝`dora`・`aka-dora`・`ura-dora`（符は点数モード）。
 * character-<id>-script.md §3 由来。網羅は通常役＋ドラ（役満・レアは順次）。未整備キーは描画側でスキップ。
 */
export type ExplainScript = Record<HintKey, string>;

/**
 * 第1層：キャラ非依存・テスト対象。和了（hand＋table＋winContext）＋エンジン結果＋モード
 * → 段の骨組み列（ぼんやり→具体）。文言は載せない（着目ポイントの選択・順序・level・ハイライトのみ）。
 */
export type HintProvider = (
  hand: Hand,
  table: Table,
  winContext: WinContext,
  result: ScoreResult,
  mode: StudyMode,
) => HintStepPlan[];

/** 第2層：骨組み＋現在キャラ script → 表示用の段列（文言を差し込む）。キャラ依存はこの層だけ。 */
export type HintRenderer = (plan: HintStepPlan[], script: HintScript) => HintStep[];
