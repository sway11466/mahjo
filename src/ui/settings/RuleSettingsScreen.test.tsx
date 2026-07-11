import { render, screen, fireEvent } from '@testing-library/react';
import { RuleSettingsScreen } from './RuleSettingsScreen.tsx';
import { defaultRuleSettings } from '../../storage/index.ts';
import { getCharacter } from '../../characters/index.ts';
import { yakuDisplayName, YAKU_TABLE, type ScoredYakuId } from '../../engine/yaku-table.ts';
import { seedIds } from '../../engine/generate.ts';
import type { RuleSettings } from '../../types/index.ts';

const mao = getCharacter('mao');

function renderScreen(
  rules: RuleSettings,
  onChange: (next: RuleSettings) => void = () => {},
) {
  render(
    <RuleSettingsScreen
      rules={rules}
      onChange={onChange}
      character={mao}
      onBack={() => {}}
    />,
  );
}

describe('RuleSettingsScreen', () => {
  it('編集可トグル（喰いタン）は反転値で onChange する', () => {
    let next: RuleSettings | null = null;
    renderScreen({ ...defaultRuleSettings(), kuitan: true }, (r) => (next = r));
    fireEvent.click(screen.getByRole('switch', { name: '喰いタン' }));
    expect(next).not.toBeNull();
    expect(next!.kuitan).toBe(false);
  });

  it('赤ドラ枚数のセレクトは選んだ枚数で onChange する（feature-12）', () => {
    let next: RuleSettings | null = null;
    renderScreen(defaultRuleSettings(), (r) => (next = r));
    fireEvent.change(screen.getByRole('combobox', { name: '赤ドラ枚数' }), {
      target: { value: '3' },
    });
    expect(next).not.toBeNull();
    expect(next!.akaDoraCount).toBe(3);
  });

  it('未実装項目（後付け）は操作不可（disabled）', () => {
    renderScreen(defaultRuleSettings());
    expect(screen.getByRole('switch', { name: '後付け' })).toBeDisabled();
  });

  it('出題する役を全オフにはできない（最後のシード役トグルは無効）', () => {
    const seeds = seedIds();
    // 先頭シード役だけ残し、他のシード役を全オフにする。
    const enabledYaku: RuleSettings['enabledYaku'] = {};
    for (const id of seeds.slice(1)) {
      enabledYaku[id as keyof RuleSettings['enabledYaku']] = false;
    }
    renderScreen({ ...defaultRuleSettings(), enabledYaku });

    const lastSeedName = yakuDisplayName(YAKU_TABLE[seeds[0] as ScoredYakuId]);
    expect(screen.getByRole('switch', { name: lastSeedName })).toBeDisabled();
  });
});
