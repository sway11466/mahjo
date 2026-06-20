import { parse } from './parse.ts';
import { detectYaku } from './yaku.ts';
import { getYaku } from './yaku-table.ts';
import { mk, hand, ctx, rules, tbl, type Mk } from './__tests__/hands.ts';
import type { Hand, Table, WinContext, RuleSettings, YakuId } from '../types/index.ts';

interface Situation {
  hand: Hand;
  table?: Table;
  win?: WinContext;
  rules?: RuleSettings;
}

function run(s: Situation) {
  const table = s.table ?? tbl();
  const win = s.win ?? ctx();
  const r = s.rules ?? rules();
  return { table, win, r };
}

function menzenOf(h: Hand): boolean {
  return h.calledMelds.every((m) => !m.open);
}

/** 各分解の検出役（ソート済み） */
function sets(s: Situation): YakuId[][] {
  const { table, win, r } = run(s);
  return parse(s.hand).map((d) => [...detectYaku(d, s.hand, table, win, r)].sort());
}

/** 全分解の検出役の和集合 */
function union(s: Situation): Set<YakuId> {
  const out = new Set<YakuId>();
  for (const set of sets(s)) for (const id of set) out.add(id);
  return out;
}

/** 通常役の翻合計（役満が含まれれば null＝固定点扱い） */
function yakuHan(ids: YakuId[], menzen: boolean): number | null {
  let h = 0;
  for (const id of ids) {
    const y = getYaku(id);
    if (!y) continue;
    if (y.yakuman) return null;
    h += menzen ? y.hanClosed : (y.hanOpen ?? 0);
  }
  return h;
}

// ── 成立役セットの完全一致（過剰検出も検出する） ───────────────

interface ExactCase {
  name: string;
  make: (t: Mk) => Situation;
  yaku: YakuId[];
  han?: number; // 役満を含まないとき、通常役の翻合計
}

