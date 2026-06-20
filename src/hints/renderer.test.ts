import { hintRenderer } from './renderer.ts';
import { hintProvider } from './provider.ts';
import { score } from '../engine/score.ts';
import { mk, hand, ctx, tbl, rules } from '../engine/__tests__/hands.ts';
import type { HintStepPlan, HintScript } from '../types/index.ts';

describe('hintRenderer — 骨組みに文言を差し込む', () => {
  it('key＋level で script から文言を引く', () => {
    const plan: HintStepPlan[] = [
      { key: 'sanshoku-doujun', level: 0 },
      { key: 'dora', level: 0 },
    ];
    const script: HintScript = {
      'sanshoku-doujun': ['同じ並び、ほかの色にもない？'],
      dora: ['最後にドラも数えてみて'],
    };
    const steps = hintRenderer(plan, script);
    expect(steps).toEqual([
      { text: '同じ並び、ほかの色にもない？', level: 0 },
      { text: '最後にドラも数えてみて', level: 0 },
    ]);
  });

  it('level に対応する段（配列 index）を引く', () => {
    const plan: HintStepPlan[] = [{ key: 'pinfu', level: 1 }];
    const script: HintScript = { pinfu: ['ぼんやり', '一歩手前'] };
    expect(hintRenderer(plan, script)[0]!.text).toBe('一歩手前');
  });

  it('script に無いキー/段は飛ばす（UI を壊さない）', () => {
    const plan: HintStepPlan[] = [
      { key: 'tanyao', level: 0 },
      { key: 'chinitsu', level: 0 }, // script に無い
      { key: 'pinfu', level: 5 }, // 段が無い
    ];
    const script: HintScript = { tanyao: ['2〜8だけ？'], pinfu: ['L0'] };
    const steps = hintRenderer(plan, script);
    expect(steps.map((s) => s.text)).toEqual(['2〜8だけ？']);
  });
});

describe('hintRenderer — provider との結合（役モード）', () => {
  it('score→provider→renderer で順序どおりの文言列になる', () => {
    const t = mk();
    // リーチ・七対子・断幺九（順序：状況役→ひと目役→易）
    const h = hand(
      [t.m(2), t.m(2), t.m(4), t.m(4), t.m(6), t.m(6), t.p(2), t.p(2), t.p(4), t.p(4), t.p(6), t.p(6), t.s(8)],
      t.s(8),
    );
    const res = score(h, tbl(), ctx({ win: 'ron', seatWind: 'south', riichi: true }), rules());
    const plan = hintProvider(h, tbl(), ctx({ riichi: true }), res, 'yaku');
    const script: HintScript = {
      'yaku:riichi': ['上がり方、確認した？'],
      'yaku:chiitoitsu': ['同じ牌のペア、いくつ並んでる？'],
      'yaku:tanyao': ['1と9、字牌は無い？'],
    };
    const steps = hintRenderer(plan, script);
    expect(steps.map((s) => s.text)).toEqual([
      '上がり方、確認した？',
      '同じ牌のペア、いくつ並んでる？',
      '1と9、字牌は無い？',
    ]);
    expect(steps.every((s) => s.level === 0)).toBe(true);
  });
});
