import type {
  StudyMode,
  Wind,
  Progress,
  RuleSettings,
  QuizTarget,
} from '../types/index.ts';
import type { Rng } from '../engine/rng.ts';
import { generate, sanitizeForGeneration } from '../engine/generate.ts';
import { summarize, score } from '../engine/score.ts';
import { buildQuiz } from '../engine/mistakes.ts';
import type { QuizSession, SessionProblem } from './types.ts';
import { SESSION_LENGTH, roundWindOf, startSession, advance } from './quiz-session.ts';

/**
 * 出題生成（engine を束ねる）。`generate(局の場風) → summarize → buildQuiz` で1局分の
 * SessionProblem を作り、状態機械（quiz-session）に渡す（session.md §3）。
 */

/** StudyMode → クイズの問う対象。役モードは複合役のため翻で答える（'han'）。点数モードは 'score'。 */
function targetFor(mode: StudyMode): QuizTarget {
  return mode === 'yaku' ? 'han' : 'score';
}

/** 1局分の出題を生成：generate(その局の場風) → summarize → buildQuiz。 */
export function buildProblem(
  mode: StudyMode,
  roundWind: Wind,
  progress: Progress,
  rng: Rng,
  rules: RuleSettings,
): SessionProblem {
  // 壊れた保存データ（enabledYaku 全オフ等）でも止まらないよう、出題の入口で無害化する（bug-7）。
  // 生成・採点・4択が同じ rules を見るため、ここで一度だけ畳む。
  const r = sanitizeForGeneration(rules);
  // クイズは常に局の場風を渡す（東南戦）。よって rules.round はクイズでは効かない
  // ＝場風を渡さない単発/解説向け生成にのみ効く（scoring-rules.md §5・generation.md §2）。
  const q = generate(progress, mode, rng, r, roundWind);
  const summary = summarize(q.hand, q.table, q.winContext, r);
  const question = buildQuiz(targetFor(mode), summary, rng, r); // 点数モード(score)は rules 必須
  // 完全な採点結果（items 付き）。ヒント（HintProvider の入力）・解説シーンで使う。
  const result = score(q.hand, q.table, q.winContext, r);
  return { hand: q.hand, table: q.table, winContext: q.winContext, question, result };
}

/** セッション開始：東1局の問題を生成して進行中セッションを作る。 */
export function startQuiz(
  mode: StudyMode,
  progress: Progress,
  rng: Rng,
  rules: RuleSettings,
): QuizSession {
  return startSession(mode, buildProblem(mode, roundWindOf(0), progress, rng, rules));
}

/** 次の局へ：最後でなければその局の場風で次の問題を生成して進める。8問終えていれば終了。 */
export function nextProblem(
  session: QuizSession,
  progress: Progress,
  rng: Rng,
  rules: RuleSettings,
): QuizSession {
  if (session.status !== 'playing') return session;
  const nextIndex = session.index + 1;
  if (nextIndex >= SESSION_LENGTH) return advance(session, null);
  return advance(
    session,
    buildProblem(session.mode, roundWindOf(nextIndex), progress, rng, rules),
  );
}
