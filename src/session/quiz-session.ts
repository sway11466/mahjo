import type { Wind, Progress, StudyMode, QuizTarget } from '../types/index.ts';
import type { QuizSession, SessionAnswer, SessionProblem } from './types.ts';

/**
 * クイズ session の状態機械（純TS・[session.md] §3）。
 * 問題（SessionProblem）は入力として受け取る（生成・採点・4択化は engine 側）。
 * 正誤は選択肢の `correct` で判定するため、ここは採点エンジンに依存しない。
 */

/** 1セッションの問題数（東南戦：東1局〜南4局） */
export const SESSION_LENGTH = 8;

/** 局index（0–7）→ 場風（東1〜4=東／南1〜4=南）。生成・表示で使う。 */
export function roundWindOf(index: number): Wind {
  return index < SESSION_LENGTH / 2 ? 'east' : 'south';
}

/** セッション開始：最初の局の問題を用意し、あいさつ（greeting）状態で作る（index=0）。
 *  問題は生成済みだが盤面は出さず、beginQuiz で playing に遷移してから出題する（session.md §3）。 */
export function startSession(mode: StudyMode, first: SessionProblem): QuizSession {
  return {
    mode,
    index: 0,
    hand: first.hand,
    table: first.table,
    winContext: first.winContext,
    question: first.question,
    result: first.result,
    answers: [],
    correctCount: 0,
    status: 'greeting',
  };
}

/** あいさつ（greeting）→ 出題（playing）へ。最初の問題は startSession で生成済み。 */
export function beginQuiz(session: QuizSession): QuizSession {
  if (session.status !== 'greeting') return session;
  return { ...session, status: 'playing' };
}

/** 現在の局に回答。正誤は選択肢の correct から判定し、記録と正解数を更新（やり直しなし）。 */
export function answerCurrent(session: QuizSession, selectedIndex: number): QuizSession {
  if (session.status !== 'playing') return session;
  if (session.answers.length > session.index) return session; // この局は回答済み（防御）
  const choice = session.question.choices[selectedIndex];
  if (!choice) throw new RangeError(`invalid choice index: ${selectedIndex}`);
  const answer: SessionAnswer = { selectedIndex, correct: choice.correct };
  return {
    ...session,
    answers: [...session.answers, answer],
    correctCount: session.correctCount + (choice.correct ? 1 : 0),
  };
}

/** 次の局へ進む。8問を回答し終えていれば終了、まだなら次の問題をセットする。 */
export function advance(session: QuizSession, next: SessionProblem | null): QuizSession {
  if (session.status !== 'playing') return session;
  const nextIndex = session.index + 1;
  if (nextIndex >= SESSION_LENGTH) {
    return { ...session, status: 'finished' };
  }
  if (!next) throw new Error('advance requires the next problem');
  return {
    ...session,
    index: nextIndex,
    hand: next.hand,
    table: next.table,
    winContext: next.winContext,
    question: next.question,
    result: next.result,
  };
}

/** 1問の回答を進捗へ反映する純ヘルパ（session.md §5）。
 *  - 累計・モード別（correctTotal / correctByMode）は正解のみ加算（難易度アンロックを駆動：generation.md §3）。
 *  - 苦手集計 byTarget[target] は正誤問わず seen を +1、正解なら correct も +1（率＝苦手を測る素）。 */
export function applyProgress(
  progress: Progress,
  mode: StudyMode,
  target: QuizTarget,
  correct: boolean,
): Progress {
  const prev = progress.byTarget?.[target] ?? { seen: 0, correct: 0 };
  const byTarget: Progress['byTarget'] = {
    ...progress.byTarget,
    [target]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0) },
  };
  if (!correct) return { ...progress, byTarget };
  return {
    correctTotal: progress.correctTotal + 1,
    correctByMode: {
      ...progress.correctByMode,
      [mode]: (progress.correctByMode[mode] ?? 0) + 1,
    },
    byTarget,
  };
}
