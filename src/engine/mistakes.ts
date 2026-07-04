import type {
  QuizQuestion,
  QuizChoice,
  QuizTarget,
  MistakeKind,
  RuleSettings,
} from '../types/index.ts';
import { type Rng, shuffle } from './rng.ts';
import { type ScoredSummary, scorePoints } from './score.ts';

// 正解値の要約 ScoredSummary は producer 側（score.ts）が正。ここでは再エクスポートして利用。
export type { ScoredSummary };

/**
 * 誤答生成（ミス変換）。正解値に「学習者がやりがちなミス」を当てて誤答3つを作り、
 * 正解1＋誤答3の4択（QuizQuestion）に組む（data-model §12・screens.md §3、testing.md §8）。
 * 採点はしない純ロジック＝正解値（ScoredSummary）を受け取って変換するだけ。
 *
 * target='score'（点数モード）は点数を扱うため rules が要る（親子取り違え等の再計算）。
 * 'han'（役モード）は rules 不要。
 */
export function buildQuiz(
  target: QuizTarget,
  summary: ScoredSummary,
  rng: Rng,
  rules?: RuleSettings,
): QuizQuestion {
  switch (target) {
    case 'han':
      return buildHanQuiz(summary, rng);
    case 'score':
      if (!rules) throw new Error('score quiz needs RuleSettings');
      return buildScoreQuiz(summary, rng, rules);
  }
}

// ── 翻あて ─────────────────────────────────────────────────

interface HanCand {
  n: number;
  mistakeKind: MistakeKind;
  explanation: string;
}

export function buildHanQuiz(s: ScoredSummary, rng: Rng): QuizQuestion {
  if (s.yakuman) return buildYakumanHanQuiz(rng);
  const cands: HanCand[] = [];

  // ドラ見落とし
  if (s.doraHan > 0) {
    cands.push({ n: s.han - s.doraHan, mistakeKind: 'dora-miss', explanation: 'ドラを見落とすとこの翻数になる' });
  }
  // ツモ/ロン取り違え（門前ツモの1翻がずれる）
  if (s.menzen && s.win === 'tsumo' && s.yaku.includes('menzen-tsumo')) {
    cands.push({ n: s.han - 1, mistakeKind: 'tsumo-ron-swap', explanation: 'ロンと取り違えると門前ツモの1翻が消える' });
  } else if (s.menzen && s.win === 'ron') {
    cands.push({ n: s.han + 1, mistakeKind: 'tsumo-ron-swap', explanation: 'ツモと取り違えると門前ツモの1翻が増える' });
  }
  // 翻の数え違い（役見落とし＝−1、数え過ぎ＝+1、以降は埋め）
  cands.push({ n: s.han - 1, mistakeKind: 'han-miscount', explanation: '役を1つ見落とすとこの翻数になる' });
  cands.push({ n: s.han + 1, mistakeKind: 'han-miscount', explanation: '役を1つ多く数えるとこの翻数になる' });
  for (let d = 2; cands.length < 12; d++) {
    cands.push({ n: s.han - d, mistakeKind: 'han-miscount', explanation: `翻を${d}少なく数え違える` });
    cands.push({ n: s.han + d, mistakeKind: 'han-miscount', explanation: `翻を${d}多く数え違える` });
  }

  const wrongs = pickWrongHan(cands, s.han).slice(0, 3);
  const choices = assemble(
    { value: hanText(s.han), correct: true, explanation: '正しい翻数' },
    wrongs.map((c) => ({
      value: hanText(c.n),
      correct: false,
      mistakeKind: c.mistakeKind,
      explanation: c.explanation,
    })),
    rng,
  );
  return { target: 'han', prompt: '翻数（ハンスウ）は？', choices };
}

/** 役満の翻あて：役満は翻を数えず固定点（scoring-rules §1.2）なので、正解は「役満」。
 *  誤答は翻数との取り違え（役満手は summarize が han:0 を返すため通常経路では正解が壊れる＝防御分岐）。 */
function buildYakumanHanQuiz(rng: Rng): QuizQuestion {
  const wrongs: QuizChoice[] = [13, 11, 8].map((n) => ({
    value: hanText(n),
    correct: false,
    mistakeKind: 'han-miscount' as const,
    explanation: '役満は翻を数えず固定点（翻数と取り違えるとこの値）',
  }));
  const correct: QuizChoice = { value: '役満', correct: true, explanation: '役満（翻を数えず固定点）' };
  return { target: 'han', prompt: '翻数（ハンスウ）は？', choices: assemble(correct, wrongs, rng) };
}

