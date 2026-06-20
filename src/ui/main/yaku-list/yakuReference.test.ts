import { YAKU_REFERENCE, YAKU_EXAMPLES } from './yakuReference.ts';
import { YAKU_TABLE } from '../../../engine/yaku-table.ts';
import type { Yaku } from '../../../types/index.ts';

describe('YAKU_REFERENCE — YAKU_TABLE との整合', () => {
  it('YAKU_TABLE の全役を過不足なく網羅する', () => {
    const tableIds = Object.keys(YAKU_TABLE).sort();
    const refIds = Object.keys(YAKU_REFERENCE).sort();
    expect(refIds).toEqual(tableIds);
  });

  it('役満は difficulty=役満、通常役は役満以外に割り当てる', () => {
    for (const [id, ref] of Object.entries(YAKU_REFERENCE)) {
      const yaku = YAKU_TABLE[id as keyof typeof YAKU_TABLE] as Yaku;
      if (yaku.yakuman) {
        expect(ref.difficulty).toBe('役満');
      } else {
        expect(ref.difficulty).not.toBe('役満');
      }
    }
  });

  it('条件文は全役で空でない', () => {
    for (const ref of Object.values(YAKU_REFERENCE)) {
      expect(ref.condition.trim().length).toBeGreaterThan(0);
    }
  });

  it('難易度は generation.md §3（見抜き難易度）のアンカーに一致する', () => {
    // 易=初級
    for (const id of ['chiitoitsu', 'tanyao', 'yakuhai-haku', 'toitoi'] as const) {
      expect(YAKU_REFERENCE[id].difficulty).toBe('初級');
    }
    // 中=中級
    for (const id of ['sanshoku-doujun', 'ittsuu', 'honitsu', 'chinitsu', 'iipeikou'] as const) {
      expect(YAKU_REFERENCE[id].difficulty).toBe('中級');
    }
    // 難=上級
    for (const id of ['pinfu', 'chanta', 'sanankou', 'ryanpeikou'] as const) {
      expect(YAKU_REFERENCE[id].difficulty).toBe('上級');
    }
  });

  it('例示手は「形で決まる役」だけが持つ（状況で決まる役は持たない）', () => {
    // 状況・和了方法・風依存で決まる役＝例示手なし
    for (const id of [
      'riichi', 'double-riichi', 'ippatsu', 'menzen-tsumo',
      'haitei', 'houtei', 'rinshan', 'chankan', 'tenho', 'chiho',
      'yakuhai-round', 'yakuhai-seat',
    ] as const) {
      expect(YAKU_EXAMPLES[id]).toBeUndefined();
    }
    // 形で決まる役＝例示手あり（14枚以上の牌列）
    for (const id of ['pinfu', 'chiitoitsu', 'tsuuiisou', 'ryuuiisou', 'kokushi'] as const) {
      expect(YAKU_EXAMPLES[id]!.length).toBeGreaterThanOrEqual(14);
    }
  });
});
