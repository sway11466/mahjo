import { parse } from './parse.ts';
import { detectYaku } from './yaku.ts';
import { getYaku } from './yaku-table.ts';
import { mk, hand, ctx, rules, tbl } from './__tests__/hands.ts';
import type { Hand, Meld, Table, WinContext, RuleSettings, YakuId } from '../types/index.ts';

function han(ids: YakuId[], menzen: boolean): number {
  let h = 0;
  for (const id of ids) {
    const y = getYaku(id);
    if (!y) continue;
    if (y.yakuman) return 1000;
    h += menzen ? y.hanClosed : (y.hanOpen ?? 0);
  }
  return h;
}

/** 全分解を判定し、最高翻（≒高点法）の解釈の役集合を返す */
function detect(
  hand: Hand,
  opts: { table?: Table; win?: WinContext; rules?: RuleSettings } = {},
): YakuId[] {
  const t = opts.table ?? tbl();
  const w = opts.win ?? ctx();
  const r = opts.rules ?? rules();
  const menzen = hand.calledMelds.every((m) => !m.open);
  const all = parse(hand).map((d) => detectYaku(d, hand, t, w, r));
  if (all.length === 0) return [];
  return all.reduce((best, cur) =>
    han(cur, menzen) > han(best, menzen) || (han(cur, menzen) === han(best, menzen) && cur.length > best.length)
      ? cur
      : best,
  );
}

describe('yaku — 役牌・状況役', () => {
  it('三元牌の刻子で役牌が付く', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.z('haku'), t.z('haku'),
      t.s(9), t.s(9),
    ];
    expect(detect(hand(concealed, t.z('haku')))).toContain('yakuhai-haku');
  });

  it('連風牌は場風と自風を両方計上する', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(2), t.p(3), t.p(4),
      t.z('east'), t.z('east'),
      t.s(9), t.s(9),
    ];
    const ids = detect(hand(concealed, t.z('east')), {
      table: tbl({ roundWind: 'east' }),
      win: ctx({ seatWind: 'east' }),
    });
    expect(ids).toEqual(expect.arrayContaining(['yakuhai-round', 'yakuhai-seat']));
  });

  it('ダブルリーチ成立時はリーチを出さない', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(3), t.p(4), t.p(5),
      t.s(6), t.s(7), t.s(5), t.s(5),
    ];
    const ids = detect(hand(concealed, t.s(8)), { win: ctx({ doubleRiichi: true }) });
    expect(ids).toContain('double-riichi');
    expect(ids).not.toContain('riichi');
  });

  it('門前ツモ＋海底を計上する', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(3), t.p(4), t.p(5),
      t.s(6), t.s(7), t.s(5), t.s(5),
    ];
    const ids = detect(hand(concealed, t.s(8)), {
      win: ctx({ win: 'tsumo', haitei: true }),
    });
    expect(ids).toEqual(expect.arrayContaining(['menzen-tsumo', 'haitei']));
  });
});

describe('yaku — 平和・断幺九・喰い下がり', () => {
  it('平和＋断幺九（門前・全順子・両面）', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(3), t.p(4),
      t.s(6), t.s(7), t.s(8),
      t.s(5), t.s(5),
    ];
    const ids = detect(hand(concealed, t.p(5)));
    expect(ids).toEqual(expect.arrayContaining(['pinfu', 'tanyao']));
  });

  it('役牌雀頭の平和は不成立', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(3), t.p(4),
      t.s(6), t.s(7), t.s(8),
      t.z('east'), t.z('east'),
    ];
    const ids = detect(hand(concealed, t.p(5)), { table: tbl({ roundWind: 'east' }) });
    expect(ids).not.toContain('pinfu');
  });

  it('喰いタンなし設定では副露の断幺九は不成立', () => {
    const t = mk();
    const called: Meld = { type: 'shuntsu', tiles: [t.m(2), t.m(3), t.m(4)], open: true };
    const concealed = [t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(8), t.s(5)];
    const h = hand(concealed, t.s(5), [called]);
    expect(detect(h, { rules: rules({ kuitan: false }) })).not.toContain('tanyao');
    expect(detect(h, { rules: rules({ kuitan: true }) })).toContain('tanyao');
  });
});

