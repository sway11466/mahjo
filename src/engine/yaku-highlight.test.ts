import { yakuHighlights } from './yaku-highlight.ts';
import { parse } from './parse.ts';
import { mk, hand, ctx, tbl } from './__tests__/hands.ts';
import type { Hand, Table, WinContext, YakuId, WaitType, HighlightTarget } from '../types/index.ts';

function targets(id: YakuId, h: Hand, table: Table, win: WinContext, wait?: WaitType): HighlightTarget[] {
  const decs = parse(h);
  const d = (wait ? decs.find((x) => x.wait === wait) : undefined) ?? decs[0]!;
  return yakuHighlights(id, d, h, table, win);
}
function tileIds(ts: HighlightTarget[]): number[] {
  return ts.filter((t) => t.kind === 'tile').map((t) => (t as { tileId: number }).tileId).sort((a, b) => a - b);
}
const ids = (...ts: { id: number }[]) => ts.map((t) => t.id).sort((a, b) => a - b);

describe('yakuHighlights — 牌集合役は手牌全体', () => {
  it('清一色は14枚すべてを指す', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.m(8), t.m(2), t.m(3), t.m(4), t.m(9), t.m(9)],
      t.m(9),
    );
    expect(tileIds(targets('chinitsu', h, tbl(), ctx())).length).toBe(14);
  });
});

describe('yakuHighlights — 役牌', () => {
  it('役牌(白)はその刻子3枚だけを指す', () => {
    const t = mk();
    const haku = [t.z('haku'), t.z('haku'), t.z('haku')];
    const h = hand(
      [...haku, t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(9), t.s(9)],
      t.s(4),
    );
    expect(tileIds(targets('yakuhai-haku', h, tbl(), ctx()))).toEqual(ids(...haku));
  });

  it('場風はその刻子＋場風マーカーを指す', () => {
    const t = mk();
    const east = [t.z('east'), t.z('east'), t.z('east')];
    const h = hand(
      [...east, t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(9), t.s(9)],
      t.s(4),
    );
    const ts = targets('yakuhai-round', h, tbl({ roundWind: 'east' }), ctx({ seatWind: 'south' }));
    expect(tileIds(ts)).toEqual(ids(...east));
    expect(ts.some((x) => x.kind === 'roundWind')).toBe(true);
  });
});

describe('yakuHighlights — 三色・一通・暗刻', () => {
  it('三色同順は3つの順子9枚を指す', () => {
    const t = mk();
    const runs = [
      t.m(1), t.m(3), // 2m は上がり牌
      t.p(1), t.p(2), t.p(3),
      t.s(1), t.s(2), t.s(3),
    ];
    const h = hand([...runs, t.m(5), t.m(6), t.m(7), t.s(9), t.s(9)], t.m(2));
    const got = tileIds(targets('sanshoku-doujun', h, tbl(), ctx(), 'kanchan'));
    // 123m(1m,2m上がり,3m) 123p 123s の9枚
    expect(got.length).toBe(9);
  });

  it('一気通貫は123/456/789の9枚を指す', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.m(9), t.p(2), t.p(3), t.p(4), t.s(9), t.s(9)],
      t.m(8),
    );
    expect(tileIds(targets('ittsuu', h, tbl(), ctx(), 'kanchan')).length).toBe(9);
  });

  it('三暗刻は暗刻3組9枚のみ（副露の刻子は含まない）', () => {
    const t = mk();
    const ankou = [t.m(9), t.m(9), t.m(9), t.p(3), t.p(3), t.p(3), t.s(5), t.s(5), t.s(5)];
    const h = hand(
      [...ankou, t.p(2)],
      t.p(2),
      [{ type: 'kotsu', tiles: [t.m(1), t.m(1), t.m(1)], open: true }],
    );
    const got = tileIds(targets('sanankou', h, tbl(), ctx({ win: 'tsumo' }), 'tanki'));
    expect(got).toEqual(ids(...ankou));
  });
});

describe('yakuHighlights — 状況役マーカー', () => {
  it('門前清自摸和はツモマーカー', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    expect(targets('menzen-tsumo', h, tbl(), ctx({ win: 'tsumo' }))).toEqual([{ kind: 'tsumo' }]);
  });

  it('リーチは指す牌がなく空', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    expect(targets('riichi', h, tbl(), ctx({ riichi: true }))).toEqual([]);
  });
});

