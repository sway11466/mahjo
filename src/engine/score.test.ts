import { summarize } from './score.ts';
import { suited, honorTile } from './tiles.ts';
import { mk, hand, ctx, rules, tbl } from './__tests__/hands.ts';
import type { Tile } from '../types/index.ts';

describe('summarize — 役と翻', () => {
  it('平和のみ（門前ロン）＝1翻・ドラなし、付帯情報も載る', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    const s = summarize(h, tbl(), ctx({ seatWind: 'south', win: 'ron' }), rules());
    expect(s.yaku).toEqual(['pinfu']);
    expect(s.han).toBe(1);
    expect(s.doraHan).toBe(0);
    expect(s.menzen).toBe(true);
    expect(s.win).toBe('ron');
    expect(s.isDealer).toBe(false);
  });

  it('isDealer は自風=東で true、win も素通し', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    const s = summarize(h, tbl(), ctx({ seatWind: 'east', win: 'tsumo' }), rules());
    expect(s.isDealer).toBe(true);
    expect(s.win).toBe('tsumo');
  });
});

describe('summarize — 喰い下がり', () => {
  // 三色同順：門前2翻 / 副露1翻
  const sanshoku = (called: boolean) => {
    const t = mk();
    if (called) {
      return summarize(
        hand(
          [t.p(1), t.p(2), t.p(3), t.s(1), t.s(2), t.s(3), t.m(5), t.m(7), t.s(9), t.s(9)],
          t.m(6),
          [{ type: 'shuntsu', tiles: [t.m(1), t.m(2), t.m(3)], open: true }],
        ),
        tbl(),
        ctx(),
        rules(),
      );
    }
    return summarize(
      hand(
        [t.m(1), t.m(3), t.p(1), t.p(2), t.p(3), t.s(1), t.s(2), t.s(3), t.m(5), t.m(6), t.m(7), t.s(9), t.s(9)],
        t.m(2),
      ),
      tbl(),
      ctx(),
      rules(),
    );
  };

  it('門前は2翻', () => {
    const s = sanshoku(false);
    expect(s.yaku).toEqual(['sanshoku-doujun']);
    expect(s.han).toBe(2);
  });

  it('副露すると1翻に下がる', () => {
    const s = sanshoku(true);
    expect(s.yaku).toEqual(['sanshoku-doujun']);
    expect(s.han).toBe(1);
    expect(s.menzen).toBe(false);
  });
});

describe('summarize — 高点法（翻最大の解釈を採用）', () => {
  it('七対子解釈(9)より 平和＋二盃口＋断幺九＋清一色(11) を採る', () => {
    const t = mk();
    // 22334455667788p：七対子にも二盃口にも取れる清一色。8p 上がり
    const h = hand(
      [t.p(2), t.p(2), t.p(3), t.p(3), t.p(4), t.p(4), t.p(5), t.p(5), t.p(6), t.p(6), t.p(7), t.p(7), t.p(8)],
      t.p(8),
    );
    const s = summarize(h, tbl(), ctx(), rules());
    expect(s.han).toBe(11); // pinfu1 + ryanpeikou3 + tanyao1 + chinitsu6
    expect(s.yaku).toEqual(expect.arrayContaining(['pinfu', 'ryanpeikou', 'tanyao', 'chinitsu']));
    expect(s.yaku).not.toContain('chiitoitsu'); // 七対子解釈(9翻)は採られない
    expect(s.yaku).not.toContain('iipeikou');
  });
});

