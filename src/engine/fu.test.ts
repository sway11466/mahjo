import { computeFu, type FuResult } from './fu.ts';
import { parse } from './parse.ts';
import { mk, hand, ctx, tbl } from './__tests__/hands.ts';
import type { Tile, Hand, Table, WinContext, YakuId, WaitType } from '../types/index.ts';

/** 指定の待ちに一致する解釈で符を計算（無ければ先頭） */
function fuRes(
  h: Hand,
  table: Table,
  win: WinContext,
  yaku: YakuId[] = [],
  wait?: WaitType,
): FuResult {
  const decs = parse(h);
  const d = (wait ? decs.find((x) => x.wait === wait) : undefined) ?? decs[0]!;
  return computeFu(d, h, table, win, yaku);
}

/** 面子符の項目（最初の fu-meld-*）の符。無ければ 0 */
function meldFu(res: FuResult): number {
  return res.items.find((i) => i.id.startsWith('fu-meld'))?.value ?? 0;
}
function compFu(res: FuResult, id: string): number {
  return res.items.find((i) => i.id === id)?.value ?? 0;
}

describe('fu — 符の特例', () => {
  const pinfuHand = (t: ReturnType<typeof mk>) =>
    hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );

  it('平和ツモは20符固定（ツモ符を付けない）', () => {
    expect(fuRes(pinfuHand(mk()), tbl(), ctx({ win: 'tsumo' }), ['pinfu']).fu).toBe(20);
  });

  it('平和ロンは30符', () => {
    expect(fuRes(pinfuHand(mk()), tbl(), ctx({ win: 'ron' }), ['pinfu']).fu).toBe(30);
  });

  it('七対子は25符固定', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(1), t.m(4), t.m(4), t.m(7), t.m(7), t.p(2), t.p(2), t.p(5), t.p(5), t.p(8), t.p(8), t.s(3)],
      t.s(3),
    );
    expect(fuRes(h, tbl(), ctx(), ['chiitoitsu']).fu).toBe(25);
  });

  it('喰い平和形（副露で20符ロン相当）は30符に繰り上げ', () => {
    const t = mk();
    const h = hand(
      [t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)],
      t.s(8),
      [{ type: 'shuntsu', tiles: [t.m(2), t.m(3), t.m(4)], open: true }],
    );
    expect(fuRes(h, tbl(), ctx({ win: 'ron' }), []).fu).toBe(30);
  });
});

describe('fu — 待ち符', () => {
  const base = (t: ReturnType<typeof mk>, wait: Tile[], win: Tile) =>
    hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(2), t.p(3), t.p(4), ...wait, t.s(9), t.s(9)], win);

  it('嵌張・辺張・単騎は+2、両面は0', () => {
    const k = mk();
    expect(compFu(fuRes(base(k, [k.s(4), k.s(6)], k.s(5)), tbl(), ctx({ win: 'tsumo' }), [], 'kanchan'), 'fu-wait')).toBe(2);
    const r = mk();
    expect(compFu(fuRes(base(r, [r.s(4), r.s(5)], r.s(6)), tbl(), ctx({ win: 'tsumo' }), [], 'ryanmen'), 'fu-wait')).toBe(0);
  });
});

describe('fu — 面子符（中張/么九 × 明/暗）', () => {
  // 中張暗刻 555m＋3順子＋雀頭、ツモ（両面）
  it('中張の暗刻は4符', () => {
    const t = mk();
    const h = hand(
      [t.m(5), t.m(5), t.m(5), t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(9), t.s(9)],
      t.s(8),
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'ryanmen'))).toBe(4);
  });

  it('中張の明刻（ポン）は2符', () => {
    const t = mk();
    const h = hand(
      [t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(8), t.s(9)],
      t.s(9),
      [{ type: 'kotsu', tiles: [t.m(5), t.m(5), t.m(5)], open: true }],
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'tanki'))).toBe(2);
  });

  it('么九の暗刻は8符', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(1), t.m(1), t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(9), t.s(9)],
      t.s(8),
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'ryanmen'))).toBe(8);
  });

  it('ロンで完成した中張刻子は明刻＝2符（暗刻4にしない）', () => {
    const t = mk();
    // 55m と 99s のシャンポン、5m ロンで 555m が明刻
    const h = hand(
      [t.m(5), t.m(5), t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(8), t.s(9), t.s(9)],
      t.m(5),
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'ron' }), [], 'shanpon'))).toBe(2);
  });

  it('中張の暗槓は16符', () => {
    const t = mk();
    const h = hand(
      [t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.s(2), t.s(3), t.s(4), t.s(9)],
      t.s(9),
      [{ type: 'kantsu', tiles: [t.p(5), t.p(5), t.p(5), t.p(5)], open: false }],
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'tanki'))).toBe(16);
  });

  it('么九の暗槓は32符・明槓は16符', () => {
    const ankan = mk();
    const ha = hand(
      [ankan.p(2), ankan.p(3), ankan.p(4), ankan.p(5), ankan.p(6), ankan.p(7), ankan.s(2), ankan.s(3), ankan.s(4), ankan.s(9)],
      ankan.s(9),
      [{ type: 'kantsu', tiles: [ankan.m(1), ankan.m(1), ankan.m(1), ankan.m(1)], open: false }],
    );
    expect(meldFu(fuRes(ha, tbl(), ctx({ win: 'tsumo' }), [], 'tanki'))).toBe(32);

    const minkan = mk();
    const hm = hand(
      [minkan.p(2), minkan.p(3), minkan.p(4), minkan.p(5), minkan.p(6), minkan.p(7), minkan.s(2), minkan.s(3), minkan.s(4), minkan.s(9)],
      minkan.s(9),
      [{ type: 'kantsu', tiles: [minkan.m(1), minkan.m(1), minkan.m(1), minkan.m(1)], open: true }],
    );
    expect(meldFu(fuRes(hm, tbl(), ctx({ win: 'tsumo' }), [], 'tanki'))).toBe(16);
  });
});