/** 有効（1翻以上）・正解と不一致・重複なしの誤答を優先順で抽出 */
function pickWrongHan(cands: HanCand[], correctN: number): HanCand[] {
  const out: HanCand[] = [];
  const seen = new Set<number>();
  for (const c of cands) {
    if (c.n < 1 || c.n === correctN || seen.has(c.n)) continue;
    seen.add(c.n);
    out.push(c);
  }
  return out;
}

function hanText(n: number): string {
  return `${n}翻`;
}

// ── 点数あて ───────────────────────────────────────────────

const round100 = (x: number): number => Math.ceil(x / 100) * 100;

interface ScoreCand {
  n: number; // 点数（移動点合計）
  han: number; // 表示用の翻（役満は 0＝翻符を表示しない）
  fu: number; // 表示用の符（役満は 0）
  kind: MistakeKind;
  explanation: string;
}

/** 点数あての選択肢ラベル「X翻X符XXXX点」（翻・符は漢字）。役満は翻符を持たないので「XXXX点」のみ。 */
function scoreText(han: number, fu: number, points: number, yakuman: boolean): string {
  return yakuman ? `${points}点` : `${han}翻 ${fu}符 ${points}点`;
}

export function buildScoreQuiz(s: ScoredSummary, rng: Rng, rules: RuleSettings): QuizQuestion {
  const cands: ScoreCand[] = [];

  if (!s.yakuman) {
    // 翻違いの誤答は符を据え置き（s.fu）に再計算する。表示の翻も同じ値を出す。
    const cand = (han: number, dealer: boolean, kind: MistakeKind, explanation: string): ScoreCand => ({
      n: scorePoints(Math.max(1, han), s.fu, dealer, s.win, rules).payments.total,
      han,
      fu: s.fu,
      kind,
      explanation,
    });
    // 親子取り違え：翻符は正しいまま点数だけずれる
    cands.push(cand(s.han, !s.isDealer, 'dealer-swap', '親子を取り違えるとこの点数'));
    if (s.doraHan > 0) {
      cands.push(cand(s.han - s.doraHan, s.isDealer, 'dora-miss', 'ドラを見落とすとこの点数'));
    }
    cands.push(cand(s.han - 1, s.isDealer, 'han-miscount', '役を1つ見落とすとこの点数'));
    cands.push(cand(s.han + 1, s.isDealer, 'han-miscount', '1翻多く数えるとこの点数'));
    cands.push(cand(s.han - 2, s.isDealer, 'han-miscount', '翻を数え違えるとこの点数'));
  } else {
    // 役満：親子比は 2:3。倍率取り違えも引っかけに（翻符は表示しない）
    const cand = (n: number, kind: MistakeKind, explanation: string): ScoreCand => ({ n, han: 0, fu: 0, kind, explanation });
    cands.push(cand(round100(s.isDealer ? (s.points * 2) / 3 : (s.points * 3) / 2), 'dealer-swap', '親子を取り違えるとこの点数'));
    cands.push(cand(s.points * 2, 'han-miscount', 'ダブル役満と取り違え'));
    cands.push(cand(round100(s.points / 2), 'han-miscount', '役満の倍率取り違え'));
  }

  const seen = new Set<number>([s.points]);
  const wrongs: QuizChoice[] = [];
  const add = (c: ScoreCand): void => {
    if (c.n <= 0 || seen.has(c.n) || wrongs.length >= 3) return;
    if (!s.yakuman && c.han < 1) return; // 翻が0以下になる候補は出さない（表示が壊れる）
    seen.add(c.n);
    wrongs.push({ value: scoreText(c.han, c.fu, c.n, s.yakuman), correct: false, mistakeKind: c.kind, explanation: c.explanation });
  };
  for (const c of cands) add(c);
  // 候補が同値に潰れて3つに満たない場合の埋め（必ず4択にする）。翻符は正解と同じ見た目で点数だけずらす。
  for (let d = 1000; wrongs.length < 3 && d <= 100000; d += 1000) {
    add({ n: s.points + d, han: s.han, fu: s.fu, kind: 'han-miscount', explanation: '点数の数え違い' });
    add({ n: s.points - d, han: s.han, fu: s.fu, kind: 'han-miscount', explanation: '点数の数え違い' });
  }
  const correct: QuizChoice = { value: scoreText(s.han, s.fu, s.points, s.yakuman), correct: true, explanation: '正しい点数' };
  return { target: 'score', prompt: '点数は？', choices: assemble(correct, wrongs, rng) };
}

// ── 共通 ───────────────────────────────────────────────────

/** 正解＋誤答を1つの選択肢配列にまとめ、順番をシャッフルする */
function assemble(correct: QuizChoice, wrongs: QuizChoice[], rng: Rng): QuizChoice[] {
  return shuffle(rng, [correct, ...wrongs]);
}