describe('summarize — ドラ', () => {
  it('赤ドラが翻に乗る（doraHan に計上し han に含む）', () => {
    const t = mk();
    const base = t.p(5);
    const red5p: Tile = base.kind === 'suited' ? { ...base, red: true } : base;
    // 234m 567m 3(赤5)4p... 平和＋断幺九＋赤1
    const h = hand(
      [t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), red5p, t.s(6), t.s(7), t.s(5), t.s(5)],
      t.s(8),
    );
    const s = summarize(h, tbl(), ctx(), rules());
    expect(s.doraHan).toBe(1);
    expect(s.han).toBe(3); // pinfu1 + tanyao1 + 赤ドラ1
  });

  it('ドラ表示牌の次がドラ（3m→4m）', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    const s = summarize(h, tbl({ doraIndicators: [suited('man', 3)] }), ctx(), rules());
    expect(s.doraHan).toBe(1); // 手に 4m が1枚
    expect(s.han).toBe(2); // pinfu1 + ドラ1
  });

  it('数牌のドラは循環する（9m表示→1m がドラ）', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    const s = summarize(h, tbl({ doraIndicators: [suited('man', 9)] }), ctx(), rules());
    expect(s.doraHan).toBe(1); // 手に 1m が1枚
  });

  it('三元牌のドラも循環する（中表示→白がドラ）＋複数枚計上', () => {
    const t = mk();
    // 白刻子（＝白3枚）。中表示で白がドラ → ドラ3
    const h = hand(
      [t.z('haku'), t.z('haku'), t.z('haku'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(9), t.s(9)],
      t.s(4),
    );
    const s = summarize(h, tbl({ doraIndicators: [honorTile('chun')] }), ctx(), rules());
    expect(s.doraHan).toBe(3);
    expect(s.han).toBe(4); // yakuhai-haku 1 + ドラ3
  });

  it('裏ドラはリーチ和了時のみ計上する', () => {
    const t = mk();
    const make = () =>
      hand(
        [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
        t.s(4),
      );
    const table = tbl({ uraDoraIndicators: [suited('man', 3)] }); // 裏ドラ＝4m
    expect(summarize(make(), table, ctx({ riichi: false }), rules()).doraHan).toBe(0);
    expect(summarize(make(), table, ctx({ riichi: true }), rules()).doraHan).toBe(1);
  });

  // bug-4 回帰：ダブルリーチはリーチと排他表現（double 成立時 riichi は立てない＝scoring-rules
  // §1.1）だが、リーチ状態には変わりないので裏ドラは同様に計上する。
  it('裏ドラはダブルリーチ和了でも計上する（riichi と排他表現でも）', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.p(7), t.p(8), t.p(9), t.s(2), t.s(3), t.s(5), t.s(5)],
      t.s(4),
    );
    const table = tbl({ uraDoraIndicators: [suited('man', 3)] }); // 裏ドラ＝4m
    const s = summarize(h, table, ctx({ doubleRiichi: true }), rules());
    expect(s.yaku).toContain('double-riichi');
    expect(s.doraHan).toBe(1);
  });
});

import { score, scorePoints } from './score.ts';
import type { RuleSettings } from '../types/index.ts';

