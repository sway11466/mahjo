import { buildQuiz, buildHanQuiz, buildYakuQuiz, buildFuQuiz, buildScoreQuiz, type ScoredSummary } from './mistakes.ts';
import { mulberry32 } from './rng.ts';
import { rules } from './__tests__/hands.ts';
import type { QuizQuestion } from '../types/index.ts';

function summary(over: Partial<ScoredSummary> = {}): ScoredSummary {
  return {
    yaku: ['tanyao', 'pinfu'],
    han: 3,
    fu: 40,
    doraHan: 0,
    points: 5200,
    yakuman: false,
    menzen: true,
    win: 'ron',
    isDealer: false,
    ...over,
  };
}

function values(q: QuizQuestion): string[] {
  return q.choices.map((c) => c.value);
}

describe('mistakes — 共通の健全性', () => {
  it.each(['yaku', 'han'] as const)('%s：正解1＋誤答3で重複しない', (target) => {
    const q = buildQuiz(target, summary({ doraHan: 1 }), mulberry32(1));
    expect(q.choices).toHaveLength(4);
    expect(q.choices.filter((c) => c.correct)).toHaveLength(1);
    expect(new Set(values(q)).size).toBe(4); // 値が全て異なる
  });

  it.each(['yaku', 'han'] as const)('%s：誤答にはミス種別と理由が付く', (target) => {
    const q = buildQuiz(target, summary({ doraHan: 1 }), mulberry32(2));
    for (const c of q.choices) {
      expect(c.explanation.length).toBeGreaterThan(0);
      if (!c.correct) expect(c.mistakeKind).toBeDefined();
      else expect(c.mistakeKind).toBeUndefined();
    }
  });

  it.each(['yaku', 'han'] as const)('%s：同じ入力・seed なら同じ問題（決定的）', (target) => {
    const a = buildQuiz(target, summary({ doraHan: 1 }), mulberry32(99));
    const b = buildQuiz(target, summary({ doraHan: 1 }), mulberry32(99));
    expect(a).toEqual(b);
  });

  it('score は rules が無いと例外（符・点数の再計算に必要）', () => {
    expect(() => buildQuiz('score', summary(), mulberry32(1))).toThrow();
    expect(() => buildQuiz('score', summary(), mulberry32(1), rules())).not.toThrow();
  });
});

describe('mistakes — 翻あての変換', () => {
  it('翻はすべて1以上で、正解と一致する誤答は出ない', () => {
    const q = buildHanQuiz(summary({ han: 1 }), mulberry32(3));
    for (const c of q.choices) {
      const n = Number(c.value.replace('翻', ''));
      expect(n).toBeGreaterThanOrEqual(1);
      if (!c.correct) expect(n).not.toBe(1);
    }
  });

  it('ドラありなら dora-miss（翻−ドラ）の誤答が出る', () => {
    const q = buildHanQuiz(summary({ han: 4, doraHan: 2 }), mulberry32(4));
    const dora = q.choices.find((c) => c.mistakeKind === 'dora-miss');
    expect(dora?.value).toBe('2翻');
  });

  it('門前ツモなら tsumo-ron-swap（門前ツモの1翻減）の誤答が出る', () => {
    const q = buildHanQuiz(
      summary({ han: 4, win: 'tsumo', menzen: true, yaku: ['pinfu', 'menzen-tsumo'] }),
      mulberry32(5),
    );
    const swap = q.choices.find((c) => c.mistakeKind === 'tsumo-ron-swap');
    expect(swap?.value).toBe('3翻');
  });

  it('役見落とし（han-miscount）で翻−1の誤答が含まれる', () => {
    const q = buildHanQuiz(summary({ han: 3 }), mulberry32(6));
    expect(values(q)).toContain('2翻');
  });
});

describe('mistakes — 役あての変換', () => {
  it('正解は成立役・誤答は不成立役で、名前が重複しない', () => {
    const q = buildYakuQuiz(summary({ yaku: ['chinitsu', 'tanyao'] }), mulberry32(7));
    const correct = q.choices.find((c) => c.correct)!;
    // 表示値は役名＋読み（初心者向けふりがな。yakuDisplayName）
    expect(['清一色（チンイツ）', '断幺九（タンヤオ）']).toContain(correct.value); // 成立役の名称
    expect(new Set(values(q)).size).toBe(4);
    // 誤答は成立していない役（清一色・断幺九は出ない＝正解側のみ）
    const wrongs = q.choices.filter((c) => !c.correct).map((c) => c.value);
    expect(wrongs).not.toContain('清一色（チンイツ）');
  });

  it('代表役は翻の高い役が選ばれる', () => {
    // chinitsu(6) > tanyao(1) なので清一色が正解になる
    const q = buildYakuQuiz(summary({ yaku: ['tanyao', 'chinitsu'] }), mulberry32(8));
    expect(q.choices.find((c) => c.correct)!.value).toBe('清一色（チンイツ）');
  });
});

