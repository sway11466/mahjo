import { cellFor, manganCell, TABLE_FU, TABLE_HAN } from './scoreTable.ts';

// 値は手計算（scoring-rules §3）と一致するか固定。基本点 a = 符 × 2^(2+翻)。
describe('scoreTable — 既知の点数（scoring-rules §3）', () => {
  it('子30符3翻：ロン3900／ツモ 子1000・親2000', () => {
    const c = cellFor(30, 3, false);
    expect(c.ron).toBe(3900);
    expect(c.tsumo).toEqual({ kind: 'ko', fromKo: 1000, fromOya: 2000 });
  });

  it('子40符3翻：ロン5200／ツモ 子1300・親2600', () => {
    const c = cellFor(40, 3, false);
    expect(c.ron).toBe(5200);
    expect(c.tsumo).toEqual({ kind: 'ko', fromKo: 1300, fromOya: 2600 });
  });

  it('子40符4翻は満貫に切り上がる：ロン8000／ツモ 子2000・親4000', () => {
    const c = cellFor(40, 4, false);
    expect(c.ron).toBe(8000);
    expect(c.tsumo).toEqual({ kind: 'ko', fromKo: 2000, fromOya: 4000 });
  });

  it('親40符3翻：ロン7700', () => {
    expect(cellFor(40, 3, true).ron).toBe(7700);
  });

  it('親30符4翻（切り上げ満貫オフ）：ロン11600／ツモ 3900オール', () => {
    const c = cellFor(30, 4, true);
    expect(c.ron).toBe(11600);
    expect(c.tsumo).toEqual({ kind: 'oya', each: 3900 });
  });
});

describe('scoreTable — 特殊符（20・25）の成立可否', () => {
  it('20符はロンなし（平和ロンは30符）・1翻はツモも無い', () => {
    expect(cellFor(20, 1, false)).toEqual({ ron: null, tsumo: null });
    const c = cellFor(20, 2, false); // 平和ツモ20符2翻
    expect(c.ron).toBeNull();
    expect(c.tsumo).toEqual({ kind: 'ko', fromKo: 400, fromOya: 700 });
  });

  it('25符（七対子）は2翻以上のみ', () => {
    expect(cellFor(25, 1, false)).toEqual({ ron: null, tsumo: null });
    expect(cellFor(25, 2, false).ron).toBe(1600); // 七対子2翻ロン
  });
});

describe('scoreTable — 満貫以上の固定値（§3.1）', () => {
  it('子：満貫ロン8000／ツモ 子2000・親4000、役満32000', () => {
    expect(manganCell(5, false).ron).toBe(8000); // 満貫
    expect(manganCell(5, false).tsumo).toEqual({ kind: 'ko', fromKo: 2000, fromOya: 4000 });
    expect(manganCell(13, false).ron).toBe(32000); // 役満
  });

  it('親：満貫ロン12000／ツモ 子4000、役満48000', () => {
    expect(manganCell(5, true).ron).toBe(12000);
    expect(manganCell(5, true).tsumo).toEqual({ kind: 'oya', each: 4000 });
    expect(manganCell(13, true).ron).toBe(48000);
  });
});

describe('scoreTable — 表の軸', () => {
  it('符は20〜110、翻は1〜4', () => {
    expect(TABLE_FU[0]).toBe(20);
    expect(TABLE_FU[TABLE_FU.length - 1]).toBe(110);
    expect([...TABLE_HAN]).toEqual([1, 2, 3, 4]);
  });
});
