import { FU_SOURCES, MELD_FU, MELD_FU_COLUMNS, FU_SPECIALS } from './fuReference.ts';

describe('fuReference — scoring-rules §2 との整合', () => {
  it('面子符の値が §2 の表どおり（刻子 2/4/4/8・槓子 8/16/16/32）', () => {
    const kotsu = MELD_FU.find((r) => r.meld.startsWith('刻子'))!;
    const kantsu = MELD_FU.find((r) => r.meld.startsWith('槓子'))!;
    expect(kotsu.values).toEqual([2, 4, 4, 8]);
    expect(kantsu.values).toEqual([8, 16, 16, 32]);
  });

  it('面子符の列は 中張明/中張暗/么九明/么九暗 の4列', () => {
    expect(MELD_FU_COLUMNS).toHaveLength(4);
    expect(MELD_FU.every((r) => r.values.length === 4)).toBe(true);
  });

  it('発生源・特例が空でない', () => {
    expect(FU_SOURCES.length).toBeGreaterThan(0);
    expect(FU_SPECIALS.length).toBeGreaterThan(0);
    for (const s of FU_SOURCES) {
      expect(s.source.trim()).not.toBe('');
      expect(s.fu.trim()).not.toBe('');
      expect(s.condition.trim()).not.toBe('');
    }
  });

  it('副底は20符、七対子は25符固定を含む（代表値の固定）', () => {
    expect(FU_SOURCES[0]!.fu).toBe('20符'); // 副底
    expect(FU_SPECIALS.some((s) => s.case.includes('七対子') && s.fu.includes('25'))).toBe(true);
  });
});
