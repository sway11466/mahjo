import { score } from './score.ts';
import { mk, hand, ctx, tbl, rules } from './__tests__/hands.ts';
import { suited, honorTile } from './tiles.ts';
import type { Mk } from './__tests__/hands.ts';
import type { ScoreResult } from '../types/index.ts';

/**
 * 採点の実手エンドツーエンド回帰スイート（testing-scoring-rule.md）。
 * Hand＋Table＋WinContext＋RuleSettings → score() の {totalHan, totalFu, rank, payments, scoreText}
 * を手計算値で固定する。値の根拠は各ケースのコメント（a = fu × 2^(2+han)）。
 */
interface Case {
  name: string;
  make: (t: Mk) => Parameters<typeof score>;
  totalHan: number;
  totalFu: number;
  rank: ScoreResult['rank'];
  total: number;
  scoreText: string;
}

const CASES: Case[] = [
  {
    // 平和+断幺九+門前ツモ＝3翻。平和ツモ20符固定。a=20*2^5=640。子ツモ 700/1300（=640,1280 切上）
    name: '平和・断幺九・門前ツモ（子）3翻20符',
    make: (t) => [
      hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)], t.s(8)),
      tbl(),
      ctx({ win: 'tsumo', seatWind: 'south' }),
      rules(),
    ],
    totalHan: 3,
    totalFu: 20,
    rank: 'normal',
    total: 2700,
    scoreText: '子ツモ 700/1300',
  },
  {
    // 役牌(白)門前ロン＝1翻。副底20+門前ロン10+白明刻(字=么九,明刻4)=34→40符。a=40*8=320。子ロン 320*4=1280→1300
    name: '役牌 白・門前ロン（子）1翻40符',
    make: (t) => [
      hand([t.z('haku'), t.z('haku'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(4), t.s(9), t.s(9)], t.z('haku')),
      tbl(),
      ctx({ win: 'ron', seatWind: 'south' }),
      rules(),
    ],
    totalHan: 1,
    totalFu: 40,
    rank: 'normal',
    total: 1300,
    scoreText: '子ロン 1300点',
  },
  {
    // 七対子+立直+門前ツモ＝4翻25符固定。a=25*2^6=1600。子ツモ 1600/3200
    name: '七対子・立直・門前ツモ（子）4翻25符',
    make: (t) => [
      hand([t.m(1), t.m(1), t.m(4), t.m(4), t.m(7), t.m(7), t.p(1), t.p(1), t.p(4), t.p(4), t.p(7), t.p(7), t.z('east')], t.z('east')),
      tbl(),
      ctx({ win: 'tsumo', seatWind: 'south', riichi: true }),
      rules(),
    ],
    totalHan: 4,
    totalFu: 25,
    rank: 'normal',
    total: 6400,
    scoreText: '子ツモ 1600/3200',
  },
  {
    // 立直+一発+門前ツモ+平和+断幺九＝5翻→満貫。子ツモ 2000/4000
    name: '立直・一発・ツモ・平和・断幺九（子）5翻＝満貫',
    make: (t) => [
      hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), t.p(5), t.s(6), t.s(7), t.s(5), t.s(5)], t.s(8)),
      tbl(),
      ctx({ win: 'tsumo', seatWind: 'south', riichi: true, ippatsu: true }),
      rules(),
    ],
    totalHan: 5,
    totalFu: 20,
    rank: 'mangan',
    total: 8000,
    scoreText: '子ツモ 2000/4000',
  },
  {
    // 役牌(中)親ロン＝1翻40符。a=320。親ロン 320*6=1920→2000
    name: '役牌 中・親ロン 1翻40符',
    make: (t) => [
      hand([t.z('chun'), t.z('chun'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(4), t.s(9), t.s(9)], t.z('chun')),
      tbl({ roundWind: 'east' }),
      ctx({ win: 'ron', seatWind: 'east' }),
      rules(),
    ],
    totalHan: 1,
    totalFu: 40,
    rank: 'normal',
    total: 2000,
    scoreText: '親ロン 2000点',
  },
  {
    // 立直＋暗槓（中張5p）門前ロン＝1翻。副底20+門前ロン10+単騎2+暗槓中張16=48→50符。a=50*8=400。子ロン 1600
    name: '立直・中張の暗槓・単騎ロン（子）1翻50符',
    make: (t) => [
      hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.s(6), t.s(7), t.s(8), t.s(9)], t.s(9), [
        { type: 'kantsu', tiles: [t.p(5), t.p(5), t.p(5), t.p(5)], open: false },
      ]),
      tbl(),
      ctx({ win: 'ron', seatWind: 'south', riichi: true }),
      rules(),
    ],
    totalHan: 1,
    totalFu: 50,
    rank: 'normal',
    total: 1600,
    scoreText: '子ロン 1600点',
  },
];