describe('yaku — 一盃口 / 二盃口', () => {
  it('一盃口（門前・同種同順2組）', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(2), t.m(3), t.m(4),
      t.p(5), t.p(6),
      t.s(7), t.s(8), t.s(9),
      t.s(5), t.s(5),
    ];
    expect(detect(hand(concealed, t.p(7)))).toContain('iipeikou');
  });

  it('二盃口成立時は一盃口を出さない', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(2), t.m(3), t.m(4),
      t.p(5), t.p(6), t.p(5), t.p(6), t.p(7),
      t.s(9), t.s(9),
    ];
    const ids = detect(hand(concealed, t.p(7)));
    expect(ids).toContain('ryanpeikou');
    expect(ids).not.toContain('iipeikou');
  });
});

describe('yaku — 三色・一気通貫・チャンタ', () => {
  it('三色同順', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4),
      t.p(2), t.p(3), t.p(4),
      t.s(2), t.s(3),
      t.m(6), t.m(7), t.m(8),
      t.s(5), t.s(5),
    ];
    expect(detect(hand(concealed, t.s(4)))).toContain('sanshoku-doujun');
  });

  it('一気通貫', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6),
      t.m(7), t.m(8),
      t.p(3), t.p(4), t.p(5),
      t.s(5), t.s(5),
    ];
    expect(detect(hand(concealed, t.m(9)))).toContain('ittsuu');
  });

  it('チャンタ（字牌を含む么九）', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(2), t.m(3),
      t.p(7), t.p(8), t.p(9),
      t.s(1), t.s(2),
      t.z('east'), t.z('east'), t.z('east'),
      t.m(9), t.m(9),
    ];
    const ids = detect(hand(concealed, t.s(3)));
    expect(ids).toContain('chanta');
    expect(ids).not.toContain('junchan');
  });

  it('ジュンチャン（字牌なしの么九）', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(2), t.m(3),
      t.m(7), t.m(8), t.m(9),
      t.p(1), t.p(2),
      t.s(7), t.s(8), t.s(9),
      t.s(1), t.s(1),
    ];
    const ids = detect(hand(concealed, t.p(3)));
    expect(ids).toContain('junchan');
    expect(ids).not.toContain('chanta');
  });
});

describe('yaku — 刻子系', () => {
  it('対々和＋三暗刻（副露1・ツモ）', () => {
    const t = mk();
    const called: Meld = { type: 'kotsu', tiles: [t.m(1), t.m(1), t.m(1)], open: true };
    const concealed = [
      t.m(9), t.m(9), t.m(9),
      t.p(3), t.p(3), t.p(3),
      t.s(5), t.s(5), t.s(5),
      t.p(2),
    ];
    const ids = detect(hand(concealed, t.p(2), [called]), { win: ctx({ win: 'tsumo' }) });
    expect(ids).toEqual(expect.arrayContaining(['toitoi', 'sanankou']));
  });

  it('ロンで完成した刻子は明刻＝三暗刻どまり（四暗刻にしない）', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(1),
      t.p(2), t.p(2), t.p(2),
      t.s(3), t.s(3), t.s(3),
      t.m(9), t.m(9),
      t.p(5), t.p(5),
    ];
    const ids = detect(hand(concealed, t.m(9)), { win: ctx({ win: 'ron' }) });
    expect(ids).toContain('sanankou');
    expect(ids).not.toContain('suuankou');
  });
});

describe('yaku — 一色・特殊形', () => {
  it('七対子', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(4), t.m(4), t.m(7), t.m(7),
      t.p(2), t.p(2), t.p(5), t.p(5), t.p(8), t.p(8),
      t.s(3),
    ];
    expect(detect(hand(concealed, t.s(3)))).toContain('chiitoitsu');
  });

  it('清一色', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6),
      t.m(7), t.m(8),
      t.m(2), t.m(3), t.m(4),
      t.m(9), t.m(9),
    ];
    expect(detect(hand(concealed, t.m(9)))).toContain('chinitsu');
  });

  it('混老頭＋対々和', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(1),
      t.m(9), t.m(9), t.m(9),
      t.p(1), t.p(1), t.p(1),
      t.z('west'), t.z('west'),
      t.s(9), t.s(9),
    ];
    const ids = detect(hand(concealed, t.z('west')), { win: ctx({ seatWind: 'south' }) });
    expect(ids).toEqual(expect.arrayContaining(['honroutou', 'toitoi']));
  });

  it('小三元', () => {
    const t = mk();
    const concealed = [
      t.z('haku'), t.z('haku'), t.z('haku'),
      t.z('hatsu'), t.z('hatsu'), t.z('hatsu'),
      t.m(2), t.m(3), t.m(4),
      t.z('chun'),
    ];
    const called: Meld = { type: 'shuntsu', tiles: [t.p(5), t.p(6), t.p(7)], open: true };
    expect(detect(hand(concealed, t.z('chun'), [called]))).toContain('shousangen');
  });
});

