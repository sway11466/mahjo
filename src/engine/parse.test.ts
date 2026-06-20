import { parse } from './parse.ts';
import { tileKind } from './tiles.ts';
import { mk, hand } from './__tests__/hands.ts';
import type { Tile, Meld, Decomposition } from '../types/index.ts';

/** 標準形（特殊形でない）の解釈だけ抜き出す */
function standard(ds: Decomposition[]): Decomposition[] {
  return ds.filter((d) => !d.specialForm);
}

/** 全 melds に winningTile.id がちょうど1枚含まれるか */
function containsWinning(d: Decomposition, winId: number): boolean {
  const ids = d.melds.flatMap((m) => m.tiles.map((t) => t.id));
  return ids.filter((id) => id === winId).length === 1;
}

describe('parse — 標準形の構造', () => {
  it('単一解釈は 4面子1雀頭（5要素・雀頭1つ）を返す', () => {
    const t = mk();
    // 234m 567m 234p 99s ＋ 45s で 6s 待ち（両面）
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.s(4), t.s(5),
      t.s(9), t.s(9),
    ];
    const win = t.s(6);
    const ds = parse(hand(concealed, win));
    expect(ds).toHaveLength(1);
    const d = ds[0]!;
    expect(d.melds).toHaveLength(5);
    expect(d.melds.filter((m) => m.type === 'pair')).toHaveLength(1);
    expect(d.wait).toBe('ryanmen');
    expect(containsWinning(d, win.id)).toBe(true);
  });

  it.each([
    ['ryanmen', (t: ReturnType<typeof mk>) => ({ wait: [t.s(4), t.s(5)] as Tile[], win: t.s(6) })],
    ['kanchan', (t: ReturnType<typeof mk>) => ({ wait: [t.s(4), t.s(6)] as Tile[], win: t.s(5) })],
    ['penchan', (t: ReturnType<typeof mk>) => ({ wait: [t.s(1), t.s(2)] as Tile[], win: t.s(3) })],
  ])('順子の待ちを判定する: %s', (expected, makeWait) => {
    const t = mk();
    const { wait, win } = makeWait(t);
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.p(9), t.p(9),
      ...wait,
    ];
    const ds = parse(hand(concealed, win));
    expect(ds).toHaveLength(1);
    expect(ds[0]!.wait).toBe(expected);
  });

  it('シャンポン待ち（ロンで刻子完成）を判定する', () => {
    const t = mk();
    // 234m 567m 234p ＋ 55s 99s のシャンポン、9s で 999s 完成
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.s(5), t.s(5),
      t.s(9), t.s(9),
    ];
    const win = t.s(9);
    const ds = parse(hand(concealed, win));
    expect(ds).toHaveLength(1);
    expect(ds[0]!.wait).toBe('shanpon');
  });

  it('単騎待ち（雀頭完成）を判定する', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.s(4), t.s(5), t.s(6),
      t.s(9),
    ];
    const win = t.s(9);
    const ds = parse(hand(concealed, win));
    expect(ds).toHaveLength(1);
    expect(ds[0]!.wait).toBe('tanki');
  });
});

describe('parse — 高点法（複数解釈の列挙）', () => {
  it('222333444m は順子3組と刻子3組の両解釈を出す', () => {
    const t = mk();
    // 222333444m 567p 99s、上がり 4m
    const concealed = [
      t.m(2), t.m(2), t.m(2),
      t.m(3), t.m(3), t.m(3),
      t.m(4), t.m(4),
      t.p(5), t.p(6), t.p(7),
      t.s(9), t.s(9),
    ];
    const win = t.m(4);
    const ds = standard(parse(hand(concealed, win)));
    expect(ds).toHaveLength(2);
    expect(new Set(ds.map((d) => d.wait))).toEqual(new Set(['ryanmen', 'shanpon']));
  });
});

describe('parse — 特殊形', () => {
  it('純粋な七対子は chiitoitsu のみを返す', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(4), t.m(4), t.m(7), t.m(7),
      t.p(1), t.p(1), t.p(4), t.p(4), t.p(7), t.p(7),
      t.z('east'),
    ];
    const win = t.z('east');
    const ds = parse(hand(concealed, win));
    expect(ds).toHaveLength(1);
    expect(ds[0]!.specialForm).toBe('chiitoitsu');
    expect(ds[0]!.specialTiles).toHaveLength(14);
  });

  it('二盃口にもなる手は七対子と標準形を両方出す', () => {
    const t = mk();
    // 22334455667788p、上がり 8p
    const concealed = [
      t.p(2), t.p(2), t.p(3), t.p(3), t.p(4), t.p(4),
      t.p(5), t.p(5), t.p(6), t.p(6), t.p(7), t.p(7),
      t.p(8),
    ];
    const win = t.p(8);
    const ds = parse(hand(concealed, win));
    expect(ds.some((d) => d.specialForm === 'chiitoitsu')).toBe(true);
    expect(standard(ds).some((d) => d.melds.length === 5)).toBe(true);
  });

  it('国士無双を kokushi として返す', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(9), t.p(1), t.p(9), t.s(1), t.s(9),
      t.z('east'), t.z('south'), t.z('west'), t.z('north'),
      t.z('haku'), t.z('hatsu'), t.z('chun'),
    ];
    const win = t.m(1);
    const ds = parse(hand(concealed, win));
    expect(ds).toHaveLength(1);
    expect(ds[0]!.specialForm).toBe('kokushi');
  });
});

describe('parse — 副露あり', () => {
  it('副露1組のとき concealed から3面子＋雀頭を作る', () => {
    const t = mk();
    const called: Meld = {
      type: 'kotsu',
      tiles: [t.z('east'), t.z('east'), t.z('east')],
      open: true,
    };
    // 残り concealed：234m 567m 234p ＋ 9s 単騎、9s で和了
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.s(9),
    ];
    const win = t.s(9);
    const ds = parse(hand(concealed, win, [called]));
    expect(ds).toHaveLength(1);
    const d = ds[0]!;
    expect(d.melds).toHaveLength(5);
    expect(d.melds.filter((m) => m.open)).toHaveLength(1);
    expect(d.wait).toBe('tanki');
  });
});

describe('parse — 不成立', () => {
  it('和了形でない手は空配列を返す', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(2), t.m(3),
      t.m(4), t.m(5), t.m(6),
      t.m(7), t.m(8), t.m(9),
      t.p(1), t.p(2),
      t.s(3), t.s(5),
    ];
    const win = t.p(9); // 123/456/789m は揃うが残り 1p2p3s5s9p が1面子1雀頭にならない
    expect(parse(hand(concealed, win))).toHaveLength(0);
  });
});

describe('parse — winningTile の配置', () => {
  it('完成させた面子に winningTile の物理 id が入る（明刻判定の前提）', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.s(5), t.s(5),
      t.s(9), t.s(9),
    ];
    const win = t.s(9); // シャンポンで 999s を完成
    const d = parse(hand(concealed, win))[0]!;
    const winMeld = d.melds.find((m) => m.tiles.some((x) => x.id === win.id))!;
    expect(winMeld.type).toBe('kotsu');
    expect(winMeld.tiles.map((x) => tileKind(x))).toEqual([
      tileKind(win),
      tileKind(win),
      tileKind(win),
    ]);
  });
});