describe('yakuHighlights — 全役の網羅（牌数・マーカー）', () => {
  interface HC {
    name: string;
    id: YakuId;
    make: (t: ReturnType<typeof mk>) => { h: Hand; table?: Table; win?: WinContext; wait?: WaitType };
    tiles?: number; // 期待するハイライト牌数
    markers?: HighlightTarget['kind'][]; // 期待するマーカー
  }
  const C = (
    name: string,
    id: YakuId,
    make: HC['make'],
    tiles?: number,
    markers?: HighlightTarget['kind'][],
  ): HC => {
    const hc: HC = { name, id, make };
    if (tiles !== undefined) hc.tiles = tiles;
    if (markers !== undefined) hc.markers = markers;
    return hc;
  };

  const cases: HC[] = [
    C('一盃口は同種同順2組＝6枚', 'iipeikou', (t) => ({
      h: hand([t.m(2), t.m(2), t.m(3), t.m(3), t.m(4), t.m(4), t.p(5), t.p(6), t.p(7), t.s(7), t.s(8), t.m(9), t.m(9)], t.s(9)),
    }), 6),
    C('二盃口は4順子＝12枚', 'ryanpeikou', (t) => ({
      h: hand([t.m(2), t.m(2), t.m(3), t.m(3), t.m(4), t.m(4), t.p(5), t.p(5), t.p(6), t.p(6), t.p(7), t.s(9), t.s(9)], t.p(7)),
    }), 12),
    C('三色同刻は3刻子＝9枚', 'sanshoku-doukou', (t) => ({
      h: hand([t.m(2), t.m(2), t.m(2), t.p(2), t.p(2), t.p(2), t.s(2), t.s(2), t.s(2), t.m(5), t.m(6), t.m(7), t.s(9)], t.s(9)),
    }), 9),
    C('対々和は4刻子＝12枚', 'toitoi', (t) => ({
      h: hand([t.m(2), t.m(2), t.m(2), t.p(3), t.p(3), t.p(3), t.s(4), t.s(4), t.s(4), t.p(5), t.p(5), t.s(9), t.s(9)], t.p(5)),
      wait: 'shanpon',
    }), 12),
    C('四暗刻は4刻子＝12枚', 'suuankou', (t) => ({
      h: hand([t.m(2), t.m(2), t.m(2), t.p(3), t.p(3), t.p(3), t.s(4), t.s(4), t.s(4), t.p(5), t.p(5), t.s(9), t.s(9)], t.p(5)),
      win: ctx({ win: 'tsumo' }),
      wait: 'shanpon',
    }), 12),
    C('四槓子は4槓子＝16枚', 'suukantsu', (t) => ({
      h: hand([t.m(5)], t.m(5), [
        { type: 'kantsu', tiles: [t.m(1), t.m(1), t.m(1), t.m(1)], open: false },
        { type: 'kantsu', tiles: [t.p(2), t.p(2), t.p(2), t.p(2)], open: false },
        { type: 'kantsu', tiles: [t.s(3), t.s(3), t.s(3), t.s(3)], open: false },
        { type: 'kantsu', tiles: [t.z('west'), t.z('west'), t.z('west'), t.z('west')], open: false },
      ]),
    }), 16),
    C('小三元は三元2刻子＋三元雀頭＝8枚', 'shousangen', (t) => ({
      h: hand([t.z('haku'), t.z('haku'), t.z('haku'), t.z('hatsu'), t.z('hatsu'), t.z('hatsu'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.z('chun'), t.z('chun')], t.p(7)),
    }), 8),
    C('大三元は三元3刻子＝9枚', 'daisangen', (t) => ({
      h: hand([t.z('haku'), t.z('haku'), t.z('haku'), t.z('hatsu'), t.z('hatsu'), t.z('hatsu'), t.z('chun'), t.z('chun'), t.z('chun'), t.m(2), t.m(3), t.s(9), t.s(9)], t.m(4)),
    }), 9),
    C('大四喜は風4刻子＝12枚', 'daisuushi', (t) => ({
      h: hand([t.z('east'), t.z('east'), t.z('east'), t.z('south'), t.z('south'), t.z('south'), t.z('west'), t.z('west'), t.z('west'), t.z('north'), t.z('north'), t.m(5), t.m(5)], t.z('north')),
    }), 12),
    C('自風は刻子3枚＋自風マーカー', 'yakuhai-seat', (t) => ({
      h: hand([t.z('south'), t.z('south'), t.z('south'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(9), t.s(9)], t.s(4)),
      table: tbl({ roundWind: 'east' }),
      win: ctx({ seatWind: 'south' }),
    }), 3, ['seatWind']),
    C('断幺九は手牌全体＝14枚', 'tanyao', (t) => ({
      h: hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)], t.s(8)),
    }), 14),
    C('河底はあがり牌マーカー', 'houtei', (t) => ({
      h: hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)], t.s(8)),
      win: ctx({ win: 'ron', houtei: true }),
    }), 0, ['winningTile']),
  ];

  it.each(cases)('$name', (c) => {
    const t = mk();
    const s = c.make(t);
    const ts = targets(c.id, s.h, s.table ?? tbl(), s.win ?? ctx(), s.wait);
    if (c.tiles !== undefined) expect(tileIds(ts)).toHaveLength(c.tiles);
    for (const k of c.markers ?? []) expect(ts.some((x) => x.kind === k)).toBe(true);
  });
});
