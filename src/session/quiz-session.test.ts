import type { QuizChoice, Progress, ScoreResult } from '../types/index.ts';
import { ctx, tbl } from '../engine/__tests__/hands.ts';
import { suited } from '../engine/tiles.ts';
import type { SessionProblem } from './types.ts';

/** テスト用の最小 ScoreResult（採点内容は本テストでは不問。型を満たすだけ）。 */
const emptyResult: ScoreResult = {
  totalHan: 0,
  totalFu: 0,
  scoreText: '',
  payments: { total: 0 },
  rank: 'normal',
  yakuman: false,
  items: [],
  hasYaku: false,
};
import {
  SESSION_LENGTH,
  roundWindOf,
  startSession,
  beginQuiz,
  answerCurrent,
  advance,
  applyProgress,
  buildMissRecord,
  appendMiss,
} from './quiz-session.ts';
import type { MissHistory } from '../types/index.ts';
import { MISS_HISTORY_CAP } from '../types/index.ts';

// 開始＝あいさつ（greeting）→ beginQuiz で出題（playing）。回答系テストは playing から始める。
const started = (p: SessionProblem) => beginQuiz(startSession('yaku', p));

/** correctIndex を正解にした4択のダミー問題（盤面はテスト上は中身不問） */
function problem(correctIndex = 0): SessionProblem {
  const choices: QuizChoice[] = [0, 1, 2, 3].map((i) => ({
    value: `${i + 1}翻`,
    correct: i === correctIndex,
    explanation: '',
  }));
  return {
    // 盤面はテスト上は中身不問。検証を通さず最小の Hand を直接構築する。
    hand: { concealed: [], calledMelds: [], winningTile: suited('man', 1) },
    table: tbl(),
    winContext: ctx(),
    question: { target: 'han', prompt: '翻数は？', choices },
    result: emptyResult,
  };
}

describe('roundWindOf', () => {
  it('maps 局 index to round wind (東1-4=east / 南1-4=south)', () => {
    expect(roundWindOf(0)).toBe('east');
    expect(roundWindOf(3)).toBe('east');
    expect(roundWindOf(4)).toBe('south');
    expect(roundWindOf(7)).toBe('south');
  });
});

describe('quiz session state machine', () => {
  it('starts at 局 0, greeting, with no answers', () => {
    const s = startSession('yaku', problem(2));
    expect(s).toMatchObject({
      mode: 'yaku',
      index: 0,
      correctCount: 0,
      status: 'greeting',
    });
    expect(s.answers).toHaveLength(0);
  });

  it('beginQuiz moves greeting → playing (keeps the first problem)', () => {
    const s = startSession('yaku', problem(1));
    const begun = beginQuiz(s);
    expect(begun.status).toBe('playing');
    expect(begun.question).toBe(s.question);
    // answering before begin is a no-op（あいさつ中は回答できない）
    expect(answerCurrent(s, 1)).toBe(s);
  });

  it('records a correct answer and increments correctCount', () => {
    const s = answerCurrent(started(problem(1)), 1);
    expect(s.answers).toEqual([{ selectedIndex: 1, correct: true }]);
    expect(s.correctCount).toBe(1);
  });

  it('records a wrong answer without incrementing correctCount', () => {
    const s = answerCurrent(started(problem(1)), 0);
    expect(s.answers).toEqual([{ selectedIndex: 0, correct: false }]);
    expect(s.correctCount).toBe(0);
  });

  it('throws on an out-of-range choice index', () => {
    expect(() => answerCurrent(started(problem()), 9)).toThrow();
  });

  it('advances to the next 局 and sets the new problem', () => {
    const s0 = started(problem(0));
    const s1 = advance(answerCurrent(s0, 0), problem(1));
    expect(s1.index).toBe(1);
    expect(s1.status).toBe('playing');
    expect(s1.question.choices[1]?.correct).toBe(true);
  });

  it('finishes after answering all 8 局 (correctCount counts the wins)', () => {
    let s = started(problem(0));
    for (let i = 0; i < SESSION_LENGTH; i++) {
      // 偶数局だけ正解を選ぶ
      s = answerCurrent(s, i % 2 === 0 ? 0 : 3);
      s = advance(s, i < SESSION_LENGTH - 1 ? problem(0) : null);
    }
    expect(s.status).toBe('finished');
    expect(s.index).toBe(SESSION_LENGTH - 1);
    expect(s.correctCount).toBe(4); // 局 0,2,4,6
    expect(s.answers).toHaveLength(SESSION_LENGTH);
  });

  it('is a no-op once finished', () => {
    let s = started(problem(0));
    for (let i = 0; i < SESSION_LENGTH; i++) {
      s = advance(answerCurrent(s, 0), i < SESSION_LENGTH - 1 ? problem(0) : null);
    }
    const after = answerCurrent(s, 0);
    expect(after).toBe(s); // 終了後は変化しない
  });
});