describe('score — 点数・配分・満貫境界（scorePoints）', () => {
  const r = (o: Partial<RuleSettings> = {}) => rules(o);
  it.each<[string, number, number, boolean, 'tsumo' | 'ron', Partial<RuleSettings>, number, string]>([
    ['3翻40符 子ロン', 3, 40, false, 'ron', {}, 5200, 'normal'],
    ['3翻70符は満貫', 3, 70, false, 'ron', {}, 8000, 'mangan'],
    ['4翻40符は満貫', 4, 40, false, 'ron', {}, 8000, 'mangan'],
    ['4翻30符 子ロン（切り上げ無）', 4, 30, false, 'ron', {}, 7700, 'normal'],
    ['4翻30符 親ロン（切り上げ無）', 4, 30, true, 'ron', {}, 11600, 'normal'],
    ['4翻30符 切り上げ満貫オン', 4, 30, false, 'ron', { kiriageMangan: true }, 8000, 'mangan'],
    // 3翻60符（基本点 60×2^5=1920）：切り上げ無しは通常計算（子 7680→7700／親 11520→11600）、
    // 切り上げ満貫オンで満貫（testing-scoring-rule §4 は 4翻30符・3翻60符の両方を要求）
    ['3翻60符 子ロン（切り上げ無）', 3, 60, false, 'ron', {}, 7700, 'normal'],
    ['3翻60符 親ロン（切り上げ無）', 3, 60, true, 'ron', {}, 11600, 'normal'],
    ['3翻60符 切り上げ満貫オン', 3, 60, false, 'ron', { kiriageMangan: true }, 8000, 'mangan'],
    ['5翻は満貫', 5, 30, false, 'ron', {}, 8000, 'mangan'],
    ['6翻は跳満', 6, 30, false, 'ron', {}, 12000, 'haneman'],
    ['7翻は跳満（区分の上端）', 7, 30, false, 'ron', {}, 12000, 'haneman'],
    ['8翻は倍満', 8, 30, false, 'ron', {}, 16000, 'baiman'],
    ['10翻は倍満（区分の上端）', 10, 30, false, 'ron', {}, 16000, 'baiman'],
    ['11翻は三倍満', 11, 30, false, 'ron', {}, 24000, 'sanbaiman'],
    ['12翻は三倍満（区分の上端）', 12, 30, false, 'ron', {}, 24000, 'sanbaiman'],
    // 親の固定値（子の1.5倍＝scoring-rules §3.1 の親列）
    ['6翻 親ロンは跳満18000', 6, 30, true, 'ron', {}, 18000, 'haneman'],
    ['8翻 親ロンは倍満24000', 8, 30, true, 'ron', {}, 24000, 'baiman'],
    ['11翻 親ロンは三倍満36000', 11, 30, true, 'ron', {}, 36000, 'sanbaiman'],
    ['13翻 数え役満オフは三倍満', 13, 30, false, 'ron', {}, 24000, 'sanbaiman'],
    ['13翻 数え役満オンは役満', 13, 30, false, 'ron', { kazoeYakuman: true }, 32000, 'kazoe-yakuman'],
  ])('%s', (_n, han, fu, dealer, win, over, total, rank) => {
    const s = scorePoints(han, fu, dealer, win, r(over));
    expect(s.payments.total).toBe(total);
    expect(s.rank).toBe(rank);
  });

  it('子ツモの配分（4翻30符＝2000/3900）', () => {
    const s = scorePoints(4, 30, false, 'tsumo', rules());
    expect(s.payments).toMatchObject({ fromNonDealer: 2000, fromDealer: 3900, total: 7900 });
    expect(s.scoreText).toBe('子ツモ 2000/3900');
  });

  it('親ツモの配分（満貫＝4000オール）', () => {
    const s = scorePoints(5, 30, true, 'tsumo', rules());
    expect(s.payments).toMatchObject({ fromEach: 4000, total: 12000 });
    expect(s.scoreText).toBe('親ツモ 4000オール');
  });

  it('親ツモの配分（非満貫）は各支払いを100点切り上げ（3翻30符＝1920→2000オール）', () => {
    // 基本点 a=30×2^5=960、親ツモは子全員から a×2=1920 → 100点切り上げで 2000オール
    const s = scorePoints(3, 30, true, 'tsumo', rules());
    expect(s.payments).toMatchObject({ fromEach: 2000, total: 6000 });
    expect(s.scoreText).toBe('親ツモ 2000オール');
  });

  it('跳満以上のツモ配分：子倍満は4000/8000、親跳満は6000オール', () => {
    // 固定値の配分（scoring-rules §3.1）：子＝総計の 1/4 と 1/2、親＝総計の 1/3 オール
    const baiman = scorePoints(8, 30, false, 'tsumo', rules());
    expect(baiman.payments).toMatchObject({ fromNonDealer: 4000, fromDealer: 8000, total: 16000 });
    expect(baiman.scoreText).toBe('子ツモ 4000/8000');
    const haneman = scorePoints(6, 30, true, 'tsumo', rules());
    expect(haneman.payments).toMatchObject({ fromEach: 6000, total: 18000 });
    expect(haneman.scoreText).toBe('親ツモ 6000オール');
  });

  it('子ロンの文言（5200点）', () => {
    expect(scorePoints(3, 40, false, 'ron', rules()).scoreText).toBe('子ロン 5200点');
  });
});

describe('score — ScoreResult 完全形', () => {
  it('平和＋断幺九＋ドラ1 子ロン＝3翻30符 3900点、内訳に役/符/ドラ', () => {
    const t = mk();
    const h = hand(
      [t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)],
      t.s(8),
    );
    const res = score(h, tbl({ doraIndicators: [suited('pin', 2)] }), ctx({ win: 'ron' }), rules());
    expect(res.hasYaku).toBe(true);
    expect(res.yakuman).toBe(false);
    expect(res.totalHan).toBe(3); // pinfu + tanyao + dora1
    expect(res.totalFu).toBe(30); // 平和ロン
    expect(res.rank).toBe('normal');
    expect(res.payments.ron).toBe(3900);
    expect(res.items.some((i) => i.category === 'yaku' && i.label === '平和（ピンフ）')).toBe(true);
    expect(res.items.some((i) => i.category === 'fu')).toBe(true);
    expect(res.items.some((i) => i.category === 'dora' && i.value === 1)).toBe(true);
    // 役項目もハイライト対象を持つ（平和＝手牌全体）
    expect(res.items.find((i) => i.label === '平和（ピンフ）')!.highlightTargets.length).toBeGreaterThan(0);
    // 解説順は 役（翻）→ ドラ（翻）→ 符（screens.md §3）。符はすべて翻の要素より後ろに来る。
    const cats = res.items.map((i) => i.category);
    expect(cats.lastIndexOf('dora')).toBeLessThan(cats.indexOf('fu')); // ドラは符より前
    expect(cats.indexOf('fu')).toBeGreaterThan(cats.lastIndexOf('yaku')); // 符は役より後
  });

  it('役なしの手は hasYaku=false', () => {
    const t = mk();
    const h = hand(
      [t.z('west'), t.z('west'), t.z('west'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(3), t.s(4), t.s(9), t.s(9)],
      t.s(5),
    );
    const res = score(h, tbl(), ctx({ win: 'ron' }), rules());
    expect(res.hasYaku).toBe(false);
    expect(res.payments.total).toBe(0);
  });
});

