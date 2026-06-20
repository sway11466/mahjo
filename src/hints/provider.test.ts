import { hintProvider } from './provider.ts';
import { HINT_KEY_SET } from './keys.ts';
import { score } from '../engine/score.ts';
import { mk, hand, ctx, tbl, rules } from '../engine/__tests__/hands.ts';
import { suited } from '../engine/tiles.ts';
import type { HintStepPlan } from '../types/index.ts';

function keys(plans: HintStepPlan[]): string[] {
  return plans.map((p) => p.key);
}

describe('hintProvider — 役モードの順序', () => {
  it('状況役→ひと目役→易（リーチ・七対子・断幺九）の順、符は出ない', () => {
    const t = mk();
    // 全て2–8の七対子（断幺九）＋リーチ
    const h = hand(
      [t.m(2), t.m(2), t.m(4), t.m(4), t.m(6), t.m(6), t.p(2), t.p(2), t.p(4), t.p(4), t.p(6), t.p(6), t.s(8)],
      t.s(8),
    );
    const res = score(h, tbl(), ctx({ win: 'ron', seatWind: 'south', riichi: true }), rules());
    const plans = hintProvider(h, tbl(), ctx({ riichi: true }), res, 'yaku');
    expect(keys(plans)).toEqual(['yaku:riichi', 'yaku:chiitoitsu', 'yaku:tanyao']);
    expect(plans.every((p) => p.level === 0)).toBe(true);
    expect(plans.some((p) => p.key.startsWith('fu:'))).toBe(false); // 役モードに符は出ない
  });

  it('易→中→難（断幺九・三色同順・平和）の順', () => {
    const t = mk();
    const h = hand(
      [t.m(2), t.m(3), t.m(4), t.p(2), t.p(3), t.p(4), t.s(2), t.s(3), t.s(4), t.m(5), t.m(6), t.s(5), t.s(5)],
      t.m(7),
    );
    const res = score(h, tbl(), ctx({ win: 'ron', seatWind: 'south' }), rules());
    const plans = hintProvider(h, tbl(), ctx(), res, 'yaku');
    expect(keys(plans)).toEqual(['yaku:tanyao', 'yaku:sanshoku-doujun', 'yaku:pinfu']);
  });

  it('ドラは最後', () => {
    const t = mk();
    // 平和・断幺九＋ドラ（表示2p→ドラ3p、手に3p1枚）
    const h = hand(
      [t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)],
      t.s(8),
    );
    const res = score(h, tbl({ doraIndicators: [suited('pin', 2)] }), ctx({ win: 'ron', seatWind: 'south' }), rules());
    const plans = hintProvider(h, tbl(), ctx(), res, 'yaku');
    expect(plans[plans.length - 1]!.key).toBe('dora');
  });
});

describe('hintProvider — 点数モード', () => {
  it('役→符→ドラの順で、符の段が出る', () => {
    const t = mk();
    const h = hand(
      [t.z('haku'), t.z('haku'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(4), t.s(9), t.s(9)],
      t.z('haku'),
    );
    const res = score(h, tbl(), ctx({ win: 'ron', seatWind: 'south' }), rules());
    const plans = hintProvider(h, tbl(), ctx(), res, 'score');
    expect(plans[0]!.key).toBe('yaku:yakuhai-haku'); // 役が先頭
    expect(plans.some((p) => p.key.startsWith('fu:'))).toBe(true); // 符の段が出る
    expect(plans.some((p) => p.key === 'fu:base')).toBe(false); // 副底は段にしない（keys.ts）
    // 出すキーは全て正本（41キー）に含まれる
    for (const p of plans) expect(HINT_KEY_SET.has(p.key)).toBe(true);
  });
});