describe('miss history（間違い履歴。data-model §16）', () => {
  const at = '2026-07-05T00:00:00.000Z';

  it('buildMissRecord: 誤答なら盤面と選択値・正解値を写す（解釈は保存しない）', () => {
    // problem(1)＝正解 index 1（'2翻'）。index 2（'3翻'）を選んで誤答にする。
    const s = answerCurrent(started(problem(1)), 2);
    const rec = buildMissRecord(s, at);
    expect(rec).not.toBeNull();
    expect(rec!.at).toBe(at);
    expect(rec!.selectedValue).toBe('3翻');
    expect(rec!.correctValue).toBe('2翻');
    // 生データ（盤面）はそのまま参照を写す
    expect(rec!.hand).toBe(s.hand);
    expect(rec!.table).toBe(s.table);
    expect(rec!.winContext).toBe(s.winContext);
  });

  it('buildMissRecord: 正解・未回答は null', () => {
    const before = started(problem(1));
    expect(buildMissRecord(before, at)).toBeNull(); // 未回答
    expect(buildMissRecord(answerCurrent(before, 1), at)).toBeNull(); // 正解
  });

  it('appendMiss: キャラ別×モード別に末尾へ追記する（他バケットに影響しない）', () => {
    const rec = buildMissRecord(answerCurrent(started(problem(1)), 0), at)!;
    let h: MissHistory = {};
    h = appendMiss(h, 'mao', 'yaku', rec);
    h = appendMiss(h, 'mao', 'score', rec);
    h = appendMiss(h, 'rin', 'yaku', rec);
    expect(h.mao?.yaku).toHaveLength(1);
    expect(h.mao?.score).toHaveLength(1);
    expect(h.rin?.yaku).toHaveLength(1);
    expect(h.rin?.score).toBeUndefined();
  });

  it('appendMiss: 上限（MISS_HISTORY_CAP）を超えたら古いものから捨てる（新しいものが末尾）', () => {
    const base = buildMissRecord(answerCurrent(started(problem(1)), 0), at)!;
    let h: MissHistory = {};
    for (let i = 0; i < MISS_HISTORY_CAP + 5; i++) {
      h = appendMiss(h, 'mao', 'yaku', { ...base, at: `t${i}` });
    }
    const buf = h.mao!.yaku!;
    expect(buf).toHaveLength(MISS_HISTORY_CAP);
    expect(buf[0]!.at).toBe('t5'); // 古い5件（t0–t4）が押し出されている
    expect(buf[buf.length - 1]!.at).toBe(`t${MISS_HISTORY_CAP + 4}`);
  });
});

describe('applyProgress', () => {
  const base: Progress = { correctTotal: 2, correctByMode: { yaku: 2 } };

  it('increments total, per-mode, and byTarget on a correct answer', () => {
    const p = applyProgress(base, 'yaku', 'han', true);
    expect(p.correctTotal).toBe(3);
    expect(p.correctByMode.yaku).toBe(3);
    expect(p.byTarget?.han).toEqual({ seen: 1, correct: 1 });
  });

  it('on a wrong answer: total/per-mode unchanged but byTarget.seen still counts', () => {
    const p = applyProgress(base, 'yaku', 'han', false);
    expect(p.correctTotal).toBe(2); // 累計は据え置き
    expect(p.correctByMode.yaku).toBe(2);
    expect(p.byTarget?.han).toEqual({ seen: 1, correct: 0 }); // 露出は数える
  });

  it('starts a mode count from zero', () => {
    const p = applyProgress(base, 'score', 'score', true);
    expect(p.correctByMode.score).toBe(1);
    expect(p.correctByMode.yaku).toBe(2);
  });

  it('accumulates byTarget across answers, tracking correct vs seen', () => {
    let p = base;
    p = applyProgress(p, 'score', 'score', true);
    p = applyProgress(p, 'score', 'score', false);
    p = applyProgress(p, 'score', 'score', true);
    expect(p.byTarget?.score).toEqual({ seen: 3, correct: 2 }); // 率 = 2/3
  });
});
