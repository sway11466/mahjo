import type {
  StudyMode,
  Hand,
  Table,
  WinContext,
  QuizQuestion,
  QuizChoice,
  HighlightTarget,
  Expression,
  HintStep,
  ScoreResult,
} from '../types/index.ts';

// セッション提示層の型（[data-model.md] §17 / [session.md]）。
// 当面はクイズ session。状態の保持・永続化は ui、遷移は session の純関数。
// 物理的にはこの層に置く（共有の view-state は ui が session から import）。

// greeting＝開始のあいさつ（盤面を出さず「はじめる」待ち）。playing＝出題中。finished＝終了。
export type SessionStatus = 'greeting' | 'playing' | 'finished';

/** 1問の結果 */
export interface SessionAnswer {
  selectedIndex: number; // 選んだ選択肢（QuizQuestion.choices の index）
  correct: boolean;
}

/** 1局分の出題素材（生成＋採点＋4択を束ねたもの）。生成は engine（generate＋scorer＋buildQuiz）。 */
export interface SessionProblem {
  hand: Hand;
  table: Table;
  winContext: WinContext;
  question: QuizQuestion;
  result: ScoreResult; // 完全な採点結果（items 付き）。ヒント・解説シーンで使う
}

/** クイズ session の進行状態（8問＝東南戦：東1局〜南4局）。 */
export interface QuizSession {
  mode: StudyMode; // 役 / 点数
  index: number; // 現在の局 0–7
  hand: Hand; // 現在の出題
  table: Table;
  winContext: WinContext;
  question: QuizQuestion; // 現在の4択
  result: ScoreResult; // 現在の局の採点結果（ヒント・解説の素）
  answers: SessionAnswer[]; // これまでの各問の結果（index と対応）
  correctCount: number;
  status: SessionStatus;
}

/** ui が描く提示モデル（1ターン分）。session が組み立て、ui は描画のみ（session.md §4）。 */
export interface SessionViewState {
  // 盤面
  hand: Hand;
  table: Table;
  winContext: WinContext;
  highlights: HighlightTarget[];
  // 4択
  choices: QuizChoice[];
  selectedIndex: number | null; // 未回答=null
  revealed: boolean; // 回答後（正誤・解説を開示）
  // キャラ（抽象。表情→画像の解決は ui。variantSeed＝差分プールから1枚選ぶ種＝[0,1)）
  character: { id: string; expression: Expression; line: string; variantSeed: number };
  // ヒント（現在キャラ文言で差し込み済みの、開いた段）
  hintSteps: HintStep[];
  // 解説（回答後のみ）
  result: ScoreResult | null;
  // 進捗
  roundIndex: number;
  correctCount: number;
  status: SessionStatus;
}