const EXACT: ExactCase[] = [
  {
    name: '平和のみ（門前・両面・役牌でない雀頭）',
    make: (t) => ({
      hand: hand(
        [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
        t.s(4),
      ),
    }),
    yaku: ['pinfu'],
    han: 1,
  },
  {
    name: '平和＋断幺九',
    make: (t) => ({
      hand: hand(
        [t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)],
        t.s(8),
      ),
    }),
    yaku: ['pinfu', 'tanyao'],
    han: 2,
  },
  {
    name: '断幺九のみ（副露＝喰い下がり1翻）',
    make: (t) => ({
      hand: hand(
        [t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(8), t.s(5)],
        t.s(5),
        [{ type: 'shuntsu', tiles: [t.m(2), t.m(3), t.m(4)], open: true }],
      ),
    }),
    yaku: ['tanyao'],
    han: 1,
  },
  {
    name: '三色同順のみ（門前・嵌張で平和回避）＝門前2翻',
    make: (t) => ({
      hand: hand(
        [t.m(1), t.m(3), t.p(1), t.p(2), t.p(3), t.s(1), t.s(2), t.s(3), t.m(5), t.m(6), t.m(7), t.s(9), t.s(9)],
        t.m(2),
      ),
    }),
    yaku: ['sanshoku-doujun'],
    han: 2,
  },
  {
    name: '三色同順（副露＝喰い下がり1翻）',
    make: (t) => ({
      hand: hand(
        [t.p(1), t.p(2), t.p(3), t.s(1), t.s(2), t.s(3), t.m(5), t.m(7), t.s(9), t.s(9)],
        t.m(6),
        [{ type: 'shuntsu', tiles: [t.m(1), t.m(2), t.m(3)], open: true }],
      ),
    }),
    yaku: ['sanshoku-doujun'],
    han: 1,
  },
  {
    name: '一気通貫のみ（門前・嵌張で平和回避）＝門前2翻',
    make: (t) => ({
      hand: hand(
        [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.m(9), t.p(2), t.p(3), t.p(4), t.s(9), t.s(9)],
        t.m(8),
      ),
    }),
    yaku: ['ittsuu'],
    han: 2,
  },
  {
    name: '一盃口のみ（客風刻子で役牌回避）',
    make: (t) => ({
      hand: hand(
        [t.m(2), t.m(2), t.m(3), t.m(3), t.z('west'), t.z('west'), t.z('west'), t.z('north'), t.z('north'), t.z('north'), t.p(9), t.p(9)].concat([t.m(4)]),
        t.m(4),
      ),
    }),
    yaku: ['iipeikou'],
    han: 1,
  },
  {
    name: '二盃口＋平和（一盃口は出さない）',
    make: (t) => ({
      hand: hand(
        [t.m(2), t.m(2), t.m(3), t.m(3), t.m(4), t.m(4), t.p(5), t.p(5), t.p(6), t.p(6), t.p(7), t.s(9), t.s(9)],
        t.p(7),
      ),
    }),
    yaku: ['pinfu', 'ryanpeikou'],
    han: 4,
  },
  {
    name: '三色同刻のみ（副露で四暗刻/三暗刻回避・喰い下がりなし2翻）',
    make: (t) => ({
      hand: hand(
        [t.p(2), t.p(2), t.p(2), t.s(2), t.s(2), t.s(2), t.p(5), t.p(7), t.m(9), t.m(9)],
        t.p(6),
        [{ type: 'kotsu', tiles: [t.m(2), t.m(2), t.m(2)], open: true }],
      ),
    }),
    yaku: ['sanshoku-doukou'],
    han: 2,
  },
  {
    name: '対々和＋三暗刻（副露1で四暗刻回避・ツモ）',
    make: (t) => ({
      hand: hand(
        [t.m(9), t.m(9), t.m(9), t.p(3), t.p(3), t.p(3), t.s(5), t.s(5), t.s(5), t.p(2)],
        t.p(2),
        [{ type: 'kotsu', tiles: [t.m(1), t.m(1), t.m(1)], open: true }],
      ),
      win: ctx({ win: 'tsumo' }),
    }),
    yaku: ['sanankou', 'toitoi'],
    han: 4,
  },
  {
    name: '客風の刻子は役牌にならない（役なし）',
    make: (t) => ({
      hand: hand(
        [t.z('west'), t.z('west'), t.z('west'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(3), t.s(4), t.s(9), t.s(9)],
        t.s(5),
      ),
    }),
    yaku: [],
    han: 0,
  },
  {
    name: '自風の刻子は自風のみ（場風と区別）',
    make: (t) => ({
      hand: hand(
        [t.z('south'), t.z('south'), t.z('south'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(3), t.s(4), t.s(9), t.s(9)],
        t.s(5),
      ),
      table: tbl({ roundWind: 'east' }),
      win: ctx({ seatWind: 'south' }),
    }),
    yaku: ['yakuhai-seat'],
    han: 1,
  },
];

describe('yaku — 成立役セットの完全一致＋翻数', () => {
  it.each(EXACT)('$name', (c) => {
    const t = mk();
    const s = c.make(t);
    const expected = [...c.yaku].sort();
    const all = sets(s);
    const match = all.find((set) => set.length === expected.length && set.every((id, i) => id === expected[i]));
    expect(match, `期待セット ${JSON.stringify(expected)} に一致する解釈が無い（実際: ${JSON.stringify(all)}）`).toBeDefined();
    if (c.han !== undefined && match) {
      expect(yakuHan(match, menzenOf(s.hand))).toBe(c.han);
    }
  });
});

// ── 未テスト役の補完（複合・役満は contains で確認） ───────────

interface ContainsCase {
  name: string;
  make: (t: Mk) => Situation;
  contains: YakuId[];
  excludes?: YakuId[];
}

const CONTAINS: ContainsCase[] = [
  {
    name: '混一色（門前）',
    make: (t) => ({
      hand: hand(
        [t.m(1), t.m(2), t.m(3), t.m(1), t.m(2), t.m(3), t.m(5), t.m(5), t.m(5), t.z('west'), t.z('west'), t.m(9), t.m(9)],
        t.z('west'),
      ),
    }),
    contains: ['honitsu'],
    excludes: ['chinitsu'],
  },
  {
    name: '字一色（役満。通常役は抑制）',
    make: (t) => ({
      hand: hand(
        [t.z('hatsu'), t.z('hatsu'), t.z('hatsu'), t.z('west'), t.z('west'), t.z('west'), t.z('north'), t.z('north'), t.z('north'), t.z('east')],
        t.z('east'),
        [{ type: 'kotsu', tiles: [t.z('haku'), t.z('haku'), t.z('haku')], open: true }],
      ),
      win: ctx({ seatWind: 'south' }),
    }),
    contains: ['tsuuiisou'],
    excludes: ['toitoi', 'yakuhai-haku'],
  },
  {
    name: '三槓子（暗槓3＋順子＋雀頭）',
    make: (t) => ({
      hand: hand([t.s(2), t.s(3), t.m(5), t.m(5)], t.s(4), [
        { type: 'kantsu', tiles: [t.m(1), t.m(1), t.m(1), t.m(1)], open: false },
        { type: 'kantsu', tiles: [t.p(9), t.p(9), t.p(9), t.p(9)], open: false },
        { type: 'kantsu', tiles: [t.z('east'), t.z('east'), t.z('east'), t.z('east')], open: false },
      ]),
      table: tbl({ roundWind: 'west' }),
      win: ctx({ seatWind: 'north', win: 'tsumo' }),
    }),
    contains: ['sankantsu'],
    excludes: ['suukantsu'],
  },
  {
    name: '四槓子（暗槓4・槓の取り回し）',
    make: (t) => ({
      hand: hand([t.m(5)], t.m(5), [
        { type: 'kantsu', tiles: [t.m(1), t.m(1), t.m(1), t.m(1)], open: false },
        { type: 'kantsu', tiles: [t.p(2), t.p(2), t.p(2), t.p(2)], open: false },
        { type: 'kantsu', tiles: [t.s(3), t.s(3), t.s(3), t.s(3)], open: false },
        { type: 'kantsu', tiles: [t.z('west'), t.z('west'), t.z('west'), t.z('west')], open: false },
      ]),
    }),
    contains: ['suukantsu'],
  },
  {
    name: '九蓮宝燈（通常＝九面でない）',
    make: (t) => ({
      hand: hand(
        [t.m(1), t.m(1), t.m(1), t.m(2), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.m(8), t.m(9), t.m(9)],
        t.m(9),
      ),
    }),
    contains: ['chuuren'],
    excludes: ['chuuren-junsei', 'chinitsu'],
  },
  {
    name: '小四喜（役満）',
    make: (t) => ({
      hand: hand(
        [t.z('east'), t.z('east'), t.z('east'), t.z('south'), t.z('south'), t.z('south'), t.z('west'), t.z('west'), t.z('west'), t.m(2), t.m(3), t.m(4), t.z('north')],
        t.z('north'),
      ),
    }),
    contains: ['shousuushi'],
    excludes: ['daisuushi'],
  },
];

describe('yaku — 複合・役満（contains）', () => {
  it.each(CONTAINS)('$name', (c) => {
    const t = mk();
    const u = union(c.make(t));
    for (const id of c.contains) expect([...u]).toContain(id);
    for (const id of c.excludes ?? []) expect([...u]).not.toContain(id);
  });
});

// ── 状況役の方向ゲーティング（false-positive を止める） ─────────

describe('yaku — 状況役のゲーティング', () => {
  // 役なし門前手（リーチ等の状況役だけを観測する土台）
  const yakuless = (t: Mk): Hand =>
    hand(
      [t.z('west'), t.z('west'), t.z('west'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(3), t.s(4), t.s(9), t.s(9)],
      t.s(5),
    );

  it('リーチ単体（役なし手でも和了役になる）', () => {
    const u = union({ hand: yakuless(mk()), win: ctx({ riichi: true }) });
    expect([...u]).toContain('riichi');
  });

  it('一発はリーチと併せて成立', () => {
    const u = union({ hand: yakuless(mk()), win: ctx({ riichi: true, ippatsu: true }) });
    expect([...u]).toEqual(expect.arrayContaining(['riichi', 'ippatsu']));
  });

  it('海底はツモ限定（ロンでは付かない）', () => {
    expect([...union({ hand: yakuless(mk()), win: ctx({ haitei: true, win: 'tsumo' }) })]).toContain('haitei');
    expect([...union({ hand: yakuless(mk()), win: ctx({ haitei: true, win: 'ron' }) })]).not.toContain('haitei');
  });

  it('河底はロン限定（ツモでは付かない）', () => {
    expect([...union({ hand: yakuless(mk()), win: ctx({ houtei: true, win: 'ron' }) })]).toContain('houtei');
    expect([...union({ hand: yakuless(mk()), win: ctx({ houtei: true, win: 'tsumo' }) })]).not.toContain('houtei');
  });

  it('嶺上はツモ限定／槍槓はロン限定', () => {
    expect([...union({ hand: yakuless(mk()), win: ctx({ rinshan: true, win: 'tsumo' }) })]).toContain('rinshan');
    expect([...union({ hand: yakuless(mk()), win: ctx({ rinshan: true, win: 'ron' }) })]).not.toContain('rinshan');
    expect([...union({ hand: yakuless(mk()), win: ctx({ chankan: true, win: 'ron' }) })]).toContain('chankan');
    expect([...union({ hand: yakuless(mk()), win: ctx({ chankan: true, win: 'tsumo' }) })]).not.toContain('chankan');
  });

  it('門前清自摸和は門前ツモ限定（副露ツモでは付かない）', () => {
    const t = mk();
    const open: Hand = hand(
      [t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(8), t.s(5)],
      t.s(5),
      [{ type: 'shuntsu', tiles: [t.m(2), t.m(3), t.m(4)], open: true }],
    );
    expect([...union({ hand: open, win: ctx({ win: 'tsumo' }) })]).not.toContain('menzen-tsumo');
  });
});
