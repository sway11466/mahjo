import type {
  YakuId,
  QuizQuestion,
  QuizChoice,
  QuizTarget,
  MistakeKind,
  RuleSettings,
} from '../types/index.ts';
import { getYaku, yakuDisplayName } from './yaku-table.ts';
import { type Rng, shuffle } from './rng.ts';
import { type ScoredSummary, scorePoints } from './score.ts';

// 正解値の要約 ScoredSummary は producer 側（score.ts）が正。ここでは再エクスポートして利用。
export type { ScoredSummary };

/**
 * 誤答生成（ミス変換）。正解値に「学習者がやりがちなミス」を当てて誤答3つを作り、
 * 正解1＋誤答3の4択（QuizQuestion）に組む（data-model §12・screens.md §3、testing.md §8）。
 * 採点はしない純ロジック＝正解値（ScoredSummary）を受け取って変換するだけ。
 *
 * target='fu'/'score' は符・点数を扱うため rules が要る（親子取り違え等の再計算）。
 * 'yaku'/'han'（役モード）は rules 不要。
 */
export function buildQuiz(
  target: QuizTarget,
  summary: ScoredSummary,
  rng: Rng,
  rules?: RuleSettings,
): QuizQuestion {
  switch (target) {
    case 'yaku':
      return buildYakuQuiz(summary, rng);
    case 'han':
      return buildHanQuiz(summary, rng);
    case 'fu':
      return buildFuQuiz(summary, rng);
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

// ── 役あて ─────────────────────────────────────────────────

/** 誤答に使う「ありがちな別の役」プール（成立していない役を引っかけに出す） */
const DISTRACTOR_POOL: YakuId[] = [
  'tanyao', 'pinfu', 'iipeikou',
  'yakuhai-haku', 'yakuhai-hatsu', 'yakuhai-chun',
  'sanshoku-doujun', 'sanshoku-doukou', 'ittsuu',
  'chanta', 'junchan', 'chiitoitsu', 'toitoi', 'sanankou',
  'honroutou', 'shousangen', 'honitsu', 'ryanpeikou', 'chinitsu',
];

export function buildYakuQuiz(s: ScoredSummary, rng: Rng): QuizQuestion {
  const present = new Set(s.yaku);
  const correct = primaryYaku(s.yaku);
  const correctName = yakuDisplayName(getYaku(correct)!);

  const distractors = shuffle(rng, DISTRACTOR_POOL.filter((id) => !present.has(id))).slice(0, 3);
  const choices = assemble(
    { value: correctName, correct: true, explanation: '成立している役' },
    distractors.map((id) => {
      const name = yakuDisplayName(getYaku(id)!);
      return {
        value: name,
        correct: false,
        mistakeKind: 'han-miscount' as const,
        explanation: `${name}は成立していない（役の取り違え）`,
      };
    }),
    rng,
  );
  return { target: 'yaku', prompt: '成立している役は？', choices };
}

/** 成立役から代表役（翻が高いもの／役満優先）を1つ選ぶ */
function primaryYaku(yaku: YakuId[]): YakuId {
  let best: YakuId | undefined;
  let bestScore = -1;
  for (const id of yaku) {
    const y = getYaku(id);
    if (!y) continue;
    const score = y.yakuman ? 100 : y.hanClosed;
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  if (!best) throw new Error('no nameable yaku to quiz');
  return best;
}

// ── 符あて ─────────────────────────────────────────────────

export function buildFuQuiz(s: ScoredSummary, rng: Rng): QuizQuestion {
  // 符は10刻み（七対子25のみ例外）。前後の符を「符の数え違い」として出す
  const cands = [s.fu + 10, s.fu - 10, s.fu + 20, s.fu - 20, s.fu + 5, s.fu - 5];
  const seen = new Set<number>([s.fu]);
  const wrongs: QuizChoice[] = [];
  for (const n of cands) {
    if (n < 20 || seen.has(n)) continue;
    seen.add(n);
    wrongs.push({
      value: `${n}符`,
      correct: false,
      mistakeKind: 'fu-miscount',
      explanation: '符の数え違い（待ち符・明暗刻・切り上げ 等）',
    });
    if (wrongs.length === 3) break;
  }
  const correct: QuizChoice = { value: `${s.fu}符`, correct: true, explanation: '正しい符' };
  return { target: 'fu', prompt: '符（フ）は？', choices: assemble(correct, wrongs, rng) };
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
