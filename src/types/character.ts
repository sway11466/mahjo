import type { HintScript, ExplainScript } from './hint.ts';
import type { MistakeScript } from './quiz.ts';

/**
 * 顔の全パレット（全キャラ合算。各キャラは持つ分だけ ExpressionAsset を用意する）。
 * 場面→表情の対応はキャラ依存（Character.reactions）。表情そのものは中立な語彙。
 */
export type Expression =
  | 'neutral' // 待機・あいさつ
  | 'thinking' // 考え中・ヒントを出す前
  | 'insight' // ひらめき（気づきを促す瞬間）
  | 'smile' // 笑顔（説明・解説中の穏やかな笑み。正解の喜び happy とは別）
  | 'happy' // 正解の喜び
  | 'troubled' // 困り顔・ミス
  | 'flustered' // 焦り（飾り。難問・心配 等に割当可）
  | 'smug' // 得意げ（飾り）
  | 'mischievous' // いたずら（飾り。小悪魔的キャラ向け）
  | 'grateful' // 謝意（飾り。感謝・お礼。お祝い/アンロック 等に割当可）
  | 'crying'; // 泣き顔（飾り。感極まる・大げさな残念 等）

export interface ExpressionAsset {
  expression: Expression;
  /** 同一フレーミングの差分プール（出番の多い表情だけ複数枚）。先頭が既定 */
  srcs: string[]; // 例 ['characters/mao/portrait_happy_a.webp', '..._b.webp']
}

/**
 * アプリが発火する中立な場面。キャラ非依存。どの表情を見せるかは Character.reactions が決める。
 */
export type ReactionTrigger =
  | 'greeting' // あいさつ（セッション開始の1回）
  | 'dealing' // 出題中（各問・回答前）
  | 'hinting' // ヒント表示中（表情 insight のみ＝ひらめきを促す。専用セリフは持たない）
  | 'explaining' // 説明・解説中（役表示・採点説明）
  | 'correct' // 正解
  | 'wrong' // ミス
  | 'finished'; // 全クイズ終了（結果のお祝い・セッション終わりの1回）

export interface Persona {
  greeting: string[]; // あいさつ（開始）のセリフプール
  dealing: string[]; // 出題（各問）のセリフプール
  correct: string[]; // 正解時のセリフプール
  wrong: string[]; // ミス時のセリフプール
  finished: string[]; // 全クイズ終了（結果）のお祝いプール
}

export interface Character {
  id: string; // 例 'mao'
  displayName: string; // 表示名
  avatar: string; // セレクト用サムネ/アバター
  /** キャラの identity 主色（ui 装飾用）。未指定は既定色へ。詳細は character-guide §2。 */
  themeColor?: string;
  /** 差し色（identity の従色。装飾の星・タイトル等に使う識別色）。採点外。詳細は character-guide §2。 */
  accentColor?: string;
  /**
   * モチーフのキー（identity 表現・採点外。character-guide §2「ビジュアル」）。法具＝皮、装飾＝背景レイヤ。
   * キーは開いた文字列＝各キャラが持ち、ui の resolver が key→SVG を解決する（法具＝selectionMark 等、
   * 装飾＝ui/character/decor）。汎用型 Character に特定キャラのキーを焼き込まないため string。
   * 未指定/未登録キーは適用なし（no-op フォールバック）。themeColor・accentColor は ui が CSS 変数で流す。
   * 状況で変えない（テーマ色と同じ＝プレッシャーをかけない）。例 まお { ritual: 'ofuda', decor: 'moon' }。
   */
  motif?: { ritual?: string; decor?: string };
  expressions: ExpressionAsset[]; // このキャラが持つ表情画像プール（パレットの部分集合）
  /**
   * 場面→表情の割り当て（キャラ依存）。未指定の場面は既定マップへフォールバック：
   * greeting:neutral, dealing:thinking, hinting:insight, explaining:smile, correct:happy, wrong:troubled, finished:happy。
   * 飾り表情を使うキャラはここで割り当てる（例 小悪魔キャラ {correct:'mischievous'}）。
   * 既定の neutral 等を持たないキャラは、その場面を持っている表情に上書きする（例 greeting を smile に）。
   */
  reactions: Partial<Record<ReactionTrigger, Expression>>;
  persona: Persona;
  /**
   * 着目ポイント別ヒント文言（キャラの声）。キー＝HintKey、配列 index＝level（0=ぼんやり→具体）。
   * hint-base.md の全キーを網羅する（突き合わせはテストで担保）。character-<id>-script.md §2 が正。
   */
  script: HintScript;
  /**
   * 成立役の解説文言（キャラの声）。キー＝HintKey（役/ドラ）、1キー＝1文。回答後なので役名OK。
   * 解説シーンでキャラが1つずつ説明する（screens.md §3）。通常役＋ドラを網羅（役満・レアは順次）。
   * character-<id>-script.md §3 が正。
   */
  explain: ExplainScript;
  /**
   * 誤答の諭し文言（キャラの声）。MistakeKind → 1文。誤答時にキャラがそっと諭す（screens.md §3）。
   * 答え（正解値）は言わない。全 MistakeKind を網羅（Record で型が強制）。
   * 中立の基準は hint-base.md「誤答の諭し素」、文言は character-<id>-script.md §4 が正。
   */
  mistakes: MistakeScript;
  unlock?: { kind: 'correctCount'; threshold: number }; // 任意・未対応
}