describe('mistakes — 符あて', () => {
  it('正解は{符}、誤答3つは fu-miscount で重複なし・全て20符以上', () => {
    const q = buildFuQuiz(summary({ fu: 40 }), mulberry32(1));
    expect(q.target).toBe('fu');
    expect(q.choices).toHaveLength(4);
    expect(q.choices.find((c) => c.correct)?.value).toBe('40符');
    expect(new Set(q.choices.map((c) => c.value)).size).toBe(4);
    for (const c of q.choices) {
      const n = Number(c.value.replace('符', ''));
      expect(n).toBeGreaterThanOrEqual(20);
      if (!c.correct) expect(c.mistakeKind).toBe('fu-miscount');
    }
  });

  it('七対子25符でも正解と一致する誤答は出ない', () => {
    const q = buildFuQuiz(summary({ fu: 25 }), mulberry32(2));
    expect(q.choices.find((c) => c.correct)?.value).toBe('25符');
    expect(q.choices.filter((c) => c.value === '25符')).toHaveLength(1);
  });
});

describe('mistakes — 点数あて', () => {
  it('正解は{点}、親子取り違えの誤答が出る・重複なし', () => {
    const q = buildScoreQuiz(summary({ points: 5200, han: 3, fu: 40, isDealer: false }), mulberry32(3), rules());
    expect(q.target).toBe('score');
    expect(q.choices).toHaveLength(4);
    expect(q.choices.find((c) => c.correct)?.value).toBe('3翻 40符 5200点');
    expect(new Set(q.choices.map((c) => c.value)).size).toBe(4);
    expect(q.choices.some((c) => c.mistakeKind === 'dealer-swap')).toBe(true);
    // 子ロン5200（1280×4）↔ 親ロン7700（1280×6=7680→切上）。翻符は正しいまま点数だけずれる
    expect(q.choices.some((c) => c.value === '3翻 40符 7700点')).toBe(true);
  });

  it('選択肢は「X翻X符XXXX点」形式（翻・符は漢字）', () => {
    const q = buildScoreQuiz(summary({ points: 5200, han: 3, fu: 40, isDealer: false }), mulberry32(3), rules());
    for (const c of q.choices) expect(c.value).toMatch(/^\d+翻 \d+符 \d+点$/);
  });

  it('役満は翻符を出さず「XXXX点」のみ', () => {
    const q = buildScoreQuiz(summary({ points: 32000, yakuman: true, isDealer: false, han: 0 }), mulberry32(5), rules());
    for (const c of q.choices) expect(c.value).toMatch(/^\d+点$/);
  });

  it('ドラありなら dora-miss の誤答が出る', () => {
    const q = buildScoreQuiz(summary({ points: 7700, han: 4, fu: 30, doraHan: 2, isDealer: false }), mulberry32(4), rules());
    expect(q.choices.some((c) => c.mistakeKind === 'dora-miss')).toBe(true);
  });

  it('同じ入力・seed なら同じ問題（決定的）', () => {
    const s = summary({ points: 5200, han: 3, fu: 40 });
    expect(buildScoreQuiz(s, mulberry32(9), rules())).toEqual(buildScoreQuiz(s, mulberry32(9), rules()));
  });

  it('役満は親子比2:3の取り違えを誤答に出す', () => {
    const q = buildScoreQuiz(summary({ points: 32000, yakuman: true, isDealer: false, han: 0 }), mulberry32(5), rules());
    expect(q.choices.find((c) => c.correct)?.value).toBe('32000点');
    expect(q.choices.some((c) => c.value === '48000点')).toBe(true); // 子32000 ↔ 親48000
  });
});

import { scorePoints } from './score.ts';

describe('mistakes — 点数あては常に4択（重複なし保証）', () => {
  it.each<[number, number, boolean]>([
    [3, 40, false],
    [5, 30, false],
    [6, 30, true],
    [8, 20, false],
    [2, 30, true],
    [11, 30, false],
  ])('%i翻%i符 dealer=%s', (han, fu, dealer) => {
    const points = scorePoints(han, fu, dealer, 'ron', rules()).payments.total;
    const q = buildScoreQuiz(
      summary({ han, fu, isDealer: dealer, points, yakuman: false, doraHan: 0, win: 'ron' }),
      mulberry32(han * 7 + fu),
      rules(),
    );
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices.map((c) => c.value)).size).toBe(4);
  });
});