describe('score — 役満', () => {
  it('四暗刻（子ツモ）＝役満 32000、内訳は役満のみ', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(1), t.m(1), t.p(2), t.p(2), t.p(2), t.s(3), t.s(3), t.s(3), t.m(9), t.m(9), t.p(5), t.p(5)],
      t.m(9),
    );
    const res = score(h, tbl(), ctx({ win: 'tsumo', seatWind: 'south' }), rules());
    expect(res.yakuman).toBe(true);
    expect(res.rank).toBe('yakuman');
    expect(res.payments.total).toBe(32000);
    expect(res.items.some((i) => i.label === '四暗刻（スーアンコー）')).toBe(true);
    expect(res.items.some((i) => i.category === 'dora')).toBe(false); // 役満はドラを点に乗せない
  });

  it('ダブル役満トグル：四暗刻単騎はオフ32000・オン64000', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(1), t.m(1), t.p(2), t.p(2), t.p(2), t.s(3), t.s(3), t.s(3), t.m(9), t.m(9), t.m(9), t.p(5)],
      t.p(5),
    );
    expect(score(h, tbl(), ctx({ win: 'ron' }), rules({ doubleYakuman: false })).payments.total).toBe(32000);
    expect(score(h, tbl(), ctx({ win: 'ron' }), rules({ doubleYakuman: true })).payments.total).toBe(64000);
  });

  it('親の役満は48000（四暗刻 親ツモ＝16000オール）', () => {
    const t = mk();
    const h = hand(
      [t.m(1), t.m(1), t.m(1), t.p(2), t.p(2), t.p(2), t.s(3), t.s(3), t.s(3), t.m(9), t.m(9), t.p(5), t.p(5)],
      t.m(9),
    );
    const res = score(h, tbl(), ctx({ win: 'tsumo', seatWind: 'east' }), rules());
    expect(res.rank).toBe('yakuman');
    expect(res.payments).toMatchObject({ fromEach: 16000, total: 48000 });
    expect(res.scoreText).toBe('親ツモ 16000オール');
  });

  it('ダブル役満トグル：国士無双十三面はオフ32000・オン64000', () => {
    const make = () => {
      const t = mk();
      return hand(
        [
          t.m(1), t.m(9), t.p(1), t.p(9), t.s(1), t.s(9),
          t.z('east'), t.z('south'), t.z('west'), t.z('north'),
          t.z('haku'), t.z('hatsu'), t.z('chun'),
        ],
        t.m(1), // 13種そろい＝十三面待ち
      );
    };
    expect(score(make(), tbl(), ctx(), rules({ doubleYakuman: false })).payments.total).toBe(32000);
    expect(score(make(), tbl(), ctx(), rules({ doubleYakuman: true })).payments.total).toBe(64000);
  });

  it('ダブル役満トグル：大四喜はオフ32000・オン64000', () => {
    // 北をポン（副露）にして四暗刻と複合させない＝トグル差分を大四喜単独で見る
    const make = () => {
      const t = mk();
      return hand(
        [t.z('east'), t.z('east'), t.z('east'), t.z('south'), t.z('south'), t.z('south'), t.z('west'), t.z('west'), t.z('west'), t.m(5)],
        t.m(5),
        [{ type: 'kotsu', tiles: [t.z('north'), t.z('north'), t.z('north')], open: true }],
      );
    };
    expect(score(make(), tbl(), ctx({ win: 'ron' }), rules({ doubleYakuman: false })).payments.total).toBe(32000);
    expect(score(make(), tbl(), ctx({ win: 'ron' }), rules({ doubleYakuman: true })).payments.total).toBe(64000);
  });
});