describe('yaku — 役満', () => {
  it('国士無双（単騎は kokushi）', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(9), t.p(1), t.p(9), t.s(1), t.s(9),
      t.z('east'), t.z('south'), t.z('west'), t.z('north'), t.z('haku'), t.z('hatsu'),
    ];
    expect(detect(hand(concealed, t.z('chun')))).toContain('kokushi');
  });

  it('国士無双十三面（13種そろい）', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(9), t.p(1), t.p(9), t.s(1), t.s(9),
      t.z('east'), t.z('south'), t.z('west'), t.z('north'),
      t.z('haku'), t.z('hatsu'), t.z('chun'),
    ];
    expect(detect(hand(concealed, t.m(1)))).toContain('kokushi-13');
  });

  it('四暗刻（ツモ）は通常役を抑えて役満のみ', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(1),
      t.p(2), t.p(2), t.p(2),
      t.s(3), t.s(3), t.s(3),
      t.m(9), t.m(9),
      t.p(5), t.p(5),
    ];
    const ids = detect(hand(concealed, t.m(9)), { win: ctx({ win: 'tsumo' }) });
    expect(ids).toContain('suuankou');
    expect(ids).not.toContain('toitoi');
  });

  it('四暗刻単騎', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(1),
      t.p(2), t.p(2), t.p(2),
      t.s(3), t.s(3), t.s(3),
      t.m(9), t.m(9), t.m(9),
      t.p(5),
    ];
    const ids = detect(hand(concealed, t.p(5)));
    expect(ids).toContain('suuankou-tanki');
    expect(ids).not.toContain('suuankou');
  });

  it('大三元は役牌を抑えて役満のみ', () => {
    const t = mk();
    const concealed = [
      t.z('haku'), t.z('haku'), t.z('haku'),
      t.z('hatsu'), t.z('hatsu'), t.z('hatsu'),
      t.z('chun'), t.z('chun'), t.z('chun'),
      t.m(2), t.m(3),
      t.s(9), t.s(9),
    ];
    const ids = detect(hand(concealed, t.m(4)));
    expect(ids).toContain('daisangen');
    expect(ids).not.toContain('yakuhai-haku');
  });

  it('清老頭', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(1),
      t.m(9), t.m(9), t.m(9),
      t.p(1), t.p(1), t.p(1),
      t.s(9), t.s(9),
      t.p(9), t.p(9),
    ];
    expect(detect(hand(concealed, t.p(9)))).toContain('chinroutou');
  });

  it('緑一色', () => {
    const t = mk();
    const concealed = [
      t.s(2), t.s(3), t.s(4),
      t.s(2), t.s(3), t.s(4),
      t.s(6), t.s(6), t.s(6),
      t.s(8),
    ];
    const called: Meld = { type: 'kotsu', tiles: [t.z('hatsu'), t.z('hatsu'), t.z('hatsu')], open: true };
    expect(detect(hand(concealed, t.s(8), [called]))).toContain('ryuuiisou');
  });

  it('純正九蓮宝燈（九面待ち）', () => {
    const t = mk();
    const concealed = [
      t.m(1), t.m(1), t.m(1),
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.m(8),
      t.m(9), t.m(9), t.m(9),
    ];
    expect(detect(hand(concealed, t.m(5)))).toContain('chuuren-junsei');
  });

  it('大四喜', () => {
    const t = mk();
    const concealed = [
      t.z('east'), t.z('east'), t.z('east'),
      t.z('south'), t.z('south'), t.z('south'),
      t.z('west'), t.z('west'), t.z('west'),
      t.z('north'), t.z('north'),
      t.m(5), t.m(5),
    ];
    const ids = detect(hand(concealed, t.z('north')));
    expect(ids).toContain('daisuushi');
    expect(ids).not.toContain('shousuushi');
  });
});

describe('yaku — enabledYaku フィルタ', () => {
  it('オフにした役は判定結果から除外される', () => {
    const t = mk();
    const concealed = [
      t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7),
      t.p(3), t.p(4),
      t.s(6), t.s(7), t.s(8),
      t.s(5), t.s(5),
    ];
    const ids = detect(hand(concealed, t.p(5)), {
      rules: rules({ enabledYaku: { tanyao: false } }),
    });
    expect(ids).not.toContain('tanyao');
    expect(ids).toContain('pinfu');
  });
});
