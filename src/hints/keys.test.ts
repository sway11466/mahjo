import { HINT_KEYS, HINT_KEY_SET, YAKU_KEYS, FU_KEYS, DORA_KEYS } from './keys.ts';
import { hintProvider } from './provider.ts';
import { score } from '../engine/score.ts';
import { YAKU_TABLE } from '../engine/yaku-table.ts';
import type { Yaku } from '../types/index.ts';
import { mk, hand, ctx, tbl, rules } from '../engine/__tests__/hands.ts';
import { suited } from '../engine/tiles.ts';

describe('hint keys — 正本', () => {
  it('重複が無く、41キーを持つ', () => {
    expect(HINT_KEYS.length).toBe(new Set(HINT_KEYS).size); // 重複なし
    expect(HINT_KEYS.length).toBe(41); // generic 1 + 非役満役 30 + 符 7 + ドラ 3
  });

  it('役キーは yaku-table の非役満役のみ（役満15は未対応で除外）', () => {
    const nonYakuman = (Object.values(YAKU_TABLE) as Yaku[]).filter((y) => !y.yakuman);
    expect(YAKU_KEYS.length).toBe(nonYakuman.length);
    expect(YAKU_KEYS).not.toContain('yaku:kokushi'); // 役満キーは含まない
    expect(YAKU_KEYS).not.toContain('yaku:daisangen');
  });

  it('符キーに副底（fu:base）を含まない（20符固定＝気づき対象外）', () => {
    expect(FU_KEYS).not.toContain('fu:base');
  });

  it('ドラキーは dora/aka-dora/ura-dora', () => {
    expect(DORA_KEYS).toEqual(['dora', 'aka-dora', 'ura-dora']);
  });

  it('provider が出すキーは全て正本に含まれる（役/点数モード）', () => {
    const t = mk();
    // 役牌白＋ドラ（8s→9s、手に99s）。点数モードで符の段も出る
    const h = hand(
      [t.z('haku'), t.z('haku'), t.m(2), t.m(3), t.m(4), t.p(5), t.p(6), t.p(7), t.s(2), t.s(3), t.s(4), t.s(9), t.s(9)],
      t.z('haku'),
    );
    const res = score(h, tbl({ doraIndicators: [suited('sou', 8)] }), ctx({ win: 'ron', seatWind: 'south' }), rules());
    for (const mode of ['yaku', 'score'] as const) {
      for (const p of hintProvider(h, tbl(), ctx(), res, mode)) {
        expect(HINT_KEY_SET.has(p.key)).toBe(true);
      }
    }
  });
});
