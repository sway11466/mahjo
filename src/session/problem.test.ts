import type { Progress, RuleSettings } from '../types/index.ts';
import { mulberry32 } from '../engine/rng.ts';
import { buildProblem, startQuiz, nextProblem } from './problem.ts';
import { SESSION_LENGTH, beginQuiz, answerCurrent } from './quiz-session.ts';

const progress: Progress = { correctTotal: 0, correctByMode: {} };
const rules: RuleSettings = {
  kuitan: true,
  atozuke: true,
  akaDoraCount: 0,
  kiriageMangan: false,
  kazoeYakuman: false,
  doubleYakuman: false,
  rareYaku: false,
  round: 'random',
  enabledYaku: {},
};

describe('buildProblem', () => {
  it('builds a problem with the requested round wind and a 4-choice question', () => {
    const p = buildProblem('yaku', 'south', progress, mulberry32(1), rules);
    expect(p.table.roundWind).toBe('south');
    expect(p.question.choices).toHaveLength(4);
    expect(p.question.choices.filter((c) => c.correct)).toHaveLength(1);
    expect(p.hand.winningTile).toBeTruthy();
  });

  it('is deterministic for the same seed', () => {
    const a = buildProblem('yaku', 'east', progress, mulberry32(7), rules);
    const b = buildProblem('yaku', 'east', progress, mulberry32(7), rules);
    expect(b).toEqual(a);
  });
});

describe('startQuiz / nextProblem', () => {
  it('starts at 東1局 (east, index 0, greeting)', () => {
    const s = startQuiz('yaku', progress, mulberry32(3), rules);
    expect(s.index).toBe(0);
    expect(s.table.roundWind).toBe('east');
    expect(s.status).toBe('greeting');
    expect(s.question.choices).toHaveLength(4);
  });

  it('uses the south round for the second half (南場)', () => {
    const rng = mulberry32(5);
    let s = beginQuiz(startQuiz('yaku', progress, rng, rules));
    for (let i = 0; i < 4; i++) {
      s = nextProblem(answerCurrent(s, 0), progress, rng, rules);
    }
    expect(s.index).toBe(4);
    expect(s.table.roundWind).toBe('south');
  });

  it('runs a full 8-hand session to finished', () => {
    const rng = mulberry32(42);
    let s = beginQuiz(startQuiz('yaku', progress, rng, rules));
    for (let i = 0; i < SESSION_LENGTH; i++) {
      s = answerCurrent(s, 0);
      s = nextProblem(s, progress, rng, rules);
    }
    expect(s.status).toBe('finished');
    expect(s.answers).toHaveLength(SESSION_LENGTH);
  });
});