describe('fu — 雀頭符', () => {
  const pairHand = (t: ReturnType<typeof mk>, pair: Tile[]) =>
    hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(2), t.p(3), t.p(4), t.s(4), t.s(5), ...pair], t.s(6));

  it('役牌（三元牌）の雀頭は+2', () => {
    const t = mk();
    expect(compFu(fuRes(pairHand(t, [t.z('haku'), t.z('haku')]), tbl(), ctx(), [], 'ryanmen'), 'fu-pair')).toBe(2);
  });

  it('連風牌（場風＝自風）の雀頭は+4', () => {
    const t = mk();
    const res = fuRes(
      pairHand(t, [t.z('east'), t.z('east')]),
      tbl({ roundWind: 'east' }),
      ctx({ seatWind: 'east' }),
      [],
      'ryanmen',
    );
    expect(compFu(res, 'fu-pair')).toBe(4);
  });
});

describe('fu — 10符切り上げ', () => {
  it('么九暗刻＋門前ロン（20+10+8=38）は40符に切り上げ', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(1), t.m(1), t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(9), t.s(9)],
      t.s(8),
    );
    const res = fuRes(h, tbl(), ctx({ win: 'ron' }), [], 'ryanmen');
    expect(meldFu(res)).toBe(8);
    expect(res.fu).toBe(40);
  });
});

describe('fu — 雀頭符の網羅', () => {
  const pairHand = (t: ReturnType<typeof mk>, pair: Tile[]) =>
    hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(2), t.p(3), t.p(4), t.s(4), t.s(5), ...pair], t.s(6));

  it('客風（場風でも自風でもない）の雀頭は0符', () => {
    const t = mk();
    // 場風東・自風南 → 西は客風
    const res = fuRes(pairHand(t, [t.z('west'), t.z('west')]), tbl({ roundWind: 'east' }), ctx({ seatWind: 'south' }), [], 'ryanmen');
    expect(compFu(res, 'fu-pair')).toBe(0);
  });

  it('場風のみの雀頭は+2', () => {
    const t = mk();
    const res = fuRes(pairHand(t, [t.z('east'), t.z('east')]), tbl({ roundWind: 'east' }), ctx({ seatWind: 'south' }), [], 'ryanmen');
    expect(compFu(res, 'fu-pair')).toBe(2);
  });

  it('自風のみの雀頭は+2', () => {
    const t = mk();
    const res = fuRes(pairHand(t, [t.z('south'), t.z('south')]), tbl({ roundWind: 'east' }), ctx({ seatWind: 'south' }), [], 'ryanmen');
    expect(compFu(res, 'fu-pair')).toBe(2);
  });
});

describe('fu — 面子符の残セル', () => {
  it('么九の明刻（ポン1m）は4符', () => {
    const t = mk();
    const h = hand(
      [t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(8), t.s(9)],
      t.s(9),
      [{ type: 'kotsu', tiles: [t.m(1), t.m(1), t.m(1)], open: true }],
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'tanki'))).toBe(4);
  });

  it('中張の明槓は8符', () => {
    const t = mk();
    const h = hand(
      [t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.s(2), t.s(3), t.s(4), t.s(9)],
      t.s(9),
      [{ type: 'kantsu', tiles: [t.p(5), t.p(5), t.p(5), t.p(5)], open: true }],
    );
    expect(meldFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'tanki'))).toBe(8);
  });
});

describe('fu — 門前ロン/ツモ符', () => {
  it('副露手のロンには門前ロン符が付かない', () => {
    const t = mk();
    const h = hand(
      [t.p(5), t.p(5), t.p(5), t.s(2), t.s(3), t.s(4), t.s(6), t.s(7), t.s(8), t.s(9)],
      t.s(9),
      [{ type: 'shuntsu', tiles: [t.m(2), t.m(3), t.m(4)], open: true }],
    );
    const res = fuRes(h, tbl(), ctx({ win: 'ron' }), [], 'tanki');
    expect(res.items.some((i) => i.id === 'fu-menzen-ron')).toBe(false);
    // 副底20 + 単騎2 + 555p暗刻4 = 26 → 30
    expect(res.fu).toBe(30);
  });

  it('ツモ手にはツモ符+2が付く（平和以外）', () => {
    const t = mk();
    const h = hand(
      [t.m(5), t.m(5), t.m(5), t.p(2), t.p(3), t.p(4), t.p(5), t.p(6), t.p(7), t.s(6), t.s(7), t.s(9), t.s(9)],
      t.s(8),
    );
    expect(compFu(fuRes(h, tbl(), ctx({ win: 'tsumo' }), [], 'ryanmen'), 'fu-tsumo')).toBe(2);
  });
});
