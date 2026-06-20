import { YAKU_TABLE, getYaku, yakuDisplayName } from './yaku-table.ts';
import type { YakuId, Yaku } from '../types/index.ts';

/**
 * 役テーブルの翻・喰い下がり・役満フラグが scoring-rules.md §1 と一致するかを直接検証する。
 * 役判定の presence とは別に、学習アプリの肝である「何翻か」を数値で固定する回帰スイート。
 */

// [hanClosed, hanOpen]（hanOpen=null は門前のみ）。scoring-rules §1.1 が正。
const NORMAL: Array<[YakuId, number, number | null]> = [
  ['riichi', 1, null],
  ['double-riichi', 2, null],
  ['ippatsu', 1, null],
  ['menzen-tsumo', 1, null],
  ['pinfu', 1, null],
  ['tanyao', 1, 1],
  ['iipeikou', 1, null],
  ['yakuhai-haku', 1, 1],
  ['yakuhai-hatsu', 1, 1],
  ['yakuhai-chun', 1, 1],
  ['yakuhai-round', 1, 1],
  ['yakuhai-seat', 1, 1],
  ['sanshoku-doujun', 2, 1], // 喰い下がり
  ['sanshoku-doukou', 2, 2], // 喰い下がりなし
  ['ittsuu', 2, 1], // 喰い下がり
  ['chanta', 2, 1], // 喰い下がり
  ['junchan', 3, 2], // 喰い下がり
  ['chiitoitsu', 2, null],
  ['toitoi', 2, 2],
  ['sanankou', 2, 2],
  ['sankantsu', 2, 2],
  ['honroutou', 2, 2],
  ['shousangen', 2, 2],
  ['honitsu', 3, 2], // 喰い下がり
  ['ryanpeikou', 3, null],
  ['chinitsu', 6, 5], // 喰い下がり
  ['haitei', 1, 1],
  ['houtei', 1, 1],
  ['rinshan', 1, 1],
  ['chankan', 1, 1],
];

// 役満：double（もとからダブル役満か）。scoring-rules §1.2。
const YAKUMAN: Array<[YakuId, boolean]> = [
  ['kokushi', false],
  ['kokushi-13', true],
  ['suuankou', false],
  ['suuankou-tanki', true],
  ['daisangen', false],
  ['tsuuiisou', false],
  ['ryuuiisou', false],
  ['chinroutou', false],
  ['chuuren', false],
  ['chuuren-junsei', true],
  ['suukantsu', false],
  ['shousuushi', false],
  ['daisuushi', true],
  ['tenho', false],
  ['chiho', false],
];

describe('yaku-table — 通常役の翻・喰い下がり', () => {
  it.each(NORMAL)('%s は門前 %i 翻 / 喰い下がり %s', (id, closed, open) => {
    const y = getYaku(id) as Extract<Yaku, { yakuman: false }>;
    expect(y).toBeDefined();
    expect(y.yakuman).toBe(false);
    expect(y.hanClosed).toBe(closed);
    expect(y.hanOpen).toBe(open);
  });
});

describe('yaku-table — 役満フラグ', () => {
  it.each(YAKUMAN)('%s は役満（double=%s）', (id, double) => {
    const y = getYaku(id) as Extract<Yaku, { yakuman: true }>;
    expect(y).toBeDefined();
    expect(y.yakuman).toBe(true);
    expect(y.double).toBe(double);
  });
});

describe('yaku-table — 網羅性', () => {
  it('実装済みの全役を NORMAL + YAKUMAN で網羅している', () => {
    const documented = new Set<YakuId>([...NORMAL.map((r) => r[0]), ...YAKUMAN.map((r) => r[0])]);
    const table = new Set(Object.keys(YAKU_TABLE) as YakuId[]);
    expect(documented).toEqual(table);
  });

  it('レア役（未対応）はテーブルに無い', () => {
    expect(getYaku('nagashi-mangan')).toBeUndefined();
    expect(getYaku('renho')).toBeUndefined();
    expect(getYaku('daisharin')).toBeUndefined();
  });
});

describe('yaku-table — 読み（reading）と表示名', () => {
  it('カナ役以外は reading を持つ（初心者向けふりがな）', () => {
    // 役名がすでにカナの役（リーチ・ダブルリーチ）だけ reading 省略
    for (const y of Object.values(YAKU_TABLE) as Yaku[]) {
      if (y.id === 'riichi' || y.id === 'double-riichi') {
        expect(y.reading).toBeUndefined();
      } else {
        expect(y.reading).toBeTruthy();
      }
    }
  });

  it('yakuDisplayName は 役名（読み）を組み立てる', () => {
    expect(yakuDisplayName(getYaku('chiitoitsu')!)).toBe('七対子（チートイツ）');
    expect(yakuDisplayName(getYaku('sanshoku-doujun')!)).toBe('三色同順（サンショクドウジュン）');
  });

  it('reading が無い／役名と同一なら括弧を付けない', () => {
    expect(yakuDisplayName(getYaku('riichi')!)).toBe('リーチ');
    expect(yakuDisplayName({ id: 'pinfu', name: '平和', reading: '平和', yakuman: false, hanClosed: 1, hanOpen: null })).toBe('平和');
  });
});