describe('score — 実手エンドツーエンド回帰', () => {
  it.each(CASES)('$name', (c) => {
    const res = score(...c.make(mk()));
    expect(res.hasYaku).toBe(true);
    expect(res.totalHan).toBe(c.totalHan);
    expect(res.totalFu).toBe(c.totalFu);
    expect(res.rank).toBe(c.rank);
    expect(res.payments.total).toBe(c.total);
    expect(res.scoreText).toBe(c.scoreText);
  });
});

describe('score — 高点法（最終点数が最大の解釈）', () => {
  it('222333444m ツモは順子解釈(平和一盃口ツモ3翻20符)でなく刻子解釈(三暗刻3翻40符)を採る', () => {
    const t = mk();
    const h = hand(
      [t.m(2), t.m(2), t.m(2), t.m(3), t.m(3), t.m(3), t.m(4), t.m(4), t.p(5), t.p(6), t.p(7), t.s(9), t.s(9)],
      t.m(4),
    );
    const res = score(h, tbl(), ctx({ win: 'tsumo', seatWind: 'south' }), rules());
    // 刻子解釈：三暗刻＋門前ツモ＝3翻40符 → 子ツモ 1300/2600＝5200（順子解釈は20符2700なので負ける）
    expect(res.totalFu).toBe(40);
    expect(res.payments.total).toBe(5200);
    expect(res.items.some((i) => i.label === '三暗刻（サンアンコー）')).toBe(true);
  });
});

describe('score — カンドラが点数に乗る', () => {
  it('暗槓5p×4＝ドラ5pで4ドラ。立直1＋ドラ4＝5翻→満貫', () => {
    const t = mk();
    const h = hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.s(6), t.s(7), t.s(8), t.s(9)], t.s(9), [
      { type: 'kantsu', tiles: [t.p(5), t.p(5), t.p(5), t.p(5)], open: false },
    ]);
    const res = score(h, tbl({ doraIndicators: [suited('pin', 4)] }), ctx({ win: 'ron', seatWind: 'south', riichi: true }), rules());
    expect(res.items.find((i) => i.id === 'dora')?.value).toBe(4);
    expect(res.totalHan).toBe(5); // 立直1 + ドラ4
    expect(res.rank).toBe('mangan');
    expect(res.payments.total).toBe(8000);
  });
});

describe('score — 赤ドラ・裏ドラの内訳項目', () => {
  it('赤5pを含む手は aka 項目が出る', () => {
    const t = mk();
    const base = t.p(5);
    const red5p = base.kind === 'suited' ? { ...base, red: true } : base;
    const h = hand([t.m(2), t.m(3), t.m(4), t.m(5), t.m(6), t.m(7), t.p(3), t.p(4), red5p, t.s(6), t.s(7), t.s(5), t.s(5)], t.s(8));
    const res = score(h, tbl(), ctx({ win: 'ron', seatWind: 'south' }), rules());
    expect(res.items.find((i) => i.id === 'aka')?.value).toBe(1);
  });

  it('立直＋裏ドラ表示牌で ura 項目が出る（非リーチでは出ない）', () => {
    const t = mk();
    // 七対子。裏ドラ表示牌 東 → 裏ドラ 南。手の南対子で裏2
    const make = () =>
      hand([t.m(1), t.m(1), t.m(4), t.m(4), t.m(7), t.m(7), t.p(1), t.p(1), t.p(4), t.p(4), t.p(7), t.p(7), t.z('south')], t.z('south'));
    const table = tbl({ uraDoraIndicators: [honorTile('east')] });
    const noRiichi = score(make(), table, ctx({ win: 'tsumo', seatWind: 'south', riichi: false }), rules());
    const riichi = score(make(), table, ctx({ win: 'tsumo', seatWind: 'south', riichi: true }), rules());
    expect(noRiichi.items.some((i) => i.id === 'ura')).toBe(false);
    expect(riichi.items.find((i) => i.id === 'ura')?.value).toBe(2); // 東→南、南対子
  });
});
